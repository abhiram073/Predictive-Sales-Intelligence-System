import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Upload, Activity, AlertCircle, FileBarChart, LogIn } from "lucide-react"
import { useState, useEffect } from "react"
import { getActivities } from "@/lib/api"

export function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    getActivities().then(res => setActivities(res.data)).catch(console.error);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "upload": return Upload;
      case "alert": return AlertCircle;
      case "report": return FileBarChart;
      case "login": return LogIn;
      default: return Activity;
    }
  }

  return (
    <Card className="col-span-1 lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? <div className="text-sm text-muted-foreground">No recent activity.</div> : null}
          {activities.map((act, idx) => {
            const Icon = getIcon(act.icon_type);
            const dateStr = new Date(act.created_at).toLocaleString();
            return (
              <div key={idx} className="flex gap-3 items-center">
                <div className="mt-0.5 bg-muted p-2 rounded-full">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{act.action}</p>
                  <p className="text-xs text-muted-foreground">{dateStr}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
