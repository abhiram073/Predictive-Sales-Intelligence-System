import { useState, useEffect } from "react"
import { getDynamicDashboard, getDynamicTopProducts } from "@/lib/api"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend, Line, ComposedChart, Area,
  BarChart, Bar
} from "recharts"
import { 
  DollarSign, ShoppingBag, TrendingUp, Package, Layers, 
  ArrowUpRight, BarChart3, RefreshCw, AlertCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
}

export function SalesAnalytics() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [topProductsData, setTopProductsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<number>(30) // 7, 30, 90, 365
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "categories">("overview")
  const navigate = useNavigate()

  const fetchData = () => {
    setLoading(true)
    Promise.all([getDynamicDashboard(), getDynamicTopProducts()])
      .then(([dashRes, topRes]) => {
        setDashboardData(dashRes.data)
        setTopProductsData(topRes.data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error loading analytics data:", err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter trend data based on timeRange
  const getFilteredTrendData = () => {
    if (!dashboardData || !dashboardData.sales_trend) return []
    const trend = [...dashboardData.sales_trend]
    if (timeRange === 365) return trend
    return trend.slice(-timeRange)
  }

  const filteredTrend = getFilteredTrendData()

  // Calculate dynamic KPIs based on the filtered timeframe
  const rangeRevenue = filteredTrend.reduce((acc, row) => acc + (row.revenue || 0), 0)
  const rangeUnits = filteredTrend.reduce((acc, row) => acc + (row.units || 0), 0)
  const rangeAOV = rangeUnits > 0 ? rangeRevenue / rangeUnits : 0

  // Category aggregations computed on-the-fly from top products list
  const getCategoryStats = () => {
    if (!topProductsData || !topProductsData.highest_revenue) return []
    const categoriesMap: Record<string, { category: string; revenue: number; units: number; count: number }> = {}
    
    topProductsData.highest_revenue.forEach((p: any) => {
      const cat = p.category || "Uncategorized"
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = { category: cat, revenue: 0, units: 0, count: 0 }
      }
      categoriesMap[cat].revenue += p.revenue || 0
      categoriesMap[cat].count += 1
    })

    if (topProductsData.best_selling) {
      topProductsData.best_selling.forEach((p: any) => {
        const cat = p.category || "Uncategorized"
        if (categoriesMap[cat]) {
          categoriesMap[cat].units += p.units || 0
        }
      })
    }

    return Object.values(categoriesMap).sort((a, b) => b.revenue - a.revenue)
  }

  const categoryStats = getCategoryStats()
  const totalCategoryRevenue = categoryStats.reduce((sum, item) => sum + item.revenue, 0)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading sales intelligence...</p>
      </div>
    )
  }

  const isDatasetEmpty = !dashboardData || dashboardData.active_products === 0

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-indigo-500 to-indigo-600 bg-clip-text text-transparent">
            Sales Performance & Analytics
          </h2>
          <p className="text-muted-foreground mt-2 font-medium">
            Deep-dive visual reporting and performance standings of your products.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2 shrink-0">
            <RefreshCw className="w-4 h-4" /> Reload
          </Button>
          {!isDatasetEmpty && (
            <div className="flex bg-muted p-1 rounded-lg border text-xs font-semibold shrink-0">
              {[7, 30, 90, 365].map((d) => (
                <button
                  key={d}
                  onClick={() => setTimeRange(d)}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    timeRange === d 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d === 365 ? "1Y" : `${d}D`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isDatasetEmpty ? (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center flex flex-col items-center justify-center shadow-md">
          <AlertCircle className="w-12 h-12 text-primary mb-4 animate-pulse" />
          <h3 className="text-xl font-bold">No Transaction Data Available</h3>
          <p className="text-muted-foreground max-w-md mt-2">
            Please import your transactional sales dataset using the wizard to populate interactive charts, metrics, and leaderboards.
          </p>
          <Button onClick={() => navigate("/forecasting")} className="mt-6 shadow-lg">
            Import Dataset
          </Button>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Tab Switcher */}
          <div className="flex border-b border-border pb-px gap-4">
            {[
              { id: "overview", name: "Overview & Trends", icon: BarChart3 },
              { id: "products", name: "Product Standings", icon: Package },
              { id: "categories", name: "Category Analysis", icon: Layers }
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all relative ${
                    isActive 
                      ? "border-primary text-primary" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabUnderline" 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab Contents */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Executive Performance Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-card/40 backdrop-blur-md hover:shadow-md transition-all border-emerald-500/10">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription className="font-semibold text-xs text-primary uppercase tracking-wider">Timeframe Revenue</CardDescription>
                        <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-500">
                          <DollarSign className="w-4 h-4" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardTitle className="text-3xl font-black">
                          ${rangeRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1.5 font-semibold">
                          Total gross revenue in last {timeRange} days
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/40 backdrop-blur-md hover:shadow-md transition-all border-blue-500/10">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription className="font-semibold text-xs text-primary uppercase tracking-wider">Volume Sold</CardDescription>
                        <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardTitle className="text-3xl font-black">
                          {rangeUnits.toLocaleString()} units
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1.5 font-semibold">
                          Total quantities sold in last {timeRange} days
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/40 backdrop-blur-md hover:shadow-md transition-all border-indigo-500/10">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription className="font-semibold text-xs text-primary uppercase tracking-wider">Avg Order Value (AOV)</CardDescription>
                        <div className="p-2 bg-indigo-500/10 rounded-full text-indigo-500">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardTitle className="text-3xl font-black">
                          ${rangeAOV.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1.5 font-semibold">
                          Average basket value per item transaction
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Composed Chart */}
                  <Card className="shadow-lg bg-card/40 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="text-lg">Revenue & Volume Timeline</CardTitle>
                      <CardDescription>Daily gross billing (Area) aligned with unit transaction levels (Line)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] w-full pt-4">
                      {filteredTrend.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No trend points available.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={filteredTrend}>
                            <defs>
                              <linearGradient id="colorRevArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                            />
                            <YAxis 
                              yAxisId="left"
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                              tickFormatter={(v) => `$${v.toLocaleString()}`}
                            />
                            <YAxis 
                              yAxisId="right"
                              orientation="right"
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                              tickFormatter={(v) => `${v.toLocaleString()}`}
                            />
                            <RechartsTooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                borderColor: 'hsl(var(--border))', 
                                borderRadius: '8px',
                                textAlign: 'left'
                              }} 
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Area 
                              yAxisId="left"
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="#10b981" 
                              strokeWidth={3} 
                              fillOpacity={1} 
                              fill="url(#colorRevArea)" 
                              name="Gross Revenue ($)" 
                            />
                            <Line 
                              yAxisId="right"
                              type="monotone" 
                              dataKey="units" 
                              stroke="#3b82f6" 
                              strokeWidth={2.5} 
                              dot={{ r: 2 }}
                              activeDot={{ r: 5 }}
                              name="Units Sold" 
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "products" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Grossing Products */}
                  <Card className="shadow-md bg-card/40 backdrop-blur-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>Top Grossing Products</span>
                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">Revenue</Badge>
                      </CardTitle>
                      <CardDescription>Product catalog items sorted by cumulative sales value</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {topProductsData?.highest_revenue?.map((p: any, idx: number) => {
                        const share = rangeRevenue > 0 ? (p.revenue / rangeRevenue) * 100 : 0
                        return (
                          <div 
                            key={idx} 
                            onClick={() => navigate(`/products/${p.id}`)}
                            className="p-3 border rounded-xl hover:border-primary/30 transition-all cursor-pointer bg-background/30 hover:bg-background/60"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-sm truncate max-w-[240px]">{p.name}</h4>
                                <span className="text-xs text-muted-foreground font-semibold">SKU: {p.sku}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-extrabold text-sm">${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                <span className="block text-[10px] text-muted-foreground font-medium">{p.category}</span>
                              </div>
                            </div>
                            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, share * 3)}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>

                  {/* Best Selling Products */}
                  <Card className="shadow-md bg-card/40 backdrop-blur-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>Best Sellers (By Volume)</span>
                        <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/10">Units</Badge>
                      </CardTitle>
                      <CardDescription>Items sorted by total quantities shipped</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {topProductsData?.best_selling?.map((p: any, idx: number) => {
                        const share = rangeUnits > 0 ? (p.units / rangeUnits) * 100 : 0
                        return (
                          <div 
                            key={idx} 
                            onClick={() => navigate(`/products/${p.id}`)}
                            className="p-3 border rounded-xl hover:border-primary/30 transition-all cursor-pointer bg-background/30 hover:bg-background/60"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-sm truncate max-w-[240px]">{p.name}</h4>
                                <span className="text-xs text-muted-foreground font-semibold">SKU: {p.sku}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-extrabold text-sm">{p.units.toLocaleString()} units</span>
                                <span className="block text-[10px] text-muted-foreground font-medium">{p.category}</span>
                              </div>
                            </div>
                            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, share * 3)}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "categories" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Category Share Chart */}
                    <Card className="shadow-md bg-card/40 backdrop-blur-md lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-lg">Category Contribution</CardTitle>
                        <CardDescription>Visual comparison of total billing across product segments</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[300px] w-full pt-4">
                        {categoryStats.length === 0 ? (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No category details.
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryStats} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                              <XAxis 
                                type="number" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                              />
                              <YAxis 
                                dataKey="category" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                                width={100}
                              />
                              <RechartsTooltip 
                                formatter={(v) => [`$${parseFloat(v as string).toLocaleString()}`, 'Revenue']}
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--card))', 
                                  borderColor: 'hsl(var(--border))', 
                                  borderRadius: '8px' 
                                }} 
                              />
                              <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>

                    {/* Quick Category Summary Cards */}
                    <Card className="shadow-md bg-card/40 backdrop-blur-md flex flex-col justify-between">
                      <CardHeader>
                        <CardTitle className="text-lg">Product Diversity</CardTitle>
                        <CardDescription>Composition of your store catalog</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-xl bg-background/20">
                          <div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Unique Verticals</span>
                            <span className="block text-2xl font-black mt-1">{categoryStats.length}</span>
                          </div>
                          <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-full">
                            <Layers className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-xl bg-background/20">
                          <div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Total Active SKUs</span>
                            <span className="block text-2xl font-black mt-1">{dashboardData?.active_products || 0}</span>
                          </div>
                          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-full">
                            <Package className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="p-3 border border-indigo-500/20 rounded-xl bg-indigo-500/5 text-xs text-indigo-500 flex gap-2 items-start">
                          <ArrowUpRight className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Dynamic Categorization Active</p>
                            <p className="text-muted-foreground mt-0.5 text-[10px]">
                              Categories are dynamically extracted and grouped on-the-fly from product descriptors inside the uploaded dataset.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Categories Breakdown Table */}
                  <Card className="shadow-md bg-card/40 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="text-lg">Category Performance List</CardTitle>
                      <CardDescription>Summary of category share percentages and item distributions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-xl overflow-hidden">
                        <table className="w-full border-collapse">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b text-left">Category</th>
                              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b text-left">SKU Count</th>
                              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b text-left">Units Sold</th>
                              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b text-left">Total Revenue</th>
                              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b text-left">Revenue Share</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryStats.map((cat, idx) => {
                              const share = totalCategoryRevenue > 0 ? (cat.revenue / totalCategoryRevenue) * 100 : 0
                              return (
                                <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                  <td className="px-4 py-3 text-sm font-bold border-b text-left">{cat.category}</td>
                                  <td className="px-4 py-3 text-sm border-b text-left">{cat.count} products</td>
                                  <td className="px-4 py-3 text-sm border-b text-left">{cat.units.toLocaleString()} units</td>
                                  <td className="px-4 py-3 text-sm border-b text-left font-semibold">${cat.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                  <td className="px-4 py-3 text-sm border-b text-left">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-indigo-500 text-xs w-8">{share.toFixed(1)}%</span>
                                      <div className="w-20 bg-muted h-1.5 rounded-full overflow-hidden shrink-0">
                                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${share}%` }} />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
