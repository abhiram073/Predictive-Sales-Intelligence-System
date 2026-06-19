import { KPICard } from "@/components/dashboard/KPICard"
import { AIInsights } from "@/components/dashboard/AIInsights"
import { ForecastChart } from "@/components/dashboard/ForecastChart"
import { RiskMonitor } from "@/components/dashboard/RiskMonitor"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { DollarSign, ShoppingCart, Target, Activity as ActivityIcon, Percent, Package, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { getDynamicDashboard } from "@/lib/api"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDynamicDashboard().then(res => {
      setSummary(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  const isDatasetEmpty = !summary || summary.active_products === 0;

  return (
    <motion.div 
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Call-to-Action Banner if no dataset is loaded */}
      {isDatasetEmpty && (
        <motion.div 
          variants={item}
          className="p-6 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No Forecasting Data Available</h3>
              <p className="text-sm text-muted-foreground mt-1">Upload a CSV or XLSX historical sales dataset to generate demand forecasts, KPIs, inventory risks, and AI insights.</p>
            </div>
          </div>
          <Button onClick={() => navigate("/forecasting")} className="w-full md:w-auto shrink-0 shadow-md">
            Open Forecasting Wizard
          </Button>
        </motion.div>
      )}

      {/* Executive KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div onClick={() => navigate("/revenue-analytics")} className="cursor-pointer">
          <KPICard 
            title="Total Revenue" 
            value={`$${(summary?.total_revenue || 0).toLocaleString()}`} 
            trend="18.2%" 
            trendUp={true} 
            icon={DollarSign} 
          />
        </div>
        <div onClick={() => navigate("/orders")} className="cursor-pointer">
          <KPICard 
            title="Total Orders" 
            value={(summary?.total_orders || 0).toLocaleString()} 
            trend="12.4%" 
            trendUp={true} 
            icon={ShoppingCart} 
          />
        </div>
        <div onClick={() => navigate("/model-performance")} className="cursor-pointer">
          <KPICard 
            title="Forecast Accuracy" 
            value={`${(summary?.forecast_accuracy || 0).toFixed(1)}%`} 
            trend="1.1%" 
            trendUp={true} 
            icon={Target} 
            subtitle="Overall Mean Accuracy"
          />
        </div>
        <div onClick={() => navigate("/inventory-health")} className="cursor-pointer">
          <KPICard 
            title="Inventory Health" 
            value={`${(summary?.inventory_health || 100.0).toFixed(0)}/100`} 
            trend="2.4%" 
            trendUp={true} 
            icon={ActivityIcon} 
            subtitle="Optimal Stock Level"
          />
        </div>
        <div onClick={() => navigate("/revenue-analytics")} className="cursor-pointer">
          <KPICard 
            title="Avg Profit Margin" 
            value={`${(summary?.profit_margin || 0).toFixed(1)}%`} 
            trend="0.5%" 
            trendUp={true} 
            icon={Percent} 
            subtitle="Gross Product Margin"
          />
        </div>
        <div onClick={() => navigate("/products")} className="cursor-pointer">
          <KPICard 
            title="Active Products" 
            value={(summary?.active_products || 0).toString()} 
            trend="New SKU Ingestion" 
            trendUp={true} 
            icon={Package} 
            subtitle="Unique Catalog Items"
          />
        </div>
      </motion.div>

      {/* Analytics & Insights */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ForecastChart />
        <AIInsights />
      </motion.div>

      {/* Monitoring & Activity */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskMonitor />
        <ActivityFeed />
      </motion.div>
    </motion.div>
  )
}
