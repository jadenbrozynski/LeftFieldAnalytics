import { DashboardLayout } from "@/components/dashboard-layout"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </TooltipProvider>
  )
}
