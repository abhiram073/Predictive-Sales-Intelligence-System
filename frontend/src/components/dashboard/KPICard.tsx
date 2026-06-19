import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { type ElementType } from "react"

interface KPICardProps {
  title: string
  value: string
  trend: string
  trendUp: boolean
  icon: ElementType
  subtitle?: string
}

export function KPICard({ title, value, trend, trendUp, icon: Icon, subtitle }: KPICardProps) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card className="relative overflow-hidden group border-white/10 dark:border-white/5 bg-gradient-to-br from-card to-card/50">
        <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Icon className="w-32 h-32 text-primary" />
        </div>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
                {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
              </div>
            </div>
            <div className={`flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${trendUp ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
              {trendUp ? '+' : ''}{trend}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
