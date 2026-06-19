import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getDynamicInventoryRisk } from "@/lib/api"

export function RiskMonitor() {
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDynamicInventoryRisk()
      .then(res => {
        // Filter to only show products at risk (Critical or Medium)
        const atRisk = res.data.filter((item: any) => item.risk_level !== 'Healthy');
        setRisks(atRisk);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <Card className="col-span-1 lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Inventory Risk Monitor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-4">Loading stock statuses...</div>
          ) : risks.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No critical inventory risks detected. All stock healthy.</div>
          ) : (
            risks.map((item, idx) => {
              return (
                <div 
                  key={idx} 
                  className="flex justify-between items-center p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/products/${item.product_id}`)}
                >
                  <div>
                    <p className="font-medium text-sm">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">{item.current_stock} in stock • Reorder at {item.reorder_point}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={item.risk_level === 'Critical' ? 'destructive' : 'secondary'}>
                      {item.risk_level}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Order {item.reorder_quantity}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
