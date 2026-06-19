import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { getSalesTrend, getForecastTrend } from "@/lib/api"

export function ForecastChart() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getSalesTrend(days), getForecastTrend(days)])
      .then(([salesRes, forecastRes]) => {
        const sales = salesRes.data;
        const forecasts = forecastRes.data;
        
        // Merge data for Recharts
        const mergedMap = new Map();
        sales.forEach((s: any) => {
          mergedMap.set(s.date, { date: s.date, historical: s.revenue, forecast: null });
        });
        
        // Add connection point if possible
        let lastHistoricalDate = sales.length > 0 ? sales[sales.length - 1].date : null;
        let lastHistoricalRev = sales.length > 0 ? sales[sales.length - 1].revenue : null;

        forecasts.forEach((f: any) => {
          if (!mergedMap.has(f.date)) {
            mergedMap.set(f.date, { date: f.date, historical: null, forecast: f.predicted });
          } else {
            mergedMap.get(f.date).forecast = f.predicted;
          }
        });

        // Set the connection point so the line doesn't break
        if (lastHistoricalDate && mergedMap.has(lastHistoricalDate)) {
          mergedMap.get(lastHistoricalDate).forecast = lastHistoricalRev;
        }

        const mergedArray = Array.from(mergedMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setData(mergedArray);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [days]);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Forecast Analytics</CardTitle>
          <CardDescription>Historical sales vs AI projected demand</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant={days === 365 ? "default" : "outline"} size="sm" onClick={() => setDays(365)}>1Y</Button>
          <Button variant={days === 90 ? "default" : "outline"} size="sm" onClick={() => setDays(90)}>90D</Button>
          <Button variant={days === 30 ? "default" : "outline"} size="sm" onClick={() => setDays(30)}>30D</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full mt-4">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">Loading chart data...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dx={-10} tickFormatter={(value) => `$${(value/1000).toFixed(1)}k`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                
                <Area type="monotone" dataKey="historical" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHistorical)" />
                <Area type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorForecast)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
