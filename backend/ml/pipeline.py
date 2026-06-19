import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
import lightgbm as lgb
from prophet import Prophet
from datetime import timedelta, datetime
import logging
import warnings

# Mute warnings from models
warnings.filterwarnings('ignore')
logging.getLogger('prophet').setLevel(logging.WARNING)
logging.getLogger('cmdstanpy').setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

class ForecastingPipeline:
    def __init__(self, df: pd.DataFrame):
        """
        Expects a DataFrame with columns: 
        Date, Product_ID, Product_Name, Category, Units_Sold, Price, Revenue, Inventory_Level
        (Case-insensitive, standardized internally)
        """
        self.df = df.copy()
        # Standardize column names
        self.df.columns = [c.strip().lower() for c in self.df.columns]
        rename_map = {
            'product_id': 'product_id',
            'product_name': 'product_name',
            'category': 'category',
            'units_sold': 'units_sold',
            'price': 'price',
            'revenue': 'revenue',
            'inventory_level': 'inventory_level',
            'date': 'date'
        }
        # Rename common variations
        cols = list(self.df.columns)
        for original, standard in rename_map.items():
            for col in cols:
                if col == original or col.replace('_', '') == original.replace('_', ''):
                    self.df.rename(columns={col: standard}, inplace=True)
                    break
        
        # Parse date
        if 'date' in self.df.columns:
            self.df['date'] = pd.to_datetime(self.df['date'])
        self.df = self.df.sort_values('date')

    def clean_data(self, clean_missing: bool = True, remove_outliers: bool = True):
        """
        Step 3: Clean dataset automatically.
        - Missing value handling
        - Outlier detection (IQR capping)
        - Date formatting
        - Revenue calculation
        """
        df = self.df.copy()
        
        # 1. Date formatting & dropping rows with invalid dates
        df = df.dropna(subset=['date'])
        
        # 2. Missing value handling
        if clean_missing:
            # Categorical
            if 'product_name' in df.columns:
                df['product_name'] = df['product_name'].fillna('Unknown Product')
            if 'category' in df.columns:
                df['category'] = df['category'].fillna('Uncategorized')
                
            # Numeric
            numeric_cols = ['units_sold', 'price', 'revenue', 'inventory_level']
            for col in numeric_cols:
                if col in df.columns:
                    median_val = df[col].median()
                    # If empty series
                    if pd.isna(median_val):
                        median_val = 0.0
                    df[col] = df[col].fillna(median_val)
        
        # 3. Revenue calculation: check and re-calculate
        if 'units_sold' in df.columns and 'price' in df.columns:
            # Force/recompute revenue
            df['revenue'] = df['units_sold'] * df['price']
            
        # 4. Outlier detection & handling in Units_Sold
        if remove_outliers and 'units_sold' in df.columns:
            # Clean per product
            cleaned_dfs = []
            for pid, group in df.groupby('product_id'):
                g = group.copy()
                q1 = g['units_sold'].quantile(0.25)
                q3 = g['units_sold'].quantile(0.75)
                iqr = q3 - q1
                lower_bound = max(0, q1 - 1.5 * iqr)
                upper_bound = q3 + 1.5 * iqr
                # Cap units sold
                g['units_sold'] = g['units_sold'].clip(lower=lower_bound, upper=upper_bound)
                # Recalculate revenue after capping
                if 'price' in g.columns:
                    g['revenue'] = g['units_sold'] * g['price']
                cleaned_dfs.append(g)
            df = pd.concat(cleaned_dfs).sort_values('date') if cleaned_dfs else df

        self.df = df
        return df

    def generate_features_df(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Step 4: Generate features.
        Create: Day, Month, Quarter, Year, Weekend indicator, Rolling averages, Lag features
        """
        df = df.copy()
        df['date'] = pd.to_datetime(df['date'])
        
        # Time components
        df['day'] = df['date'].dt.day
        df['month'] = df['date'].dt.month
        df['quarter'] = df['date'].dt.quarter
        df['year'] = df['date'].dt.year
        df['dayofweek'] = df['date'].dt.dayofweek
        df['is_weekend'] = (df['dayofweek'] >= 5).astype(int)
        
        # Sort values to ensure correct rolling/lag calculations
        df = df.sort_values(['product_id', 'date'])
        
        # Grouped by product for lag and rolling features
        df['rolling_mean_7'] = df.groupby('product_id')['units_sold'].transform(lambda x: x.rolling(7, min_periods=1).mean())
        df['rolling_mean_14'] = df.groupby('product_id')['units_sold'].transform(lambda x: x.rolling(14, min_periods=1).mean())
        
        df['lag_1'] = df.groupby('product_id')['units_sold'].shift(1)
        df['lag_7'] = df.groupby('product_id')['units_sold'].shift(7)
        df['lag_14'] = df.groupby('product_id')['units_sold'].shift(14)
        
        # Fill lags that shifted into NaN
        df['lag_1'] = df['lag_1'].fillna(df['units_sold'])
        df['lag_7'] = df['lag_7'].fillna(df['units_sold'])
        df['lag_14'] = df['lag_14'].fillna(df['units_sold'])
        df['rolling_mean_7'] = df['rolling_mean_7'].fillna(df['units_sold'])
        df['rolling_mean_14'] = df['rolling_mean_14'].fillna(df['units_sold'])
        
        return df

    def evaluate(self, y_true, y_pred):
        mae = mean_absolute_error(y_true, y_pred)
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        try:
            r2 = r2_score(y_true, y_pred)
        except Exception:
            r2 = 0.0
            
        # WAPE-based forecast accuracy or simple error-based accuracy percentage
        mean_val = np.mean(y_true)
        if mean_val > 0:
            mape = np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1)))
            accuracy = max(0.0, min(100.0, 100.0 * (1.0 - mape)))
            # If WAPE is better:
            # wape = np.sum(np.abs(y_true - y_pred)) / np.sum(y_true)
            # accuracy = max(0.0, min(100.0, 100.0 * (1.0 - wape)))
        else:
            accuracy = 100.0
            
        return {
            'mae': float(mae),
            'rmse': float(rmse),
            'r2': float(r2),
            'accuracy': float(accuracy)
        }

    def train_models_per_product(self, model_type: str = 'auto'):
        """
        Step 5: Train forecasting model.
        Returns:
            best_model_details: dict mapping product_id to (trained_model_object, best_model_name, metrics)
            overall_metrics: average MAE, RMSE, R2, accuracy across all products
        """
        # Feature generate first
        df_feat = self.generate_features_df(self.df)
        
        feature_cols = ['day', 'month', 'quarter', 'year', 'is_weekend', 'rolling_mean_7', 'rolling_mean_14', 'lag_1', 'lag_7', 'lag_14']
        
        results = {}
        all_product_metrics = []
        
        for pid, group in df_feat.groupby('product_id'):
            group = group.sort_values('date')
            if len(group) < 14:
                # Fallback model if not enough rows
                logger.info(f"Product {pid} has less than 14 data rows. Using baseline Linear Regression.")
                lr = LinearRegression()
                X = group[feature_cols]
                y = group['units_sold']
                lr.fit(X, y)
                preds = lr.predict(X)
                metrics = self.evaluate(y, preds)
                results[pid] = {
                    'model': lr,
                    'name': 'Linear Regression',
                    'metrics': metrics
                }
                all_product_metrics.append(metrics)
                continue
                
            # Split train and test: last 7 days as test
            split_idx = len(group) - 7
            train_group = group.iloc[:split_idx]
            test_group = group.iloc[split_idx:]
            
            X_train, y_train = train_group[feature_cols], train_group['units_sold']
            X_test, y_test = test_group[feature_cols], test_group['units_sold']
            
            candidate_models = {}
            candidate_metrics = {}
            
            # Helper to train and evaluate
            def fit_eval(name, clf):
                try:
                    clf.fit(X_train, y_train)
                    preds = clf.predict(X_test)
                    candidate_models[name] = clf
                    candidate_metrics[name] = self.evaluate(y_test, preds)
                except Exception as e:
                    logger.error(f"Error training {name} for {pid}: {e}")
            
            # 1. XGBoost
            if model_type.lower() in ['xgboost', 'auto']:
                fit_eval('XGBoost', xgb.XGBRegressor(objective='reg:squarederror', n_estimators=50, max_depth=4, random_state=42))
            
            # 2. LightGBM
            if model_type.lower() in ['lightgbm', 'auto']:
                fit_eval('LightGBM', lgb.LGBMRegressor(n_estimators=50, max_depth=4, random_state=42, verbose=-1))
                
            # 3. Random Forest
            if model_type.lower() in ['random_forest', 'random forest', 'auto']:
                fit_eval('Random Forest', RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42))
                
            # 4. Prophet
            if model_type.lower() in ['prophet', 'auto']:
                try:
                    prophet_train = train_group[['date', 'units_sold']].rename(columns={'date': 'ds', 'units_sold': 'y'})
                    p_model = Prophet(daily_seasonality=False, weekly_seasonality=True, yearly_seasonality=False)
                    p_model.fit(prophet_train)
                    
                    future = test_group[['date']].rename(columns={'date': 'ds'})
                    forecast = p_model.predict(future)
                    preds = np.maximum(forecast['yhat'].values, 0)
                    
                    candidate_models['Prophet'] = p_model
                    candidate_metrics['Prophet'] = self.evaluate(y_test, preds)
                except Exception as e:
                    logger.error(f"Error training Prophet for {pid}: {e}")
            
            # Pick best or use specific
            if not candidate_metrics:
                # fallback
                lr = LinearRegression()
                lr.fit(X_train, y_train)
                candidate_models['Linear Regression'] = lr
                candidate_metrics['Linear Regression'] = self.evaluate(y_test, lr.predict(X_test))
                
            if model_type.lower() == 'auto' or model_type.lower() == 'auto select best model':
                best_name = min(candidate_metrics, key=lambda k: candidate_metrics[k]['mae'])
            else:
                # Find matching specific model, else use first available
                spec_name = [k for k in candidate_metrics.keys() if model_type.lower().replace('_', '') in k.lower().replace(' ', '')]
                best_name = spec_name[0] if spec_name else list(candidate_metrics.keys())[0]
                
            # Fit model on ALL data
            final_model = candidate_models[best_name]
            if best_name == 'Prophet':
                try:
                    all_train = group[['date', 'units_sold']].rename(columns={'date': 'ds', 'units_sold': 'y'})
                    final_model = Prophet(daily_seasonality=False, weekly_seasonality=True, yearly_seasonality=False)
                    final_model.fit(all_train)
                except Exception:
                    pass
            else:
                try:
                    final_model.fit(group[feature_cols], group['units_sold'])
                except Exception:
                    pass
                    
            results[pid] = {
                'model': final_model,
                'name': best_name,
                'metrics': candidate_metrics[best_name]
            }
            all_product_metrics.append(candidate_metrics[best_name])
            
        # Compute overall stats
        avg_mae = np.mean([m['mae'] for m in all_product_metrics]) if all_product_metrics else 0.0
        avg_rmse = np.mean([m['rmse'] for m in all_product_metrics]) if all_product_metrics else 0.0
        avg_r2 = np.mean([m['r2'] for m in all_product_metrics]) if all_product_metrics else 0.0
        avg_acc = np.mean([m['accuracy'] for m in all_product_metrics]) if all_product_metrics else 0.0
        
        overall = {
            'mae': float(avg_mae),
            'rmse': float(avg_rmse),
            'r2': float(avg_r2),
            'accuracy': float(avg_acc)
        }
        
        return results, overall

    def forecast_product(self, pid, model_info, horizon_days: int) -> pd.DataFrame:
        """
        Generates predictions for target product step-by-step (autoregressive) or Prophet.
        """
        model = model_info['model']
        model_name = model_info['name']
        
        prod_data = self.df[self.df['product_id'] == pid].sort_values('date')
        if len(prod_data) == 0:
            return pd.DataFrame()
            
        last_row = prod_data.iloc[-1]
        last_date = last_row['date']
        
        future_dates = [last_date + timedelta(days=i) for i in range(1, horizon_days + 1)]
        
        if model_name == 'Prophet':
            future_df = pd.DataFrame({'ds': future_dates})
            try:
                forecast = model.predict(future_df)
                predicted = np.maximum(np.round(forecast['yhat'].values), 0)
                # Compute confidence interval bounds
                lower_ci = np.maximum(np.round(forecast['yhat_lower'].values), 0)
                upper_ci = np.maximum(np.round(forecast['yhat_upper'].values), 0)
            except Exception:
                # Prophet fallback
                predicted = np.array([float(last_row['units_sold'])] * horizon_days)
                lower_ci = predicted * 0.8
                upper_ci = predicted * 1.2
            
            return pd.DataFrame({
                'date': future_dates,
                'predicted_sales': predicted,
                'lower_ci': lower_ci,
                'upper_ci': upper_ci,
                'trend': predicted # trend line
            })
            
        # Recursive prediction for tabular models
        # Need historical data to compute rolling/lag
        feature_cols = ['day', 'month', 'quarter', 'year', 'is_weekend', 'rolling_mean_7', 'rolling_mean_14', 'lag_1', 'lag_7', 'lag_14']
        
        # Build active series: we keep the last 30 historical records of units_sold to calculate lags/rolling
        history_df = prod_data[['date', 'units_sold']].copy().sort_values('date')
        
        forecast_results = []
        
        for f_date in future_dates:
            # Build lag_1, lag_7, lag_14
            # lag_1 is the last units_sold in active series
            lag_1 = history_df.iloc[-1]['units_sold'] if len(history_df) >= 1 else 0
            lag_7 = history_df.iloc[-7]['units_sold'] if len(history_df) >= 7 else lag_1
            lag_14 = history_df.iloc[-14]['units_sold'] if len(history_df) >= 14 else lag_7
            
            # Rolling means
            rolling_7 = history_df.iloc[-7:]['units_sold'].mean() if len(history_df) >= 7 else history_df['units_sold'].mean()
            rolling_14 = history_df.iloc[-14:]['units_sold'].mean() if len(history_df) >= 14 else history_df['units_sold'].mean()
            
            # Construct row
            row_feat = {
                'day': f_date.day,
                'month': f_date.month,
                'quarter': f_date.quarter,
                'year': f_date.year,
                'is_weekend': int(f_date.dayofweek >= 5),
                'rolling_mean_7': rolling_7,
                'rolling_mean_14': rolling_14,
                'lag_1': lag_1,
                'lag_7': lag_7,
                'lag_14': lag_14
            }
            
            row_df = pd.DataFrame([row_feat])[feature_cols]
            pred = max(0.0, float(model.predict(row_df)[0]))
            
            forecast_results.append({
                'date': f_date,
                'predicted_sales': round(pred, 2),
                'lower_ci': round(max(0.0, pred * 0.85), 2),
                'upper_ci': round(pred * 1.15, 2),
                'trend': round(pred, 2)
            })
            
            # Append predicted row back to history to update lag/rolling for future dates
            new_hist_row = pd.DataFrame([{'date': f_date, 'units_sold': pred}])
            history_df = pd.concat([history_df, new_hist_row], ignore_index=True)
            
        return pd.DataFrame(forecast_results)
