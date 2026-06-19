import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { AppLayout } from "@/components/layout/AppLayout"
import Dashboard from "@/pages/Dashboard"
import { UploadWizard } from "@/pages/UploadWizard"

import { SalesAnalytics } from "@/pages/SalesAnalytics"
import { Products, ProductDetails } from "@/pages/Products"
import { Reports } from "@/pages/Reports"
import { Notifications } from "@/pages/Notifications"
import { HelpCenter, Settings, Inventory } from "@/pages/MiscPages"
import { RevenueAnalytics, Orders, ModelPerformance, InventoryHealth } from "@/pages/DrillDowns"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<SalesAnalytics />} />
            <Route path="/forecasting" element={<UploadWizard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<HelpCenter />} />
            
            <Route path="/revenue-analytics" element={<RevenueAnalytics />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/model-performance" element={<ModelPerformance />} />
            <Route path="/inventory-health" element={<InventoryHealth />} />
            
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </AppLayout>
      </Router>
    </ThemeProvider>
  )
}

export default App
