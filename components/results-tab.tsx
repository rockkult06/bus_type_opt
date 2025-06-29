"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Download,
  Users,
  RouteIcon,
  Timer,
  Banknote,
  MapPin,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Gauge,
  Bus,
  BusFront,
  ArrowLeft,
  Clock,
  ArrowRight,
} from "lucide-react"
import { useBusOptimization } from "@/context/bus-optimization-context"
import * as XLSX from "xlsx"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { RouteData, BusParameters, ScheduleResult, StrategicResult, Trip } from "@/types"
import BusScheduleTimeline from "./bus-schedule-timeline"
import RouteScheduleTimeline from "./route-schedule-timeline"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Sefer çizelgesine göre toplam yolcu sayısı hesaplama - YENİ YAPI
const calculateTotalPassengers = (routes: RouteData[]): number => {
  if (!routes) return 0
  return routes.reduce((total, route) => {
    if (!route.hourlyDemand) return total
    const routeDemand = route.hourlyDemand.reduce(
      (sum: number, hourly: { demandAtoB: number; demandBtoA: number }) => sum + hourly.demandAtoB + hourly.demandBtoA,
      0,
    )
    return total + routeDemand
  }, 0)
}

// Sefer çizelgesine göre toplam mesafe hesaplama - YENİ YAPI
const calculateTotalDistance = (scheduleResults: ScheduleResult, routes: RouteData[]): number => {
  if (!scheduleResults?.schedule) return 0
  return scheduleResults.schedule.reduce((totalDistance, trip) => {
    const route = routes.find(r => r.routeNo === trip.routeNo)
    if (route) {
      return totalDistance + (trip.direction === "AtoB" ? route.routeLengthAtoB : route.routeLengthBtoA)
    }
    return totalDistance
  }, 0)
}

// Maliyet hesaplama fonksiyonlarını düzelt
// Sefer çizelgesine göre toplam yakıt maliyeti hesaplama - YENİ YAPI
const calculateTotalFuelCost = (
  scheduleResults: ScheduleResult,
  routes: RouteData[],
  parameters: BusParameters,
): number => {
  if (!scheduleResults?.schedule || !parameters) return 0
  return scheduleResults.schedule.reduce((totalCost, trip) => {
    const route = routes.find(r => r.routeNo === trip.routeNo)
    if (route) {
      const fuelCostPerKm =
        trip.busType === "minibus"
          ? parameters.minibus.fuelCost
          : trip.busType === "solo"
            ? parameters.solo.fuelCost
            : parameters.articulated.fuelCost
      const distance = trip.direction === "AtoB" ? route.routeLengthAtoB : route.routeLengthBtoA
      return totalCost + fuelCostPerKm * distance
    }
    return totalCost
  }, 0)
}

// Sefer çizelgesine göre toplam bakım maliyeti hesaplama - YENİ YAPI
const calculateTotalMaintenanceCost = (
  scheduleResults: ScheduleResult,
  routes: RouteData[],
  parameters: BusParameters,
): number => {
  if (!scheduleResults?.schedule || !parameters) return 0
  return scheduleResults.schedule.reduce((totalCost, trip) => {
    const route = routes.find(r => r.routeNo === trip.routeNo)
    if (route) {
      const maintenanceCostPerKm =
        trip.busType === "minibus"
          ? parameters.minibus.maintenanceCost
          : trip.busType === "solo"
            ? parameters.solo.maintenanceCost
            : parameters.articulated.maintenanceCost
      const distance = trip.direction === "AtoB" ? route.routeLengthAtoB : route.routeLengthBtoA
      return totalCost + maintenanceCostPerKm * distance
    }
    return totalCost
  }, 0)
}

// Sefer çizelgesine göre toplam amortisman maliyeti hesaplama - YENİ YAPI
const calculateTotalDepreciationCost = (
  scheduleResults: ScheduleResult,
  routes: RouteData[],
  parameters: BusParameters,
): number => {
  if (!scheduleResults?.schedule || !parameters) return 0
  return scheduleResults.schedule.reduce((totalCost, trip) => {
    const route = routes.find(r => r.routeNo === trip.routeNo)
    if (route) {
      const depreciationCostPerKm =
        trip.busType === "minibus"
          ? parameters.minibus.depreciationCost
          : trip.busType === "solo"
            ? parameters.solo.depreciationCost
            : parameters.articulated.depreciationCost
      const distance = trip.direction === "AtoB" ? route.routeLengthAtoB : route.routeLengthBtoA
      return totalCost + depreciationCostPerKm * distance
    }
    return totalCost
  }, 0)
}

// Sefer çizelgesine göre toplam şoför maliyeti hesaplama - YENİ YAPI
const calculateTotalDriverCost = (scheduleResults: ScheduleResult, parameters: BusParameters): number => {
  if (!scheduleResults?.schedule || !parameters?.driver) return 0
  const totalHours = scheduleResults.schedule.reduce((total, trip) => {
    return total + (trip.endTime - trip.startTime) / 60 // süre dakika cinsinden
  }, 0)
  return totalHours * parameters.driver.costPerHour
}

// Sefer çizelgesine göre toplam maliyet - YENİ YAPI
const calculateTotalCost = (
  scheduleResults: ScheduleResult,
  routes: RouteData[],
  parameters: BusParameters,
): number => {
  if (!scheduleResults?.schedule || !routes || !parameters) return 0
  const fuel = calculateTotalFuelCost(scheduleResults, routes, parameters)
  const maintenance = calculateTotalMaintenanceCost(scheduleResults, routes, parameters)
  const depreciation = calculateTotalDepreciationCost(scheduleResults, routes, parameters)
  const driver = calculateTotalDriverCost(scheduleResults, parameters)
  return fuel + maintenance + depreciation + driver
}

// Kilometre başına maliyet - YENİ YAPI
const calculateCostPerKm = (
  scheduleResults: ScheduleResult,
  routes: RouteData[],
  parameters: BusParameters,
): number => {
  const totalCost = calculateTotalCost(scheduleResults, routes, parameters)
  const totalDistance = calculateTotalDistance(scheduleResults, routes)
  if (totalDistance === 0) return 0
  return totalCost / totalDistance
}

const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

export default function ResultsTab() {
  const {
    strategicResults,
    scheduleResults,
    routeData,
    parameters,
    resetOptimization,
    setActiveTab,
  } = useBusOptimization()

  const [activeTabKey, setActiveTabKey] = useState("summary")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>({
    key: "startTime",
    direction: "ascending",
  })
  const [filters, setFilters] = useState<any>({})

  // Memoized calculations for performance
  const summaryStats = useMemo(() => {
    if (!strategicResults || !scheduleResults?.schedule || !routeData || !parameters) {
      return {
        totalCost: 0,
        totalDistance: 0,
        totalPassengers: 0,
        costPerKm: 0,
        fleet: { minibus: 0, solo: 0, articulated: 0 },
        totalTrips: 0,
        avgTripDuration: 0,
      }
    }

    const totalCost = calculateTotalCost(scheduleResults, routeData, parameters)
    const totalDistance = calculateTotalDistance(scheduleResults, routeData)
    const totalPassengers = calculateTotalPassengers(routeData)
    const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0
    const totalTrips = scheduleResults.schedule.length
    const totalDuration = scheduleResults.schedule.reduce((sum: number, trip: Trip) => sum + (trip.endTime - trip.startTime), 0)
    const avgTripDuration = totalTrips > 0 ? totalDuration / totalTrips : 0

    return {
      totalCost,
      totalDistance,
      totalPassengers,
      costPerKm,
      fleet: strategicResults.recommendedFleet,
      totalTrips,
      avgTripDuration,
    }
  }, [strategicResults, scheduleResults, routeData, parameters])

  const sortedAndFilteredSchedule = useMemo(() => {
    if (!scheduleResults?.schedule) return []

    let sched = [...scheduleResults.schedule]

    // Filtering
    Object.keys(filters).forEach(key => {
      const filterValue = filters[key as keyof typeof filters]
      if (filterValue) {
        sched = sched.filter((item: Trip) => {
          const itemValue = item[key as keyof typeof item]
          if (itemValue === undefined) return true
          return itemValue?.toString().toLowerCase().includes(filterValue.toLowerCase())
        })
      }
    })

    // Sorting
    if (sortConfig !== null) {
      sched.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof typeof a]
        const bVal = b[sortConfig.key as keyof typeof b]
        if (aVal < bVal) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (aVal > bVal) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }
    return sched
  }, [scheduleResults, sortConfig, filters])

  const requestSort = (key: string) => {
    let direction = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (columnId: string) => {
    if (!sortConfig || sortConfig.key !== columnId) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    if (sortConfig.direction === "ascending") {
      return <ArrowUp className="ml-2 h-4 w-4" />
    }
    if (sortConfig.direction === "descending") {
      return <ArrowDown className="ml-2 h-4 w-4" />
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />
  }

  const handleFilterChange = (columnId: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [columnId]: value }))
  }

  const clearAllFilters = () => {
    setFilters({})
  }

  const getUniqueValues = (columnId: keyof Trip) => {
    if (!scheduleResults?.schedule) return []
    const unique = new Set(scheduleResults.schedule.map((item: Trip) => item[columnId]))
    return Array.from(unique)
  }

  const exportToExcel = () => {
    if (!sortedAndFilteredSchedule) {
      alert("Dışa aktarılacak veri yok.")
      return
    }
    const header = [
      "Hat No",
      "Yön",
      "Otobüs ID",
      "Otobüs Tipi",
      "Başlangıç Saati",
      "Bitiş Saati",
      "Süre (dk)",
    ]
    const body = sortedAndFilteredSchedule.map((trip: Trip) => [
      trip.routeNo,
      trip.direction,
      trip.busId,
      trip.busType,
      formatTime(trip.startTime),
      formatTime(trip.endTime),
      trip.endTime - trip.startTime,
    ])

    const ws_data = [header, ...body]
    const ws = XLSX.utils.aoa_to_sheet(ws_data)

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Seferler")
    XLSX.writeFile(wb, "sefer_cizelgesi.xlsx")
  }

  const goBack = () => {
    resetOptimization()
    setActiveTab("parameters")
  }

  if (!strategicResults || !scheduleResults) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-lg font-semibold">Optimizasyon sonuçları yükleniyor veya bulunamadı.</p>
        <p className="text-muted-foreground">Lütfen bekleyin veya optimizasyonu yeniden başlatın.</p>
        <Button onClick={goBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
      </div>
    )
  }

  const getBusColorClass = (busId: string) => {
    const hash = busId.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    const colors = [
      "bg-red-400",
      "bg-yellow-400",
      "bg-green-400",
      "bg-blue-400",
      "bg-indigo-400",
      "bg-purple-400",
      "bg-pink-400",
      "bg-red-500",
      "bg-yellow-500",
      "bg-green-500",
      "bg-blue-500",
      "bg-indigo-500",
      "bg-purple-500",
      "bg-pink-500",
    ]
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Optimizasyon Sonuçları</h1>
          <p className="text-muted-foreground mt-1">Stratejik ve operasyonel planlama sonuçlarının özeti.</p>
        </div>
        <Button onClick={goBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Yeni Optimizasyon
        </Button>
      </div>

      <Tabs value={activeTabKey} onValueChange={setActiveTabKey} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">
            <BarChart3 className="mr-2 h-4 w-4" />
            Özet
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Clock className="mr-2 h-4 w-4" />
            Detaylı Çizelge
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <RouteIcon className="mr-2 h-4 w-4" />
            Görsel Zaman Planı
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Maliyet</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summaryStats.totalCost.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summaryStats.costPerKm.toFixed(2)} TL / km
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Sefer</CardTitle>
                <RouteIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.totalTrips}</div>
                <p className="text-xs text-muted-foreground">
                  Ort. sefer süresi: {summaryStats.avgTripDuration.toFixed(0)} dk
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Mesafe</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.totalDistance.toFixed(0)} km</div>
                <p className="text-xs text-muted-foreground">Tüm filo için toplam</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taşınan Yolcu</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.totalPassengers.toLocaleString("tr-TR")}</div>
                <p className="text-xs text-muted-foreground">24 saatlik operasyon boyunca</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Önerilen Filo Kompozisyonu</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center space-x-4 rounded-md border p-4">
                  <Bus className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Minibüs</p>
                    <p className="text-2xl font-semibold">{summaryStats.fleet.minibus}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 rounded-md border p-4">
                  <BusFront className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Solo Otobüs</p>
                    <p className="text-2xl font-semibold">{summaryStats.fleet.solo}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 rounded-md border p-4">
                  <Bus className="h-10 w-10 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Körüklü Otobüs</p>
                    <p className="text-2xl font-semibold">{summaryStats.fleet.articulated}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Detaylı Sefer Çizelgesi</h3>
                <Button onClick={exportToExcel} size="sm" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Excel'e Aktar
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-4 p-4 border rounded-lg bg-muted/40">
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="filter-routeNo">Hat No</Label>
                  <Input
                    id="filter-routeNo"
                    type="text"
                    placeholder="Filtrele..."
                    className="mt-1 w-full"
                    value={filters.routeNo || ""}
                    onChange={e => handleFilterChange("routeNo", e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="filter-busType">Otobüs Tipi</Label>
                  <Select onValueChange={value => handleFilterChange("busType", value)} value={filters.busType || ""}>
                    <SelectTrigger id="filter-busType" className="mt-1 w-full">
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tümü</SelectItem>
                      {getUniqueValues("busType").map(val => (
                        <SelectItem key={val as string} value={val as string}>
                          {val as string}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="filter-busId">Otobüs ID</Label>
                  <Input
                    id="filter-busId"
                    type="text"
                    placeholder="Filtrele..."
                    className="mt-1 w-full"
                    value={filters.busId || ""}
                    onChange={e => handleFilterChange("busId", e.target.value)}
                  />
                </div>
                <Button variant="ghost" onClick={clearAllFilters} className="self-end">
                  Filtreleri Temizle
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead onClick={() => requestSort("routeNo")} className="cursor-pointer">
                        Hat No {getSortIcon("routeNo")}
                      </TableHead>
                      <TableHead onClick={() => requestSort("direction")} className="cursor-pointer">
                        Yön {getSortIcon("direction")}
                      </TableHead>
                      <TableHead onClick={() => requestSort("busId")} className="cursor-pointer">
                        Otobüs ID {getSortIcon("busId")}
                      </TableHead>
                      <TableHead onClick={() => requestSort("busType")} className="cursor-pointer">
                        Otobüs Tipi {getSortIcon("busType")}
                      </TableHead>
                      <TableHead onClick={() => requestSort("startTime")} className="cursor-pointer">
                        Başlangıç {getSortIcon("startTime")}
                      </TableHead>
                      <TableHead onClick={() => requestSort("endTime")} className="cursor-pointer">
                        Bitiş {getSortIcon("endTime")}
                      </TableHead>
                      <TableHead>Süre (dk)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndFilteredSchedule.map((trip: Trip, index: number) => (
                      <TableRow key={trip.tripId || index}>
                        <TableCell>{trip.routeNo}</TableCell>
                        <TableCell>{trip.direction}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-block w-3 h-3 rounded-full mr-2 ${getBusColorClass(trip.busId)}`}
                          ></span>
                          {trip.busId}
                        </TableCell>
                        <TableCell>{trip.busType}</TableCell>
                        <TableCell>{formatTime(trip.startTime)}</TableCell>
                        <TableCell>{formatTime(trip.endTime)}</TableCell>
                        <TableCell>{trip.endTime - trip.startTime}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <div className="space-y-6">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold">Otobüs Görevlendirme Zaman Çizelgesi</h3>
                <BusScheduleTimeline scheduleResults={scheduleResults} routes={routeData || []} />
              </div>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold">Hat Bazında Sefer Zaman Çizelgesi</h3>
                <RouteScheduleTimeline scheduleResults={scheduleResults} routes={routeData || []} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
