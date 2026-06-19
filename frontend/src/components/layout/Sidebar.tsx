import { NavLink } from "react-router-dom"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  LineChart,
  TrendingUp,
  Box,
  Package,
  FileText,
  Bell,
  Settings,
  HelpCircle,
  Menu,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Sales Analytics", href: "/analytics", icon: LineChart },
  { name: "Forecasting", href: "/forecasting", icon: TrendingUp },
  { name: "Inventory", href: "/inventory", icon: Box },
  { name: "Products", href: "/products", icon: Package },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help Center", href: "/help", icon: HelpCircle },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.div
      animate={{ width: collapsed ? 80 : 260 }}
      className="relative flex flex-col h-screen border-r bg-card/50 backdrop-blur-xl z-20"
    >
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold text-xl bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent truncate"
          >
            SalesOptima AI
          </motion.div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("shrink-0", collapsed && "mx-auto")}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all group relative",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="truncate"
                    >
                      {item.name}
                    </motion.span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 w-1 h-full bg-primary rounded-r-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </motion.div>
  )
}
