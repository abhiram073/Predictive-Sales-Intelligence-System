import { Search, Bell, Moon, Sun, User, Settings, LogOut, Check, Trash2 } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { searchGlobal, getNotifications } from "@/lib/api"
import api from "@/lib/api"

export function Header() {
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotif, setShowNotif] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const [showAvatar, setShowAvatar] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getNotifications().then(res => setNotifications(res.data)).catch(console.error)
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchGlobal(searchQuery).then(res => {
          setSearchResults(res.data)
          setShowSearch(true)
        }).catch(console.error)
      } else {
        setShowSearch(false)
      }
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSearch(false)
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotif(false)
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) setShowAvatar(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleMarkRead = (id: number, e: any) => {
    e.stopPropagation()
    api.put(`/notifications/${id}/read`).then(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    }).catch(console.error)
  }

  const handleDeleteNotif = (id: number, e: any) => {
    e.stopPropagation()
    api.delete(`/notifications/${id}`).then(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }).catch(console.error)
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <header className="h-16 border-b bg-background/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex flex-col">
        <h2 className="text-lg font-semibold leading-tight">Welcome back</h2>
        <p className="text-xs text-muted-foreground hidden sm:block">
          Here's your business performance overview.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block" ref={searchRef}>
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search analytics..."
            className="h-9 w-64 rounded-md border border-input bg-muted/50 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if(searchResults.length) setShowSearch(true) }}
          />
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-11 left-0 w-full bg-card border rounded-md shadow-lg overflow-hidden py-1">
              {searchResults.map((res, i) => (
                <div 
                  key={i} 
                  className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
                  onClick={() => { setShowSearch(false); navigate(res.link); }}
                >
                  <div className="font-medium">{res.title}</div>
                  <div className="text-xs text-muted-foreground">{res.type} • {res.subtitle}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <div className="relative" ref={notifRef}>
            <Button variant="ghost" size="icon" onClick={() => setShowNotif(!showNotif)}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />}
            </Button>
            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 bg-card border rounded-md shadow-lg overflow-hidden">
                <div className="p-3 border-b flex justify-between items-center bg-muted/30">
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => {
                      api.put("/notifications/read-all").then(() => {
                        setNotifications(prev => prev.map(n => ({...n, is_read: true})))
                      })
                    }}>Mark all read</Button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer ${!n.is_read ? 'bg-primary/5' : ''}`} onClick={() => navigate("/notifications")}>
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium leading-tight">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                          </div>
                          <div className="flex gap-1">
                            {!n.is_read && (
                              <button onClick={(e) => handleMarkRead(n.id, e)} className="text-primary hover:text-primary/80"><Check className="h-4 w-4" /></button>
                            )}
                            <button onClick={(e) => handleDeleteNotif(n.id, e)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative ml-2" ref={avatarRef}>
            <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-primary/50 transition-all" onClick={() => setShowAvatar(!showAvatar)}>
              <AvatarImage src="https://github.com/shadcn.png" alt="User" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            {showAvatar && (
              <div className="absolute right-0 mt-2 w-48 bg-card border rounded-md shadow-lg py-1">
                <div className="px-4 py-2 border-b mb-1">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">admin@salesoptima.ai</p>
                </div>
                <div className="px-2 py-1.5 hover:bg-muted cursor-pointer text-sm flex items-center gap-2" onClick={() => { setShowAvatar(false); navigate("/settings"); }}><User className="h-4 w-4" /> Profile</div>
                <div className="px-2 py-1.5 hover:bg-muted cursor-pointer text-sm flex items-center gap-2" onClick={() => { setShowAvatar(false); navigate("/settings"); }}><Settings className="h-4 w-4" /> Settings</div>
                <div className="border-t my-1"></div>
                <div className="px-2 py-1.5 hover:bg-destructive/10 text-destructive cursor-pointer text-sm flex items-center gap-2" onClick={() => { setShowAvatar(false); navigate("/login"); }}><LogOut className="h-4 w-4" /> Logout</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
