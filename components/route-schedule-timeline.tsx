// Bileşeni tamamen değiştiriyorum, daha basit ve anlaşılır bir zaman çizelgesi oluşturmak için

"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Filter, ZoomIn, ZoomOut, RefreshCw, ChevronDown, RouteIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TimelineBlockProps {
  busId: string
  busType: string
  startTime: string
  endTime: string
  color: string
  style: React.CSSProperties
  routeNo: string
  routeName?: string
  direction: string
  routeLength?: number
}

// TimelineBlock bileşenini güncelle - kontrast bir çerçeve ekle
const TimelineBlock: React.FC<TimelineBlockProps> = ({
  busId,
  busType,
  startTime,
  endTime,
  color,
  style,
  routeNo,
  routeName,
  direction,
  routeLength = 0,
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute h-8 shadow-md flex items-center justify-center text-white text-xs font-medium overflow-hidden whitespace-nowrap transition-all duration-200 hover:shadow-lg rounded-md"
            style={{
              ...style,
              background: color,
              boxShadow: "0px 2px 6px rgba(0,0,0,0.15)",
              transition: "all 0.2s ease",
              border: "2px solid",
              borderColor: busType === "minibus" ? "#134e4a" : busType === "solo" ? "#1e3a8a" : "#831843",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)"
              e.currentTarget.style.boxShadow = "0px 4px 12px rgba(0,0,0,0.2)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)"
              e.currentTarget.style.boxShadow = "0px 2px 6px rgba(0,0,0,0.15)"
            }}
          >
            <span className="px-2 font-medium truncate">{busId.split("-")[1]}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-white text-gray-800 border border-gray-200 shadow-md rounded-lg p-3 z-50 max-w-[250px]"
        >
          <div className="space-y-1.5">
            <p className="font-semibold text-sm flex items-center">
              <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: color }}></span>
              Hat {routeNo} {routeName && `- ${routeName}`}
            </p>
            <p className="text-xs text-gray-600">Yön: {direction === "A->B" ? "A → B (Gidiş)" : "B → A (Dönüş)"}</p>
            <p className="text-xs text-gray-600">Kalkış Saati: {startTime}</p>
            <p className="text-xs text-gray-600">Tahmini Varış: {endTime}</p>
            <p className="text-xs text-gray-600">Otobüs: {busId}</p>
            <p className="text-xs text-gray-600">
              Tip: {busType === "minibus" ? "Midibüs" : busType === "solo" ? "Solo" : "Körüklü"}
            </p>
            {routeLength > 0 && <p className="text-xs text-gray-600">Mesafe: {routeLength.toFixed(1)} km</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Calculate estimated end time based on duration
const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const [hours, minutes] = startTime.split(":").map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes

  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMinutes = totalMinutes % 60

  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`
}

interface RouteScheduleTimelineProps {
  scheduleResults: any
  routes?: any[]
}

const RouteScheduleTimeline: React.FC<RouteScheduleTimelineProps> = ({ scheduleResults, routes = [] }) => {
  // State for timeline controls
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [filterRoute, setFilterRoute] = useState<string>("")
  const [filterDirection, setFilterDirection] = useState<string>("all")
  const [filterTimeRange, setFilterTimeRange] = useState<{ start: string; end: string }>({
    start: "05:00",
    end: "23:00",
  })
  const [showFilters, setShowFilters] = useState<boolean>(false)

  // Convert time string to minutes for comparison
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  // Check if time is within the filter range
  const isTimeInRange = (time: string, startTime: string, endTime: string): boolean => {
    const timeMinutes = timeToMinutes(time)
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)

    return timeMinutes >= startMinutes && timeMinutes <= endMinutes
  }

  // Get unique route numbers
  const uniqueRouteNumbers = useMemo(() => {
    const routeNumbers = new Set<string>()

    if (scheduleResults?.scheduleAB) {
      scheduleResults.scheduleAB.forEach((trip: any) => {
        if (trip.routeNo) routeNumbers.add(trip.routeNo)
      })
    }

    if (scheduleResults?.scheduleBA) {
      scheduleResults.scheduleBA.forEach((trip: any) => {
        if (trip.routeNo) routeNumbers.add(trip.routeNo)
      })
    }

    return Array.from(routeNumbers).sort()
  }, [scheduleResults])

  // busColors useMemo'sunu otobüs tipine göre renk atayacak şekilde değiştir
  const busColors = useMemo(() => {
    const colors: Record<string, string> = {}

    // Otobüs tiplerine göre sabit renkler
    const typeColors = {
      minibus: "#2dd4bf", // teal-400 - Midibüs için turkuaz
      solo: "#60a5fa", // blue-400 - Solo için mavi
      articulated: "#f472b6", // pink-400 - Körüklü için pembe
    }

    // Tüm seferleri dolaş ve otobüs tipine göre renk ata
    if (scheduleResults?.scheduleAB) {
      scheduleResults.scheduleAB.forEach((trip: any) => {
        if (trip.busId) {
          const busType = trip.busType || "solo" // Varsayılan olarak solo
          colors[trip.busId] = typeColors[busType === "körüklü" ? "articulated" : busType]
        }
      })
    }

    if (scheduleResults?.scheduleBA) {
      scheduleResults.scheduleBA.forEach((trip: any) => {
        if (trip.busId) {
          const busType = trip.busType || "solo" // Varsayılan olarak solo
          colors[trip.busId] = typeColors[busType === "körüklü" ? "articulated" : busType]
        }
      })
    }

    return colors
  }, [scheduleResults])

  // Generate time labels (every hour from 05:00 to 23:00)
  const timeLabels = useMemo(() => {
    const interval = zoomLevel <= 1 ? 60 : zoomLevel <= 2 ? 30 : 15 // minutes
    const labels = []
    const startHour = 5
    const endHour = 23

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        if (hour === endHour && minute > 0) break
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        labels.push(time)
      }
    }

    return labels
  }, [zoomLevel])

  // Update the routeDirectionData useMemo to use busColors
  const routeDirectionData = useMemo(() => {
    if (!scheduleResults) return []

    const result: {
      routeNo: string
      direction: string
      trips: any[]
    }[] = []

    // Process all routes and directions
    uniqueRouteNumbers.forEach((routeNo) => {
      // Skip if filtered by route
      if (filterRoute && routeNo !== filterRoute) return

      // Process A->B direction
      if (filterDirection === "all" || filterDirection === "ab") {
        const abTrips = scheduleResults.scheduleAB.filter(
          (trip: any) =>
            trip.routeNo === routeNo && isTimeInRange(trip.time, filterTimeRange.start, filterTimeRange.end),
        )

        if (abTrips.length > 0) {
          result.push({
            routeNo,
            direction: "A->B",
            trips: abTrips.map((trip: any) => {
              const route = routes.find((r) => r.routeNo === routeNo)
              const duration = route?.travelTimeAtoB || 30
              return {
                ...trip,
                endTime: calculateEndTime(trip.time, duration),
                duration,
                routeLength: route?.routeLengthAtoB || 0,
                routeName: route?.routeName || "",
              }
            }),
          })
        }
      }

      // Process B->A direction
      if (filterDirection === "all" || filterDirection === "ba") {
        const baTrips = scheduleResults.scheduleBA.filter(
          (trip: any) =>
            trip.routeNo === routeNo && isTimeInRange(trip.time, filterTimeRange.start, filterTimeRange.end),
        )

        if (baTrips.length > 0) {
          result.push({
            routeNo,
            direction: "B->A",
            trips: baTrips.map((trip: any) => {
              const route = routes.find((r) => r.routeNo === routeNo)
              const duration = route?.travelTimeBtoA || 30
              return {
                ...trip,
                endTime: calculateEndTime(trip.time, duration),
                duration,
                routeLength: route?.routeLengthBtoA || 0,
                routeName: route?.routeName || "",
              }
            }),
          })
        }
      }
    })

    return result
  }, [scheduleResults, routes, uniqueRouteNumbers, filterRoute, filterDirection, filterTimeRange])

  // Calculate position for timeline blocks
  const calculatePosition = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const totalMinutes = hours * 60 + minutes - 5 * 60 // Minutes since 5:00 AM
    const totalTimelineMinutes = (23 - 5) * 60 // Total minutes from 5:00 to 23:00

    return (totalMinutes / totalTimelineMinutes) * 100
  }

  // Handle zoom level change
  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom)
  }

  // Reset all filters
  const resetFilters = () => {
    setFilterRoute("")
    setFilterDirection("all")
    setFilterTimeRange({ start: "05:00", end: "23:00" })
    setZoomLevel(1)
  }

  if (!scheduleResults || Object.keys(scheduleResults).length === 0) {
    return (
      <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-8 text-center text-muted-foreground">
        <div className="flex flex-col items-center justify-center">
          <RouteIcon className="h-10 w-10 mb-3 text-gray-400 dark:text-gray-600" />
          <p className="text-base">Görselleştirilecek hat çizelgesi verisi bulunamadı.</p>
          <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
            Önce sefer çizelgesi optimizasyonu çalıştırılmalıdır.
          </p>
        </div>
      </div>
    )
  }

  // Renk açıklamalarını otobüs tipine göre güncelle
  const renderColorLegend = () => {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        <div
          className="flex items-center rounded-md px-3 py-1.5 text-xs text-white shadow-sm border-2 border-[#134e4a]"
          style={{ backgroundColor: "#2dd4bf" }}
        >
          <span className="font-medium">Midibüs</span>
        </div>
        <div
          className="flex items-center rounded-md px-3 py-1.5 text-xs text-white shadow-sm border-2 border-[#1e3a8a]"
          style={{ backgroundColor: "#60a5fa" }}
        >
          <span className="font-medium">Solo</span>
        </div>
        <div
          className="flex items-center rounded-md px-3 py-1.5 text-xs text-white shadow-sm border-2 border-[#831843]"
          style={{ backgroundColor: "#f472b6" }}
        >
          <span className="font-medium">Körüklü</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-3 w-3 mr-1" />
            {showFilters ? "Filtreleri Gizle" : "Filtreleri Göster"}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleZoomChange(Math.max(0.5, zoomLevel - 0.5))}
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Slider
              value={[zoomLevel]}
              min={0.5}
              max={4}
              step={0.5}
              className="w-24"
              onValueChange={(value) => handleZoomChange(value[0])}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleZoomChange(Math.min(4, zoomLevel + 0.5))}
              disabled={zoomLevel >= 4}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={resetFilters}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Sıfırla
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              const container = document.getElementById("route-schedule-timeline-container")
              if (container) {
                container.scrollLeft = 0
              }
            }}
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Başa Dön
          </Button>
        </div>
      </div>

      {/* Expanded Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg mb-4 animate-fadeIn">
          <div>
            <Label htmlFor="route-filter" className="text-xs font-medium mb-1.5 block">
              Hat Numarası
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {filterRoute || "Tüm Hatlar"}
                  <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem onClick={() => setFilterRoute("")}>Tüm Hatlar</DropdownMenuItem>
                <DropdownMenuSeparator />
                {uniqueRouteNumbers.map((routeNo) => (
                  <DropdownMenuItem key={routeNo} onClick={() => setFilterRoute(routeNo)}>
                    Hat {routeNo}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <Label htmlFor="direction-filter" className="text-xs font-medium mb-1.5 block">
              Yön
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {filterDirection === "all"
                    ? "Tüm Yönler"
                    : filterDirection === "ab"
                      ? "A → B (Gidiş)"
                      : "B → A (Dönüş)"}
                  <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterDirection("all")}>Tüm Yönler</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterDirection("ab")}>A → B (Gidiş)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterDirection("ba")}>B → A (Dönüş)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <Label className="text-xs font-medium mb-1.5 block">Zaman Aralığı</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="time"
                value={filterTimeRange.start}
                onChange={(e) => setFilterTimeRange({ ...filterTimeRange, start: e.target.value })}
                className="w-full"
              />
              <span className="text-gray-500">-</span>
              <Input
                type="time"
                value={filterTimeRange.end}
                onChange={(e) => setFilterTimeRange({ ...filterTimeRange, end: e.target.value })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div id="route-schedule-timeline-container" className="w-full overflow-x-auto">
        <div
          className="min-w-[1000px] relative bg-gray-800 rounded-xl text-white overflow-hidden border border-gray-700 shadow-xl"
          style={{
            width: `${100 * Math.max(1, zoomLevel)}%`,
            transformOrigin: "left center",
          }}
        >
          {/* Timeline header with time labels */}
          <div className="flex border-b border-gray-700 sticky top-0 z-20 bg-gray-800">
            {/* Route and Direction column */}
            <div className="w-40 min-w-40 flex items-center justify-center p-2 font-medium text-sm border-r border-gray-700 sticky left-0 z-50 bg-gray-800 shadow-md">
              Hat No - Yön
            </div>

            {/* Time columns */}
            <div className="flex-1 flex">
              {timeLabels.map((label, index) => (
                <div
                  key={index}
                  className="flex-1 text-center py-2 text-xs text-gray-300 border-r border-gray-700/50 last:border-r-0"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Route-Direction rows */}
          <div className="relative max-h-[560px] overflow-y-auto">
            {/* Vertical time grid lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {timeLabels.map((_, index) => (
                <div key={index} className="flex-1 border-r border-gray-600/40 last:border-r-0 h-full" />
              ))}
            </div>

            {/* Route-Direction rows with timeline blocks */}
            {routeDirectionData.map(({ routeNo, direction, trips }, rowIndex) => (
              <div
                key={`${routeNo}-${direction}`}
                className={`flex h-14 relative hover:bg-gray-700/30 transition-colors ${
                  rowIndex < routeDirectionData.length - 1 ? "border-b border-gray-700/50" : ""
                }`}
              >
                {/* Route-Direction label */}
                <div className="w-40 min-w-40 flex items-center justify-center p-2 font-medium text-sm border-r border-gray-700 sticky left-0 z-40 bg-gray-800 shadow-md">
                  <div className="px-2 py-1.5 rounded-full bg-gray-700/70 flex items-center border border-gray-600">
                    <span>Hat {routeNo}</span>
                    <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-600/70 border border-gray-500">
                      {direction === "A->B" ? "A→B" : "B→A"}
                    </span>
                  </div>
                </div>

                {/* Timeline area */}
                <div className="flex-1 relative">
                  {/* Render timeline blocks for this route-direction */}
                  {trips.map((trip, index) => {
                    const position = calculatePosition(trip.time)

                    return (
                      <TimelineBlock
                        key={`${routeNo}-${direction}-${index}`}
                        busId={trip.busId}
                        busType={trip.busType || "solo"}
                        startTime={trip.time}
                        endTime={trip.endTime}
                        color={busColors[trip.busId]} // Use busColors instead of routeColors
                        style={{
                          left: `${position}%`,
                          width: "40px",
                          top: "12px",
                        }}
                        routeNo={routeNo}
                        routeName={trip.routeName}
                        direction={direction}
                        routeLength={trip.routeLength}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Update the route legend to show bus IDs instead of routes */}
      {/* Otobüs tipi renk açıklamaları */}
      <div className="mt-4 flex flex-wrap gap-2">
        <div
          className="flex items-center rounded-md px-3 py-1.5 text-xs text-white shadow-sm border-2 border-[#134e4a]"
          style={{ backgroundColor: "#2dd4bf" }}
        >
          <span className="font-medium">Midibüs</span>
        </div>
        <div
          className="flex items-center rounded-md px-3 py-1.5 text-xs text-white shadow-sm border-2 border-[#1e3a8a]"
          style={{ backgroundColor: "#60a5fa" }}
        >
          <span className="font-medium">Solo</span>
        </div>
        <div
          className="flex items-center rounded-md px-3 py-1.5 text-xs text-white shadow-sm border-2 border-[#831843]"
          style={{ backgroundColor: "#f472b6" }}
        >
          <span className="font-medium">Körüklü</span>
        </div>
      </div>
    </div>
  )
}

export default RouteScheduleTimeline
