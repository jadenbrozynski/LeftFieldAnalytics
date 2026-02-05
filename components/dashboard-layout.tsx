"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Clock,
  Flag,
  MessageSquare,
  MessagesSquare,
  Heart,
  History,
  Menu,
  ChevronLeft,
  Search,
  LogOut,
  Globe,
  HeartHandshake,
  TextQuote,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Profiles", href: "/profiles", icon: Users },
  { name: "Waitlist", href: "/waitlist", icon: Clock },
  { name: "World Domination", href: "/world-domination", icon: Globe },
  { name: "Drops", href: "/drops", icon: HeartHandshake },
  { name: "Messages", href: "/messages", icon: MessagesSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Reports", href: "/reports", icon: Flag },
  { name: "Prompts", href: "/prompts", icon: TextQuote },
  { name: "Interests & Activities", href: "/interests", icon: Heart },
  { name: "Timeline", href: "/timeline", icon: History },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [environment, setEnvironment] = React.useState<'staging' | 'production' | null>(null)
  const [switching, setSwitching] = React.useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  React.useEffect(() => {
    fetch('/api/environment')
      .then(res => res.json())
      .then(data => setEnvironment(data.environment))
      .catch(() => setEnvironment('staging'))
  }, [])

  const toggleEnvironment = async () => {
    if (!environment || switching) return

    const newEnv = environment === 'staging' ? 'production' : 'staging'
    setSwitching(true)

    try {
      const res = await fetch('/api/environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: newEnv }),
      })

      const data = await res.json()

      if (res.ok) {
        setEnvironment(newEnv)
        // Reload page to refresh all data with new environment
        window.location.reload()
      } else {
        // Show error - can't connect to database
        alert(data.error || `Failed to switch to ${newEnv}`)
      }
    } catch (error) {
      console.error('Failed to switch environment:', error)
      alert('Failed to switch environment. Please try again.')
    } finally {
      setSwitching(false)
    }
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-[#00433a]">
      <div className={cn(
        "flex h-16 items-center border-b border-white/20 px-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-light.png"
              alt="Left Field"
              width={100}
              height={40}
              className="object-contain"
            />
          </Link>
        )}
        {collapsed && (
          <Image
            src="/favicon.jpg"
            alt="Left Field"
            width={32}
            height={32}
            className="object-contain rounded"
          />
        )}
        {!isMobile && !collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
      {!collapsed && (
        <div className="border-t border-white/20 p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-sm font-medium text-white">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-white/70 truncate">admin@leftfield.app</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#002e28] bg-[#00433a] transition-all duration-300",
            collapsed ? "w-16" : "w-64"
          )}
        >
          <SidebarContent />
          {collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
              className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-[#00433a] bg-white shadow-sm hover:bg-gray-50 text-[#00433a]"
            >
              <ChevronLeft className="h-3 w-3 rotate-180" />
            </Button>
          )}
        </aside>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-[#00433a] border-[#002e28]">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className={cn(
        "flex flex-col transition-all duration-300",
        !isMobile && (collapsed ? "ml-16" : "ml-64")
      )}>
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-white px-4 sm:px-6">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search profiles, reports..."
                className="pl-9 bg-gray-50 border-border text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
          {/* Environment Toggle */}
          {environment && (
            <button
              onClick={toggleEnvironment}
              disabled={switching}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                "hover:shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-wait",
                environment === 'production'
                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  : "bg-[#00433a]/5 text-[#00433a] border-[#00433a]/20 hover:bg-[#00433a]/10"
              )}
              title={`Click to switch to ${environment === 'staging' ? 'production' : 'staging'}`}
            >
              <span className={cn(
                "h-2 w-2 rounded-full",
                environment === 'production' ? "bg-red-500" : "bg-[#00433a]"
              )} />
              {switching ? 'Switching...' : (environment === 'production' ? 'Production' : 'Staging')}
            </button>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
