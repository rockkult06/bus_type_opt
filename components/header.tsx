"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { RefreshCcw, Orbit } from "lucide-react"
import { useRouter } from "next/navigation"
import { useBusOptimization } from "@/context/bus-optimization-context"
import { useState } from "react"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const busOptimization = useBusOptimization()
  const [_, setDummy] = useState({}) // Dummy state to force re-render after context is available

  const resetAllData = () => {
    if (busOptimization) {
      busOptimization.setRoutes([])
      busOptimization.setParameters({
        busTypes: [],
        maxBuses: 100,
        maxCost: 1000000,
        maxInterlining: 1,
      })
      busOptimization.setResults([])
      busOptimization.setScheduleParameters({
        headwayMin: 5,
        headwayMax: 30,
        servicePeriodStart: "06:00",
        servicePeriodEnd: "23:00",
        peakHoursStart: "07:00",
        peakHoursEnd: "09:00",
        peakHoursStartEvening: "17:00",
        peakHoursEndEvening: "19:00",
        minLayoverTime: 5,
      })
      busOptimization.setScheduleResults(null)
      busOptimization.setKpis(null)
      busOptimization.setIsOptimizing(false)
      busOptimization.setActiveStep("parameters")
    }

    router.push("/")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-8 lg:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Orbit className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400">
              Otobüs Tipi Belirleme ve Sefer Çizelgesi Modülü
            </h1>
          </Link>
          <nav className="flex gap-4 md:gap-6">
            <Link
              href="/parameters"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/parameters" ? "text-primary" : "text-muted-foreground",
              )}
            >
              Parametreler
            </Link>
            <Link
              href="/bus-type"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/bus-type" ? "text-primary" : "text-muted-foreground",
              )}
            >
              Otobüs Tipleri
            </Link>
            <Link
              href="/schedule"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/schedule" ? "text-primary" : "text-muted-foreground",
              )}
            >
              Çizelge
            </Link>
            <Link
              href="/results"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/results" ? "text-primary" : "text-muted-foreground",
              )}
            >
              Sonuçlar
            </Link>
            <Link
              href="/help"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/help" ? "text-primary" : "text-muted-foreground",
              )}
            >
              Yardım
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={resetAllData}
            title="Tüm verileri sıfırla"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
