import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { getDynamicInsights } from "@/lib/api"

export function AIInsights() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDynamicInsights()
      .then(res => {
        setInsights(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getIcon = (category: string) => {
    switch (category) {
      case "Revenue": return TrendingUp;
      case "Demand": return Lightbulb;
      case "Inventory": return AlertTriangle;
      default: return Sparkles;
    }
  }

  const getRoute = (category: string) => {
    switch (category) {
      case "Revenue": return "/revenue-analytics";
      case "Demand": return "/analytics";
      case "Inventory": return "/inventory-health";
      case "Profit": return "/revenue-analytics";
      default: return "/analytics";
    }
  }

  return (
    <Card className="col-span-1 lg:col-span-1 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Business Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-4">Loading insights...</div>
        ) : insights.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">No AI insights generated yet. Run forecasting first.</div>
        ) : (
          insights.map((insight, idx) => {
            const Icon = getIcon(insight.category)
            const route = getRoute(insight.category)
            const type = insight.type === 'danger' ? 'destructive' : insight.type === 'warning' ? 'warning' : insight.type === 'success' ? 'success' : 'default'
            
            return (
              <div 
                key={idx} 
                className="flex gap-3 items-start p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border shadow-sm cursor-pointer"
                onClick={() => navigate(route)}
              >
                <div className={`p-2 rounded-full flex-shrink-0 ${type === 'destructive' ? 'bg-red-500/10 text-red-500' : type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' : type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm leading-tight text-foreground/90">{insight.text}</p>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
