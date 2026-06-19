import { useState, useEffect } from "react"
import { getProducts, getProductDetails } from "@/lib/api"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine 
} from "recharts"
import { ArrowLeft } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

export function Products() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getProducts()
      .then(res => {
        setProducts(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto py-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Product Catalog</h2>
        <p className="text-muted-foreground mt-2">Browse the product portfolio, price levels, and select items to inspect demand forecasts.</p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground text-center py-12">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-12">No products loaded. Please run the Forecasting Wizard first.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <Card 
              key={p.id} 
              className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer bg-card/60 backdrop-blur-md flex flex-col justify-between"
              onClick={() => navigate(`/products/${p.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                  <span className="text-xs text-muted-foreground font-semibold">SKU: {p.sku}</span>
                </div>
                <CardTitle className="text-lg font-bold mt-2 truncate">{p.name}</CardTitle>
                <CardDescription>Price: ${p.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex justify-end">
                <Button size="sm" variant="ghost" className="text-primary hover:text-primary-foreground">
                  View Forecast Analytics
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function ProductDetails() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    getProductDetails(parseInt(id))
      .then(res => {
        const prod = res.data
        setProduct(prod)
        
        // Format sales & forecasts for Recharts
        const mergedMap = new Map()
        prod.sales.forEach((s: any) => {
          mergedMap.set(s.date, { date: s.date, historical: s.units, forecast: null })
        })
        prod.forecasts.forEach((f: any) => {
          if (mergedMap.has(f.date)) {
            mergedMap.get(f.date).forecast = f.predicted
          } else {
            mergedMap.set(f.date, { date: f.date, historical: null, forecast: f.predicted })
          }
        })
        
        // Connect lines
        if (prod.sales.length > 0 && prod.forecasts.length > 0) {
          const lastSale = prod.sales[prod.sales.length - 1]
          if (mergedMap.has(lastSale.date)) {
            mergedMap.get(lastSale.date).forecast = lastSale.units
          }
        }
        
        const sorted = Array.from(mergedMap.values()).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setChartData(sorted)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading details...</div>
  }

  if (!product) {
    return <div className="p-8 text-center text-red-500">Product details not found.</div>
  }

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto py-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/products")} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{product.name}</h2>
          <p className="text-muted-foreground mt-0.5 font-medium">SKU: {product.sku} • Category: {product.category}</p>
        </div>
      </div>

      {/* KPI Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold text-xs text-primary uppercase tracking-wider">Unit Sales Price</CardDescription>
            <CardTitle className="text-2xl font-bold">${product.price.toLocaleString(undefined, {minimumFractionDigits:2})}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold text-xs text-primary uppercase tracking-wider">Current Stock Position</CardDescription>
            <CardTitle className="text-2xl font-bold">{product.inventory?.current_stock ?? "N/A"} units</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold text-xs text-primary uppercase tracking-wider">Optimal Safety Stock</CardDescription>
            <CardTitle className="text-2xl font-bold">{product.inventory?.safety_stock ?? "N/A"} units</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold text-xs text-primary uppercase tracking-wider">AI Reorder Threshold</CardDescription>
            <CardTitle className="text-2xl font-bold">{product.inventory?.reorder_point ?? "N/A"} units</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recharts chart */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Daily Forecast Analytics (Units Sold)</CardTitle>
          <CardDescription>Historical sales volume vs AI projected demand horizon</CardDescription>
        </CardHeader>
        <CardContent className="h-[360px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorHistUnit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorForeUnit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
              
              <Area type="monotone" dataKey="historical" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHistUnit)" name="Historical Units Sold" />
              <Area type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorForeUnit)" name="Forecasted Demand" />
              
              {product.inventory && (
                <ReferenceLine y={product.inventory.reorder_point} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Reorder Point', position: 'top', fill: '#ef4444', fontSize: 10 }} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
