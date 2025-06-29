"use client"

import { useMemo, useState } from "react"
import { useBusOptimization } from "@/context/bus-optimization-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, ArrowLeft } from "lucide-react"
import { Trip } from "@/types"

// Helper functions
const formatTime = (minutes: number): string => {
  if (isNaN(minutes)) return "N/A"
  const totalMinutes = Math.round(minutes)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

const formatNumber = (num?: number): string => {
  if (num === undefined || isNaN(num)) return "0"
  return new Intl.NumberFormat("tr-TR").format(Math.round(num))
}

export default function ResultsTab() {
  const { combinedResults, isOptimizing, setActiveTab } = useBusOptimization()
  const [sortConfig, setSortConfig] = useState<{ key: keyof Trip; direction: "asc" | "desc" } | null>(null)

  const sortedSchedule = useMemo(() => {
    if (!combinedResults?.scheduleResult.schedule) return []
    let sched = [...combinedResults.scheduleResult.schedule]

    if (sortConfig !== null) {
      sched.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }
    return sched
  }, [combinedResults, sortConfig])

  const requestSort = (key: keyof Trip) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  if (isOptimizing) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Optimizasyon sonuçları hesaplanıyor, lütfen bekleyin...</p>
      </div>
    )
  }

  if (!combinedResults) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Henüz Sonuç Yok</AlertTitle>
        <AlertDescription>
          Optimizasyon sonuçlarını görmek için lütfen "Parametreler" sekmesinden bir veri dosyası yükleyip optimizasyonu başlatın.
        </AlertDescription>
        <Button onClick={() => setActiveTab("parameters")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
      </Alert>
    )
  }

  const { strategicResult, scheduleResult, kpi } = combinedResults

  const getBusColorClass = (busType: string) => {
    switch (busType) {
      case "minibus": return "bg-blue-100 text-blue-800"
      case "solo": return "bg-green-100 text-green-800"
      case "articulated": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Genel Özet (24 Saatlik Operasyon)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Toplam Maliyet</p>
            <p className="text-2xl font-bold">{formatNumber(kpi.totalOperatingCost)} TL</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Yolcu Başına Maliyet</p>
            <p className="text-2xl font-bold">{kpi.costPerPassenger.toFixed(2)} TL</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Toplam Mesafe</p>
            <p className="text-2xl font-bold">{formatNumber(kpi.totalDistance)} km</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Toplam Karbon Emisyonu</p>
            <p className="text-2xl font-bold">{formatNumber(kpi.totalCarbonEmission)} kg CO₂</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stratejik Filo Planı</CardTitle>
          <CardDescription>
            Sistemin tepe noktası <strong>{formatTime(strategicResult.peakDemand.hour * 60)}</strong> saatinde{" "}
            <strong>{formatNumber(strategicResult.peakDemand.demand)}</strong> yolcu olarak hesaplanmıştır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Bu talebi karşılamak için önerilen filo:</p>
          <ul className="list-disc pl-5 mt-2">
            <li><strong>Midibüs:</strong> {strategicResult.recommendedFleet.minibus} adet</li>
            <li><strong>Solo Otobüs:</strong> {strategicResult.recommendedFleet.solo} adet</li>
            <li><strong>Körüklü Otobüs:</strong> {strategicResult.recommendedFleet.articulated} adet</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detaylı 24 Saatlik Sefer Çizelgesi</CardTitle>
          <CardDescription>Toplam {formatNumber(scheduleResult.stats.totalTrips)} sefer bulunmaktadır.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto h-[600px] border">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead onClick={() => requestSort("busId")}>Otobüs ID</TableHead>
                  <TableHead onClick={() => requestSort("routeNo")}>Hat No</TableHead>
                  <TableHead>Yön</TableHead>
                  <TableHead onClick={() => requestSort("startTime")}>Başlangıç</TableHead>
                  <TableHead onClick={() => requestSort("endTime")}>Bitiş</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSchedule.map((trip: Trip) => (
                  <TableRow key={trip.tripId}>
                    <TableCell>
                      <span className={`font-mono px-2 py-1 rounded ${getBusColorClass(trip.busType)}`}>
                        {trip.busId}
                      </span>
                    </TableCell>
                    <TableCell>{trip.routeNo}</TableCell>
                    <TableCell>{trip.direction === "AtoB" ? "A → B" : "B → A"}</TableCell>
                    <TableCell>{formatTime(trip.startTime)}</TableCell>
                    <TableCell>{formatTime(trip.endTime)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
