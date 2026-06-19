import axios from "axios";

const rawURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const baseURL = rawURL.endsWith("/api/v1") ? rawURL : `${rawURL}/api/v1`;

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Existing APIs
export const getDashboardSummary = () => api.get("/dashboard/summary");
export const getSalesTrend = (days: number = 30) => api.get(`/dashboard/sales-trend?days=${days}`);
export const getForecastTrend = (days: number = 30) => api.get(`/dashboard/forecast-trend?days=${days}`);
export const getProductPerformance = () => api.get("/dashboard/product-performance");

export const getInventoryRisk = () => api.get("/inventory/risk");
export const getProducts = () => api.get("/products/");
export const getNotifications = () => api.get("/notifications/");
export const getActivities = () => api.get("/activities/");

export const searchGlobal = (query: string) => api.get(`/search/?query=${query}`);

// New Forecasting APIs
export const uploadDataset = (formData: FormData) => 
  api.post("/forecasting/upload-dataset", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

export const validateDataset = (datasetId: number) => 
  api.post("/forecasting/validate-dataset", { dataset_id: datasetId });

export const trainModel = (params: {
  dataset_id: number;
  model_type: string;
  clean_missing: boolean;
  remove_outliers: boolean;
  generate_features: boolean;
}) => api.post("/forecasting/train-model", params);

export const generateForecast = (params: {
  dataset_id: number;
  horizon_days: number;
}) => api.post("/forecasting/generate-forecast", params);

export const getDynamicDashboard = () => api.get("/forecasting/dashboard");
export const getDynamicInsights = () => api.get("/forecasting/insights");
export const getDynamicInventoryRisk = () => api.get("/forecasting/inventory-risk");
export const getDynamicTopProducts = () => api.get("/forecasting/top-products");

export const getReportsList = () => api.get("/reports/");
export const getReportDownloadUrl = (datasetId: number) => {
  const rawBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const base = rawBase.endsWith("/api/v1") ? rawBase : `${rawBase}/api/v1`;
  return `${base}/forecasting/reports/download/${datasetId}`;
};

export const getProductDetails = (productId: number) => 
  api.get(`/forecasting/products/${productId}/details`);

export default api;
