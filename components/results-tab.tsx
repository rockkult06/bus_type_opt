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
import type { RouteData, BusParameters, ScheduleResult } from "@/types"
import BusScheduleTimeline from "./bus-schedule-timeline"
import RouteScheduleTimeline from "./route-schedule-timeline"

// Sefer çizelgesine göre toplam yolcu sayısı hesaplama - DÜZELTME
const calculateTotalPassengers = (routes: RouteData[]): number => {
  // Tüm hatların A→B ve B→A yönlerindeki yolcu sayılarını topla
  return routes.reduce((sum, route) => sum + route.peakPassengersAtoB + route.peakPassengersBtoA, 0)
}

// Sefer çizelgesine göre toplam mesafe hesaplama
const calculateTotalDistance = (scheduleResults: ScheduleResult, routes: RouteData[]): number => {
  let totalDistance = 0

  // Her sefer için ilgili hattın uzunluğunu kullan
  scheduleResults.scheduleAB.forEach((trip) => {
    if (trip.routeNo) {
      const route = routes.find((r) => r.routeNo === trip.routeNo)
      if (route) {
        totalDistance += route.routeLengthAtoB
      } else {
        // Eğer hat bulunamazsa ortalama uzunluğu kullan
        const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthAtoB, 0) / routes.length
        totalDistance += avgRouteLength
      }
    } else {
      // Eğer hat belirtilmemişse ortalama uzunluğu kullan
      const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthAtoB, 0) / routes.length
      totalDistance += avgRouteLength
    }
  })

  // B->A yönündeki seferler için
  scheduleResults.scheduleBA.forEach((trip) => {
    if (trip.routeNo) {
      const route = routes.find((r) => r.routeNo === trip.routeNo)
      if (route) {
        totalDistance += route.routeLengthBtoA
      } else {
        // Eğer hat bulunamazsa ortalama uzunluğu kullan
        const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthBtoA, 0) / routes.length
        totalDistance += avgRouteLength
      }
    } else {
      // Eğer hat belirtilmemişse ortalama uzunluğu kullan
      const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthBtoA, 0) / routes.length
      totalDistance += avgRouteLength
    }
  })

  return totalDistance
}

// Maliyet hesaplama fonksiyonlarını düzelt
// Sefer çizelgesine göre toplam yakıt maliyeti hesaplama
const calculateTotalFuelCost = (
  scheduleResults: ScheduleResult,
  routes: RouteData[],
  parameters: BusParameters,
): number => {
  let totalFuelCost = 0

  // A->B yönündeki seferler için yakıt maliyeti
  scheduleResults.scheduleAB.forEach((trip) => {
    const fuelCostPerKm =
      trip.busType === "minibus"
        ? parameters.minibus.fuelCost
        : trip.busType === "solo"
          ? parameters.solo.fuelCost
          : trip.busType === "articulated"
            ? parameters.articulated.fuelCost
            : 0

    // İlgili hattın uzunluğunu kullan
    if (trip.routeNo) {
      const route = routes.find((r) => r.routeNo === trip.routeNo)
      if (route) {
        totalFuelCost += fuelCostPerKm * route.routeLengthAtoB
      } else {
        // Eğer hat bulunamazsa ortalama uzunluğu kullan
        const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthAtoB, 0) / routes.length
        totalFuelCost += fuelCostPerKm * avgRouteLength
      }
    } else {
      // Eğer hat belirtilmemişse ortalama uzunluğu kullan
      const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthAtoB, 0) / routes.length
      totalFuelCost += fuelCostPerKm * avgRouteLength
    }
  })

  // B->A yönündeki seferler için yakıt maliyeti
  scheduleResults.scheduleBA.forEach((trip) => {
    const fuelCostPerKm =
      trip.busType === "minibus"
        ? parameters.minibus.fuelCost
        : trip.busType === "solo"
          ? parameters.solo.fuelCost
          : trip.busType === "articulated"
            ? parameters.articulated.fuelCost
            : 0

    // İlgili hattın uzunluğunu kullan
    if (trip.routeNo) {
      const route = routes.find((r) => r.routeNo === trip.routeNo)
      if (route) {
        totalFuelCost += fuelCostPerKm * route.routeLengthBtoA
      } else {
        // Eğer hat bulunamazsa ortalama uzunluğu kullan
        const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthBtoA, 0) / routes.length
        totalFuelCost += fuelCostPerKm * avgRouteLength
      }
    } else {
      // Eğer hat belirtilmemişse ortalama uzunluğu kullan
      const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthBtoA, 0) / routes.length
      totalFuelCost += fuelCostPerKm * avgRouteLength
    }
  })

  return totalFuelCost
}

// Sefer çizelgesine göre toplam bakım maliyeti hesaplama
const calculateTotalMaintenanceCost = (
  scheduleResults: ScheduleResult,
  routes: RouteData[],
  parameters: BusParameters,
): number => {
  let totalMaintenanceCost = 0

  // A->B yönündeki seferler için bakım maliyeti
  scheduleResults.scheduleAB.forEach((trip) => {
    const maintenanceCostPerKm =
      trip.busType === "minibus"
        ? parameters.minibus.maintenanceCost
        : trip.busType === "solo"
          ? parameters.solo.maintenanceCost
          : trip.busType === "articulated"
            ? parameters.articulated.maintenanceCost
            : 0

    // İlgili hattın uzunluğunu kullan
    if (trip.routeNo) {
      const route = routes.find((r) => r.routeNo === trip.routeNo)
      if (route) {
        totalMaintenanceCost += maintenanceCostPerKm * route.routeLengthAtoB
      } else {
        // Eğer hat bulunamazsa ortalama uzunluğu kullan
        const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthAtoB, 0) / routes.length
        totalMaintenanceCost += maintenanceCostPerKm * avgRouteLength
      }
    } else {
      // Eğer hat belirtilmemişse ortalama uzunluğu kullan
      const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthAtoB, 0) / routes.length
      totalMaintenanceCost += maintenanceCostPerKm * avgRouteLength
    }
  })

  // B->A yönündeki seferler için bakım maliyeti
  scheduleResults.scheduleBA.forEach((trip) => {
    const maintenanceCostPerKm =
      trip.busType === "minibus"
        ? parameters.minibus.maintenanceCost
        : trip.busType === "solo"
          ? parameters.solo.maintenanceCost
          : trip.busType === "articulated"
            ? parameters.articulated.maintenanceCost
            : 0

    // İlgili hattın uzunluğunu kullan
    if (trip.routeNo) {
      const route = routes.find((r) => r.routeNo === trip.routeNo)
      if (route) {
        totalMaintenanceCost += maintenanceCostPerKm * route.routeLengthBtoA
      } else {
        // Eğer hat bulunamazsa ortalama uzunluğu kullan
        const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthBtoA, 0) / routes.length
        totalMaintenanceCost += maintenanceCostPerKm * avgRouteLength
      }
    } else {
      // Eğer hat belirtilmemişse ortalama uzunluğu kullan
      const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthBtoA, 0) / routes.length
      totalMaintenanceCost += maintenanceCostPerKm * avgRouteLength
    }
  })

  return totalMaintenanceCost
}

// Sefer çizelgesine göre toplam amortisman maliyeti hesaplama
const calculateTotalDepreciationCost = (
  scheduleResults: ScheduleResult,
  routes: RouteData[],
  parameters: BusParameters,
): number => {
  let totalDepreciationCost = 0

  // A->B yönündeki seferler için amortisman maliyeti
  scheduleResults.scheduleAB.forEach((trip) => {
    const depreciationCostPerKm =
      trip.busType === "minibus"
        ? parameters.minibus.depreciationCost
        : trip.busType === "solo"
          ? parameters.solo.depreciationCost
          : trip.busType === "articulated"
            ? parameters.articulated.depreciationCost
            : 0

    // İlgili hattın uzunluğunu kullan
    if (trip.routeNo) {
      const route = routes.find((r) => r.routeNo === trip.routeNo)
      if (route) {
        totalDepreciationCost += depreciationCostPerKm * route.routeLengthAtoB
      } else {
        // Eğer hat bulunamazsa ortalama uzunluğu kullan
        const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthAtoB, 0) / routes.length
        totalDepreciationCost += depreciationCostPerKm * avgRouteLength
      }
    } else {
      // Eğer hat belirtilmemişse ortalama uzunluğu kullan
      const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthAtoB, 0) / routes.length
      totalDepreciationCost += depreciationCostPerKm * avgRouteLength
    }
  })

  // B->A yönündeki seferler için amortisman maliyeti
  scheduleResults.scheduleBA.forEach((trip) => {
    const depreciationCostPerKm =
      trip.busType === "minibus"
        ? parameters.minibus.depreciationCost
        : trip.busType === "solo"
          ? parameters.solo.depreciationCost
          : trip.busType === "articulated"
            ? parameters.articulated.depreciationCost
            : 0

    // İlgili hattın uzunluğunu kullan
    if (trip.routeNo) {
      const route = routes.find((r) => r.routeNo === trip.routeNo)
      if (route) {
        totalDepreciationCost += depreciationCostPerKm * route.routeLengthBtoA
      } else {
        // Eğer hat bulunamazsa ortalama uzunluğu kullan
        const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthBtoA, 0) / routes.length
        totalDepreciationCost += depreciationCostPerKm * avgRouteLength
      }
    } else {
      // Eğer hat belirtilmemişse ortalama uzunluğu kullan
      const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthBtoA, 0) / routes.length
      totalDepreciationCost += depreciationCostPerKm * avgRouteLength
    }
  })

  return totalDepreciationCost
}

// Sefer çizelgesine göre toplam sürücü maliyeti hesaplama
const calculateTotalDriverCost = (
  scheduleResults: ScheduleResult,
  routes: RouteData[],
  parameters: BusParameters,
): number => {
  let totalDriverCost = 0

  // A->B yönündeki seferler için sürücü maliyeti
  scheduleResults.scheduleAB.forEach((trip) => {
    // İlgili hattın uzunluğunu kullan
    if (trip.routeNo) {
      const route = routes.find((r) => r.routeNo === trip.routeNo)
      if (route) {
        totalDriverCost += parameters.driverCost * route.routeLengthAtoB
      } else {
        // Eğer hat bulunamazsa ortalama uzunluğu kullan
        const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthAtoB, 0) / routes.length
        totalDriverCost += parameters.driverCost * avgRouteLength
      }
    } else {
      // Eğer hat belirtilmemişse ortalama uzunluğu kullan
      const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthAtoB, 0) / routes.length
      totalDriverCost += parameters.driverCost * avgRouteLength
    }
  })

  // B->A yönündeki seferler için sürücü maliyeti
  scheduleResults.scheduleBA.forEach((trip) => {
    // İlgili hattın uzunluğunu kullan
    if (trip.routeNo) {
      const route = routes.find((r) => r.routeNo === trip.routeNo)
      if (route) {
        totalDriverCost += parameters.driverCost * route.routeLengthBtoA
      } else {
        // Eğer hat bulunamazsa ortalama uzunluğu kullan
        const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthBtoA, 0) / routes.length
        totalDriverCost += parameters.driverCost * avgRouteLength
      }
    } else {
      // Eğer hat belirtilmemişse ortalama uzunluğu kullan
      const avgRouteLength = routes.reduce((sum, route) => sum + route.routeLengthBtoA, 0) / routes.length
      totalDriverCost += parameters.driverCost * avgRouteLength
    }
  })

  return totalDriverCost
}

// Sefer çizelgesine göre toplam maliyet hesaplama
const calculateTotalCost = (
  scheduleResults: ScheduleResult,
  routes: RouteData[],
  parameters: BusParameters,
): number => {
  const fuelCost = calculateTotalFuelCost(scheduleResults, routes, parameters)
  const maintenanceCost = calculateTotalMaintenanceCost(scheduleResults, routes, parameters)
  const depreciationCost = calculateTotalDepreciationCost(scheduleResults, routes, parameters)
  const driverCost = calculateTotalDriverCost(scheduleResults, routes, parameters)

  return fuelCost + maintenanceCost + depreciationCost + driverCost
}

// Sefer çizelgesine göre kilometre başına maliyet hesaplama
const calculateCostPerKm = (
  scheduleResults: ScheduleResult,
  routes: RouteData[],
  parameters: BusParameters,
): number => {
  // Toplam mesafeyi hesapla
  let totalDistance = 0

  // A->B yönündeki toplam mesafe
  routes.forEach((route) => {
    totalDistance +=
      route.routeLengthAtoB * scheduleResults.scheduleAB.filter((trip) => trip.routeNo === route.routeNo).length
  })

  // B->A yönündeki toplam mesafe
  routes.forEach((route) => {
    totalDistance +=
      route.routeLengthBtoA * scheduleResults.scheduleBA.filter((trip) => trip.routeNo === route.routeNo).length
  })

  // Toplam maliyeti hesapla
  const totalCost = calculateTotalCost(scheduleResults, routes, parameters)

  // Kilometre başına maliyet
  return totalDistance > 0 ? totalCost / totalDistance : 0
}

export default function ResultsTab() {
  const { results, kpis, parameters, routes, scheduleResults, setActiveStep } = useBusOptimization()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "routeNo",
    direction: "asc",
  })
  const [tableView, setTableView] = useState<"all" | "compact">("compact")
  const [activeTab, setActiveTab] = useState<"busOptimization" | "scheduleResults">("scheduleResults")

  // Column definitions for better organization
  const allColumns = [
    { id: "routeNo", name: "Hat No", filterable: true, numeric: true },
    { id: "routeName", name: "Hat Adı", filterable: true, numeric: false },
    { id: "routeLength", name: "Uzunluk (km)", filterable: true, numeric: true },
    { id: "minibus", name: "Midibüs", filterable: true, numeric: true },
    { id: "solo", name: "Solo", filterable: true, numeric: true },
    { id: "articulated", name: "Körüklü", filterable: true, numeric: true },
    { id: "totalTrips", name: "Toplam Sefer", filterable: true, numeric: true },
    { id: "fuelCost", name: "Yakıt Maliyeti (TL)", filterable: true, numeric: true },
    { id: "maintenanceCost", name: "Bakım Maliyeti (TL)", filterable: true, numeric: true },
    { id: "depreciationCost", name: "Amortisman (TL)", filterable: true, numeric: true },
    { id: "driverCost", name: "Sürücü Maliyeti (TL)", filterable: true, numeric: true },
    { id: "totalCost", name: "Toplam Maliyet (TL)", filterable: true, numeric: true },
    { id: "carbonEmission", name: "Karbon Emisyonu (kg)", filterable: true, numeric: true },
    { id: "peakPassengersAtoB", name: "A→B Yolcu", filterable: true, numeric: true },
    { id: "peakPassengersBtoA", name: "B→A Yolcu", filterable: true, numeric: true },
    { id: "capacityUtilization", name: "Kapasite Kullanımı (%)", filterable: true, numeric: true },
  ]

  // Update the compactColumns array to include all required columns
  const compactColumns = [
    { id: "routeNo", name: "Hat No", filterable: true, numeric: true },
    { id: "routeLength", name: "Uzunluk (km)", filterable: true, numeric: true },
    { id: "minibus", name: "Midibüs", filterable: true, numeric: true },
    { id: "solo", name: "Solo", filterable: true, numeric: true },
    { id: "articulated", name: "Körüklü", filterable: true, numeric: true },
    { id: "totalTrips", name: "Toplam Sefer", filterable: true, numeric: true },
    { id: "totalCost", name: "Toplam Maliyet (TL)", filterable: true, numeric: true },
    { id: "peakPassengersAtoB", name: "A→B Yolcu", filterable: true, numeric: true },
    { id: "peakPassengersBtoA", name: "B→A Yolcu", filterable: true, numeric: true },
    { id: "capacityUtilization", name: "Kapasite (%)", filterable: true, numeric: true },
  ]

  const columns = tableView === "all" ? allColumns : compactColumns

  // Handle sorting
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc"

    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc"
      } else if (sortConfig.direction === "desc") {
        direction = null
      }
    }

    setSortConfig({ key, direction })
  }

  // Get sort icon based on current sort state
  const getSortIcon = (columnId: string) => {
    if (sortConfig.key !== columnId) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground" />
    }

    if (sortConfig.direction === "asc") {
      return <ArrowUp className="h-3 w-3 ml-1 text-primary" />
    }

    if (sortConfig.direction === "desc") {
      return <ArrowDown className="h-3 w-3 ml-1 text-primary" />
    }

    return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground" />
  }

  // Handle filter changes
  const handleFilterChange = (columnId: string, value: any) => {
    setActiveFilters((prev) => {
      if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
        const newFilters = { ...prev }
        delete newFilters[columnId]
        return newFilters
      }
      return { ...prev, [columnId]: value }
    })
  }

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters({})
    setSearchTerm("")
  }

  // Get unique values for a column (for filter options)
  const getUniqueValues = (columnId: string) => {
    const values = new Set<any>()

    results.forEach((result) => {
      let value

      if (columnId === "totalTrips") {
        value = result.minibus + result.solo + result.articulated
      } else if (columnId === "peakPassengers") {
        const route = routes.find((r) => r.routeNo === result.routeNo)
        value = route ? route.peakPassengers : 0
      } else if (columnId === "capacityUtilization") {
        value = (result.capacityUtilization * 100).toFixed(2)
      } else if (
        columnId === "fuelCost" ||
        columnId === "maintenanceCost" ||
        columnId === "depreciationCost" ||
        columnId === "driverCost" ||
        columnId === "totalCost" ||
        columnId === "carbonEmission"
      ) {
        value = result[columnId].toFixed(2)
      } else if (result[columnId] !== undefined) {
        value = result[columnId]
      }

      if (value !== undefined) {
        values.add(value)
      }
    })

    return Array.from(values).sort((a, b) => {
      if (typeof a === "number" && typeof b === "number") {
        return a - b
      }
      return String(a).localeCompare(String(b))
    })
  }

  // Filter and sort the results
  const filteredAndSortedResults = useMemo(() => {
    // First apply search term filter
    let filtered = [...results]

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      filtered = filtered.filter((result) => {
        const totalTrips = result.minibus + result.solo + result.articulated

        return (
          result.routeNo.toLowerCase().includes(lowerSearchTerm) ||
          result.routeName.toLowerCase().includes(lowerSearchTerm) ||
          result.routeLength.toString().includes(lowerSearchTerm) ||
          result.minibus.toString().includes(lowerSearchTerm) ||
          result.solo.toString().includes(lowerSearchTerm) ||
          result.articulated.toString().includes(lowerSearchTerm) ||
          totalTrips.toString().includes(lowerSearchTerm) ||
          result.fuelCost.toFixed(2).includes(lowerSearchTerm) ||
          result.maintenanceCost.toFixed(2).includes(lowerSearchTerm) ||
          result.depreciationCost.toFixed(2).includes(lowerSearchTerm) ||
          result.driverCost.toFixed(2).includes(lowerSearchTerm) ||
          result.totalCost.toFixed(2).includes(lowerSearchTerm) ||
          result.carbonEmission.toFixed(2).includes(lowerSearchTerm) ||
          result.peakPassengersAtoB.toString().includes(lowerSearchTerm) ||
          result.peakPassengersBtoA.toString().includes(lowerSearchTerm) ||
          (result.capacityUtilization * 100).toFixed(2).includes(lowerSearchTerm)
        )
      })
    }

    // Then apply column filters
    if (Object.keys(activeFilters).length > 0) {
      filtered = filtered.filter((result) => {
        return Object.entries(activeFilters).every(([columnId, filterValue]) => {
          if (columnId === "totalTrips") {
            const totalTrips = result.minibus + result.solo + result.articulated
            return filterValue.includes(totalTrips.toString())
          } else if (columnId === "peakPassengersAtoB") {
            return filterValue.includes(result.peakPassengersAtoB.toString())
          } else if (columnId === "peakPassengersBtoA") {
            return filterValue.includes(result.peakPassengersBtoA.toString())
          } else if (columnId === "capacityUtilization") {
            const utilization = (result.capacityUtilization * 100).toFixed(2)
            return filterValue.includes(utilization)
          } else if (
            columnId === "fuelCost" ||
            columnId === "maintenanceCost" ||
            columnId === "depreciationCost" ||
            columnId === "driverCost" ||
            columnId === "totalCost" ||
            columnId === "carbonEmission"
          ) {
            const value = result[columnId].toFixed(2)
            return filterValue.includes(value)
          } else {
            return filterValue.includes(result[columnId].toString())
          }
        })
      })
    }

    // Finally sort the results
    if (sortConfig.direction) {
      filtered.sort((a, b) => {
        let aValue, bValue

        if (sortConfig.key === "totalTrips") {
          aValue = a.minibus + a.solo + a.articulated
          bValue = b.minibus + b.solo + b.articulated
        } else if (sortConfig.key === "peakPassengersAtoB") {
          aValue = a.peakPassengersAtoB
          bValue = b.peakPassengersAtoB
        } else if (sortConfig.key === "peakPassengersBtoA") {
          aValue = a.peakPassengersBtoA
          bValue = b.peakPassengersBtoA
        } else if (sortConfig.key === "capacityUtilization") {
          aValue = a.capacityUtilization
          bValue = b.capacityUtilization
        } else {
          aValue = a[sortConfig.key]
          bValue = b[sortConfig.key]
        }

        // Handle numeric sorting
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue
        }

        // Handle string sorting
        const aString = String(aValue)
        const bString = String(bValue)

        // Try to convert to numbers if they look like numbers
        const aNum = Number(aString)
        const bNum = Number(bString)

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum
        }

        return sortConfig.direction === "asc" ? aString.localeCompare(bString) : bString.localeCompare(aString)
      })
    }

    return filtered
  }, [results, searchTerm, activeFilters, sortConfig])

  // Excel dışa aktarma fonksiyonunu güncelle - hat bazlı çalışma sayfaları ekle
  const exportToExcel = () => {
    if (results.length === 0) return

    // Use the filtered and sorted results for export
    const sortedResults = filteredAndSortedResults

    const headers = [
      "Hat No",
      "Hat Adı",
      "A→B Uzunluk (km)",
      "B→A Uzunluk (km)",
      "Midibüs",
      "Solo",
      "Körüklü",
      "Toplam Sefer Sayısı",
      "Yakıt Maliyeti (TL)",
      "Bakım Maliyeti (TL)",
      "Amortisman (TL)",
      "Sürücü Maliyeti (TL)",
      "Toplam Maliyet (TL)",
      "Karbon Emisyonu (kg)",
      "A→B Yolcu Sayısı",
      "B→A Yolcu Sayısı",
      "Kapasite Kullanımı (%)",
    ]

    // Create worksheet data - Hat Bazlı Sonuçlar tablosundaki verilerle eşleşecek şekilde güncellendi
    const wsData = [headers]

    // Eğer scheduleResults varsa, Hat Bazlı Sonuçlar tablosundaki verileri kullan
    if (scheduleResults && scheduleResults.routeSchedules) {
      Object.entries(scheduleResults.routeSchedules).forEach(([routeNo, routeData]) => {
        const route = routes.find((r) => r.routeNo === routeNo)
        if (!route) return

        // Count vehicle types used for this route
        const vehicleCounts = {
          minibus: 0,
          solo: 0,
          articulated: 0,
        }

        // Get unique bus IDs for this route
        const busIds = new Set()
        ;[...routeData.scheduleAB, ...routeData.scheduleBA].forEach((trip) => {
          busIds.add(trip.busId)
        })

        // Count vehicle types
        Array.from(busIds).forEach((busId) => {
          const busInfo = scheduleResults.busUtilization[busId as string]
          if (busInfo) {
            vehicleCounts[busInfo.busType]++
          }
        })

        // Calculate trip counts
        const abTripCount = routeData.scheduleAB.length
        const baTripCount = routeData.scheduleBA.length
        const totalTrips = abTripCount + baTripCount

        // Calculate costs
        // Calculate fuel cost based on vehicle types, route lengths and trip counts
        let fuelCost = 0
        routeData.scheduleAB.forEach((trip) => {
          if (trip.busType === "minibus") {
            fuelCost += parameters.minibus.fuelCost * route.routeLengthAtoB
          } else if (trip.busType === "solo") {
            fuelCost += parameters.solo.fuelCost * route.routeLengthAtoB
          } else if (trip.busType === "articulated") {
            fuelCost += parameters.articulated.fuelCost * route.routeLengthAtoB
          }
        })

        routeData.scheduleBA.forEach((trip) => {
          if (trip.busType === "minibus") {
            fuelCost += parameters.minibus.fuelCost * route.routeLengthBtoA
          } else if (trip.busType === "solo") {
            fuelCost += parameters.solo.fuelCost * route.routeLengthBtoA
          } else if (trip.busType === "articulated") {
            fuelCost += parameters.articulated.fuelCost * route.routeLengthBtoA
          }
        })

        // Calculate maintenance cost
        let maintenanceCost = 0
        routeData.scheduleAB.forEach((trip) => {
          if (trip.busType === "minibus") {
            maintenanceCost += parameters.minibus.maintenanceCost * route.routeLengthAtoB
          } else if (trip.busType === "solo") {
            maintenanceCost += parameters.solo.maintenanceCost * route.routeLengthAtoB
          } else if (trip.busType === "articulated") {
            maintenanceCost += parameters.articulated.maintenanceCost * route.routeLengthAtoB
          }
        })

        routeData.scheduleBA.forEach((trip) => {
          if (trip.busType === "minibus") {
            maintenanceCost += parameters.minibus.maintenanceCost * route.routeLengthBtoA
          } else if (trip.busType === "solo") {
            maintenanceCost += parameters.solo.maintenanceCost * route.routeLengthBtoA
          } else if (trip.busType === "articulated") {
            maintenanceCost += parameters.articulated.maintenanceCost * route.routeLengthBtoA
          }
        })

        // Calculate depreciation cost
        let depreciationCost = 0
        routeData.scheduleAB.forEach((trip) => {
          if (trip.busType === "minibus") {
            depreciationCost += parameters.minibus.depreciationCost * route.routeLengthAtoB
          } else if (trip.busType === "solo") {
            depreciationCost += parameters.solo.depreciationCost * route.routeLengthAtoB
          } else if (trip.busType === "articulated") {
            depreciationCost += parameters.articulated.depreciationCost * route.routeLengthAtoB
          }
        })

        routeData.scheduleBA.forEach((trip) => {
          if (trip.busType === "minibus") {
            depreciationCost += parameters.minibus.depreciationCost * route.routeLengthBtoA
          } else if (trip.busType === "solo") {
            depreciationCost += parameters.solo.depreciationCost * route.routeLengthBtoA
          } else if (trip.busType === "articulated") {
            depreciationCost += parameters.articulated.depreciationCost * route.routeLengthBtoA
          }
        })

        // Calculate driver cost
        const driverCost =
          parameters.driverCost * (abTripCount * route.routeLengthAtoB + baTripCount * route.routeLengthBtoA)

        // Calculate total cost
        const totalCost = fuelCost + maintenanceCost + depreciationCost + driverCost

        // Calculate carbon emission
        let carbonEmission = 0
        routeData.scheduleAB.forEach((trip) => {
          if (trip.busType === "minibus") {
            carbonEmission += parameters.minibus.carbonEmission * route.routeLengthAtoB
          } else if (trip.busType === "solo") {
            carbonEmission += parameters.solo.carbonEmission * route.routeLengthAtoB
          } else if (trip.busType === "articulated") {
            carbonEmission += parameters.articulated.carbonEmission * route.routeLengthAtoB
          }
        })

        routeData.scheduleBA.forEach((trip) => {
          if (trip.busType === "minibus") {
            carbonEmission += parameters.minibus.carbonEmission * route.routeLengthBtoA
          } else if (trip.busType === "solo") {
            carbonEmission += parameters.solo.carbonEmission * route.routeLengthBtoA
          } else if (trip.busType === "articulated") {
            carbonEmission += parameters.articulated.carbonEmission * route.routeLengthBtoA
          }
        })

        // Calculate capacity utilization
        const totalCapacity =
          routeData.scheduleAB.reduce((sum, trip) => {
            if (trip.busType === "minibus") return sum + parameters.minibus.capacity
            if (trip.busType === "solo") return sum + parameters.solo.capacity
            if (trip.busType === "articulated") return sum + parameters.articulated.capacity
            return sum
          }, 0) +
          routeData.scheduleBA.reduce((sum, trip) => {
            if (trip.busType === "minibus") return sum + parameters.minibus.capacity
            if (trip.busType === "solo") return sum + parameters.solo.capacity
            if (trip.busType === "articulated") return sum + parameters.articulated.capacity
            return sum
          }, 0)

        const totalPassengers = route.peakPassengersAtoB + route.peakPassengersBtoA
        const capacityUtilization = totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0

        // Add row to worksheet data
        wsData.push([
          routeNo,
          route.routeName,
          route.routeLengthAtoB,
          route.routeLengthBtoA,
          vehicleCounts.minibus,
          vehicleCounts.solo,
          vehicleCounts.articulated,
          totalTrips,
          fuelCost,
          maintenanceCost,
          depreciationCost,
          driverCost,
          totalCost,
          carbonEmission,
          route.peakPassengersAtoB,
          route.peakPassengersBtoA,
          capacityUtilization,
        ])
      })
    } else {
      // Eğer scheduleResults yoksa, orijinal optimizasyon sonuçlarını kullan
      sortedResults.forEach((r) => {
        // Find the corresponding route to get route lengths and travel times
        const route = routes.find((route) => route.routeNo === r.routeNo)
        const totalTrips = r.minibus + r.solo + r.articulated

        wsData.push([
          r.routeNo,
          r.routeName,
          route ? route.routeLengthAtoB : 0,
          route ? route.routeLengthBtoA : 0,
          r.minibus,
          r.solo,
          r.articulated,
          totalTrips,
          r.fuelCost,
          r.maintenanceCost,
          r.depreciationCost,
          r.driverCost,
          r.totalCost,
          r.carbonEmission,
          r.peakPassengersAtoB,
          r.peakPassengersBtoA,
          r.capacityUtilization * 100,
        ])
      })
    }

    // Browser-compatible approach for Excel export
    try {
      // Create a workbook
      const wb = XLSX.utils.book_new()

      // Create a worksheet from the data
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, "Otobüs Optimizasyon")

      // Add schedule worksheets if available
      if (scheduleResults) {
        // Define scheduleData here
        const scheduleData = {
          ab: [["Sefer", "Saat", "Hat", "Otobüs", "Tip"]].concat(
            scheduleResults.scheduleAB.map((trip, index) => [
              index + 1,
              trip.time,
              trip.routeNo ? `Hat ${trip.routeNo}` : "-",
              trip.busId,
              trip.busType === "minibus" ? "Midibüs" : trip.busType === "solo" ? "Solo" : "Körüklü",
            ]),
          ),
          ba: [["Sefer", "Saat", "Hat", "Otobüs", "Tip"]].concat(
            scheduleResults.scheduleBA.map((trip, index) => [
              index + 1,
              trip.time,
              trip.routeNo ? `Hat ${trip.routeNo}` : "-",
              trip.busId,
              trip.busType === "minibus" ? "Midibüs" : trip.busType === "solo" ? "Solo" : "Körüklü",
            ]),
          ),
          routes: Object.entries(scheduleResults.routeSchedules).reduce(
            (acc, [routeNo, routeData]) => {
              acc[`Hat ${routeNo}`] = [["Sefer", "Saat", "Yön", "Otobüs", "Tip"]].concat(
                [
                  ...routeData.scheduleAB.map((trip) => ({ ...trip, direction: "A→B" })),
                  ...routeData.scheduleBA.map((trip) => ({ ...trip, direction: "B→A" })),
                ].map((trip, index) => [
                  index + 1,
                  trip.time,
                  trip.direction,
                  trip.busId,
                  trip.busType === "minibus" ? "Midibüs" : trip.busType === "solo" ? "Solo" : "Körüklü",
                ]),
              )
              return acc
            },
            {} as { [key: string]: any[][] },
          ),
        }
        const wsAB = XLSX.utils.aoa_to_sheet(scheduleData.ab)
        const wsBA = XLSX.utils.aoa_to_sheet(scheduleData.ba)
        XLSX.utils.book_append_sheet(wb, wsAB, "A→B Sefer Çizelgesi")
        XLSX.utils.book_append_sheet(wb, wsBA, "B→A Sefer Çizelgesi")

        // Hat bazlı çizelge sayfalarını ekle
        if (scheduleData.routes) {
          Object.entries(scheduleData.routes).forEach(([routeName, routeData]) => {
            const wsRoute = XLSX.utils.aoa_to_sheet(routeData)
            XLSX.utils.book_append_sheet(wb, wsRoute, routeName)
          })
        }
      }

      // Generate Excel file as a binary string
      const excelBinary = XLSX.write(wb, { bookType: "xlsx", type: "binary" })

      // Convert binary string to ArrayBuffer
      const buffer = new ArrayBuffer(excelBinary.length)
      const view = new Uint8Array(buffer)
      for (let i = 0; i < excelBinary.length; i++) {
        view[i] = excelBinary.charCodeAt(i) & 0xff
      }

      // Create Blob from ArrayBuffer
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "otobüs_optimizasyon_sonuçları.xlsx"

      // Append to document, trigger click, and clean up
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Excel export failed:", error)
      alert("Excel dışa aktarma işlemi başarısız oldu. Lütfen tekrar deneyin.")
    }
  }

  const goBack = () => {
    setActiveStep("scheduleOptimization")
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h3 className="text-xl font-medium mb-3">Henüz Sonuç Yok</h3>
        <p className="text-muted-foreground text-center">
          Sonuçları görmek için lütfen önce Otobüs Tipi ve Sefer Çizelgesi optimizasyonlarını çalıştırın.
        </p>
      </div>
    )
  }

  // Calculate fleet usage
  const totalMinibusUsed = scheduleResults
    ? Object.values(scheduleResults.busUtilization).filter((bus) => bus.busType === "minibus").length
    : results.reduce((sum, r) => sum + r.minibus, 0)

  const totalSoloUsed = scheduleResults
    ? Object.values(scheduleResults.busUtilization).filter((bus) => bus.busType === "solo").length
    : results.reduce((sum, r) => sum + r.solo, 0)

  const totalArticulatedUsed = scheduleResults
    ? Object.values(scheduleResults.busUtilization).filter((bus) => bus.busType === "articulated").length
    : results.reduce((sum, r) => sum + r.articulated, 0)

  // Calculate percentages
  const minibusPercentage =
    parameters.minibus.fleetCount > 0 ? (totalMinibusUsed / parameters.minibus.fleetCount) * 100 : 0
  const soloPercentage = parameters.solo.fleetCount > 0 ? (totalSoloUsed / parameters.solo.fleetCount) * 100 : 0
  const articulatedPercentage =
    parameters.articulated.fleetCount > 0 ? (totalArticulatedUsed / parameters.articulated.fleetCount) * 100 : 0

  const getBusColorClass = (busId: string) => {
    const busNumber = Number.parseInt(busId.split("-")[1], 10)
    const colorIndex = busNumber % 5

    switch (colorIndex) {
      case 0:
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
      case 1:
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
      case 2:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
      case 3:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
      case 4:
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Optimizasyon Sonuçları</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={goBack}
              className="px-4 py-2 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri Dön
            </Button>
            <Button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg h-9 px-4 rounded-md"
            >
              <Download size={16} />
              Excel'e Aktar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="scheduleResults" className="w-full space-y-4">
          <TabsList className="grid w-full grid-cols-2 mb-6 custom-tabs">
            <TabsTrigger value="busOptimization" className="custom-tab" onClick={() => setActiveTab("busOptimization")}>
              <Bus className="mr-2 h-4 w-4" />
              Otobüs Optimizasyonu
            </TabsTrigger>
            <TabsTrigger value="scheduleResults" className="custom-tab" onClick={() => setActiveTab("scheduleResults")}>
              <Clock className="mr-2 h-4 w-4" />
              Sefer Çizelgeleri
            </TabsTrigger>
          </TabsList>
          <TabsContent value="busOptimization">
            {kpis && (
              <div className="space-y-6">
                {/* Genel Performans Göstergeleri Başlığı */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-md bg-white dark:bg-gray-950 relative">
                  <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none"></div>
                  <div className="relative p-5 z-10">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-blue-700 dark:text-blue-400">
                      <BarChart3 className="h-5 w-5" />
                      Genel Performans Göstergeleri
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {/* Optimizasyon Süresi */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-blue-400/10 to-gray-400/20 p-[1px] shadow-md transition-transform hover:scale-102 cursor-help">
                            <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 h-full">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full">
                                  <Timer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-sm font-medium text-muted-foreground">Optimizasyon Süresi</h3>
                              </div>
                              <div className="text-xl font-bold">{kpis.optimizationTime.toFixed(3)} saniye</div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-2 text-xs">
                          <p>Optimizasyon algoritmasının çalışma süresi</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Optimize Edilen Hat Sayısı */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-blue-400/10 to-gray-400/20 p-[1px] shadow-md transition-transform hover:scale-102 cursor-help">
                            <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 h-full">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full">
                                  <RouteIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-sm font-medium text-muted-foreground">Optimize Edilen Hat</h3>
                              </div>
                              <div className="text-xl font-bold">{results.length} hat</div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-2 text-xs">
                          <p>Optimizasyon yapılan toplam hat sayısı</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Toplam Taşınan Yolcu */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-blue-400/10 to-gray-400/20 p-[1px] shadow-md transition-transform hover:scale-102 cursor-help">
                            <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 h-full">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full">
                                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-sm font-medium text-muted-foreground">Toplam Taşınan Yolcu</h3>
                              </div>
                              <div className="text-xl font-bold">
                                {calculateTotalPassengers(routes).toLocaleString("tr-TR")} kişi
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-2 text-xs">
                          <p>Tüm hatlarda taşınan toplam yolcu sayısı</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Kapasite Kullanım Yüzdesi */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-blue-400/10 to-gray-400/20 p-[1px] shadow-md transition-transform hover:scale-102 cursor-help">
                            <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 h-full">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full">
                                  <Gauge className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-sm font-medium text-muted-foreground">Kapasite Kullanım Yüzdesi</h3>
                              </div>
                              {scheduleResults
                                ? (() => {
                                    const totalCapacity =
                                      scheduleResults.scheduleAB.reduce((sum, trip) => {
                                        if (trip.busType === "minibus") return sum + parameters.minibus.capacity
                                        if (trip.busType === "solo") return sum + parameters.solo.capacity
                                        if (trip.busType === "articulated") return sum + parameters.articulated.capacity
                                        return sum
                                      }, 0) +
                                      scheduleResults.scheduleBA.reduce((sum, trip) => {
                                        if (trip.busType === "minibus") return sum + parameters.minibus.capacity
                                        if (trip.busType === "solo") return sum + parameters.solo.capacity
                                        if (trip.busType === "articulated") return sum + parameters.articulated.capacity
                                        return sum
                                      }, 0)

                                    const totalPassengers = calculateTotalPassengers(routes)
                                    const utilizationPercentage =
                                      totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0

                                    return <div className="text-xl font-bold">{utilizationPercentage.toFixed(2)}%</div>
                                  })()
                                : (() => {
                                    const totalCapacity = results.reduce(
                                      (sum, r) =>
                                        sum +
                                        (r.minibus * parameters.minibus.capacity +
                                          r.solo * parameters.solo.capacity +
                                          r.articulated * parameters.articulated.capacity),
                                      0,
                                    )
                                    const totalPassengers = calculateTotalPassengers(routes)
                                    const utilizationPercentage =
                                      totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0
                                    return <div className="text-xl font-bold">{utilizationPercentage.toFixed(2)}%</div>
                                  })()}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-2 text-xs">
                          <p>Taşınan yolcu sayısının atama sonucunda sunulan kapasiteye oranı</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Toplam Kat Edilen Kilometre */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-blue-400/10 to-gray-400/20 p-[1px] shadow-md transition-transform hover:scale-102 cursor-help">
                            <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 h-full">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full">
                                  <RouteIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-sm font-medium text-muted-foreground">
                                  Toplam Kat Edilen Kilometre
                                </h3>
                              </div>
                              <div className="text-xl font-bold">
                                {scheduleResults
                                  ? calculateTotalDistance(scheduleResults, routes).toLocaleString("tr-TR")
                                  : kpis.totalDistance.toLocaleString("tr-TR")}{" "}
                                km
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-2 text-xs">
                          <p>Tüm otobüslerin kat ettiği toplam mesafe</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Filo Kullanımı Başlığı */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-md bg-white dark:bg-gray-950 relative">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,64,60,0.05)_25%,rgba(68,64,60,0.05)_50%,transparent_50%,transparent_75%,rgba(68,64,60,0.05)_75%)] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_25%,rgba(255,255,255,0.03)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.03)_75%)] [background-size:20px_20px] opacity-30 pointer-events-none"></div>
                  <div className="relative p-5 z-10">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-purple-700 dark:text-purple-400">
                      <Bus className="h-5 w-5" />
                      Filo Kullanımı
                    </h3>

                    <div className="space-y-4">
                      {/* Araç tipleri tek satırda */}
                      <div className="grid grid-cols-3 gap-4">
                        {/* Midibüs */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="bg-teal-100 dark:bg-teal-900/30 p-1.5 rounded-full">
                              <Bus className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                            </div>
                            <span className="text-sm font-medium">Midibüs</span>
                          </div>
                          <div className="text-sm font-medium">
                            {totalMinibusUsed}/{parameters.minibus.fleetCount} ({minibusPercentage.toFixed(1)}%)
                          </div>
                          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full transition-all duration-500 ease-in-out"
                              style={{ width: `${Math.min(minibusPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Solo */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full">
                              <BusFront className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-sm font-medium">Solo</span>
                          </div>
                          <div className="text-sm font-medium">
                            {totalSoloUsed}/{parameters.solo.fleetCount} ({soloPercentage.toFixed(1)}%)
                          </div>
                          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-in-out"
                              style={{ width: `${Math.min(soloPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Körüklü */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-full">
                              <Bus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-sm font-medium">Körüklü</span>
                          </div>
                          <div className="text-sm font-medium">
                            {totalArticulatedUsed}/{parameters.articulated.fleetCount} (
                            {articulatedPercentage.toFixed(1)}%)
                          </div>
                          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full transition-all duration-500 ease-in-out"
                              style={{ width: `${Math.min(articulatedPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Toplam - ayrı satırda */}
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-full">
                            <Bus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <span className="text-sm font-medium">Toplam Atanan Araç Sayısı</span>
                        </div>
                        <div className="text-sm font-medium">
                          {totalMinibusUsed + totalSoloUsed + totalArticulatedUsed}/
                          {parameters.minibus.fleetCount +
                            parameters.solo.fleetCount +
                            parameters.articulated.fleetCount}{" "}
                          (
                          {(
                            ((totalMinibusUsed + totalSoloUsed + totalArticulatedUsed) /
                              (parameters.minibus.fleetCount +
                                parameters.solo.fleetCount +
                                parameters.articulated.fleetCount)) *
                            100
                          ).toFixed(1)}
                          %)
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                ((totalMinibusUsed + totalSoloUsed + totalArticulatedUsed) /
                                  (parameters.minibus.fleetCount +
                                    parameters.solo.fleetCount +
                                    parameters.articulated.fleetCount)) *
                                  100,
                                100,
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Maliyet Göstergeleri Başlığı */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-md bg-white dark:bg-gray-950 relative">
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(68,64,60,0.05)_10px,rgba(68,64,60,0.05)_20px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.03)_10px,rgba(255,255,255,0.03)_20px)] opacity-30 pointer-events-none"></div>
                  <div className="relative p-5 z-10">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-red-700 dark:text-red-400">
                      <Banknote className="h-5 w-5" />
                      Maliyet Göstergeleri
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {/* Kilometre başına maliyet */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-red-400/10 to-gray-400/20 p-[1px] shadow-md transition-transform hover:scale-102 cursor-help">
                            <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 h-full">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full">
                                  <MapPin className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-sm font-medium text-muted-foreground">Kilometre başına maliyet</h3>
                              </div>
                              <div className="text-xl font-bold">
                                ₺
                                {scheduleResults
                                  ? calculateCostPerKm(scheduleResults, routes, parameters).toLocaleString("tr-TR", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  : kpis.costPerKm.toLocaleString("tr-TR", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-2 text-xs">
                          <p>Her bir kilometrelik mesafe için ortalama maliyet</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Toplam yakıt maliyeti */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-red-400/10 to-gray-400/20 p-[1px] shadow-md transition-transform hover:scale-102 cursor-help">
                            <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 h-full">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full">
                                  <Banknote className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-sm font-medium text-muted-foreground">Toplam yakıt maliyeti</h3>
                              </div>
                              <div className="text-xl font-bold">
                                ₺
                                {scheduleResults
                                  ? calculateTotalFuelCost(scheduleResults, routes, parameters).toLocaleString(
                                      "tr-TR",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )
                                  : kpis.totalFuelCost.toLocaleString("tr-TR", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-2 text-xs">
                          <p>Tüm hatlardaki otobüslerin tükettiği toplam yakıt maliyeti</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Toplam bakım maliyeti */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-red-400/10 to-gray-400/20 p-[1px] shadow-md transition-transform hover:scale-102 cursor-help">
                            <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 h-full">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full">
                                  <Banknote className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-sm font-medium text-muted-foreground">Toplam bakım maliyeti</h3>
                              </div>
                              <div className="text-xl font-bold">
                                ₺
                                {scheduleResults
                                  ? calculateTotalMaintenanceCost(scheduleResults, routes, parameters).toLocaleString(
                                      "tr-TR",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )
                                  : kpis.totalMaintenanceCost.toLocaleString("tr-TR", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-2 text-xs">
                          <p>Tüm hatlardaki otobüslerin toplam bakım maliyeti</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Toplam personel maliyeti */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-red-400/10 to-gray-400/20 p-[1px] shadow-md transition-transform hover:scale-102 cursor-help">
                            <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 h-full">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full">
                                  <Banknote className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-sm font-medium text-muted-foreground">Toplam personel maliyeti</h3>
                              </div>
                              <div className="text-xl font-bold">
                                ₺
                                {scheduleResults
                                  ? calculateTotalDriverCost(scheduleResults, routes, parameters).toLocaleString(
                                      "tr-TR",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )
                                  : kpis.totalDriverCost.toLocaleString("tr-TR", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-2 text-xs">
                          <p>Tüm hatlardaki otobüs sürücülerinin toplam maliyeti</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Toplam amortisman maliyeti */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-red-400/10 to-gray-400/20 p-[1px] shadow-md transition-transform hover:scale-102 cursor-help">
                            <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 h-full">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full">
                                  <Banknote className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-sm font-medium text-muted-foreground">
                                  Toplam amortisman maliyeti
                                </h3>
                              </div>
                              <div className="text-xl font-bold">
                                ₺
                                {scheduleResults
                                  ? calculateTotalDepreciationCost(scheduleResults, routes, parameters).toLocaleString(
                                      "tr-TR",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )
                                  : kpis.totalDepreciationCost.toLocaleString("tr-TR", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-2 text-xs">
                          <p>Tüm hatlardaki otobüslerin toplam amortisman maliyeti</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Toplam maliyet */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-red-400/10 to-gray-400/20 p-[1px] shadow-md transition-transform hover:scale-102 cursor-help">
                            <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 h-full">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full">
                                  <Banknote className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-sm font-medium text-muted-foreground">Toplam maliyet</h3>
                              </div>
                              <div className="text-xl font-bold">
                                ₺
                                {scheduleResults
                                  ? calculateTotalCost(scheduleResults, routes, parameters).toLocaleString("tr-TR", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  : kpis.totalCost.toLocaleString("tr-TR", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-2 text-xs">
                          <p>Tüm hatlardaki otobüslerin toplam maliyeti</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="scheduleResults">
            {scheduleResults ? (
              <div className="space-y-6">
                {/* Otobüs Tipi Özeti Kartı */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-md bg-white dark:bg-gray-950 relative mb-4">
                  <div className="relative p-5 z-10">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-400">
                      <Bus className="h-5 w-5" />
                      Sefer Çizelgesi Özeti
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Toplam Sefer Sayısı */}
                      <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-blue-400/10 to-gray-400/20 p-[1px] shadow-md">
                        <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 h-full">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full">
                              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground">Toplam Sefer Sayısı</h3>
                          </div>
                          <div className="text-xl font-bold">
                            {scheduleResults.scheduleAB.length + scheduleResults.scheduleBA.length} sefer
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            A→B: {scheduleResults.scheduleAB.length} | B→A: {scheduleResults.scheduleBA.length}
                          </div>
                        </div>
                      </div>

                      {/* Kullanılan Midibüs Sayısı */}
                      <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-teal-400/10 to-gray-400/20 p-[1px] shadow-md">
                        <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 h-full">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-teal-100 dark:bg-teal-900/30 p-1.5 rounded-full">
                              <Bus className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground">Midibüs Sayısı</h3>
                          </div>
                          <div className="text-xl font-bold">
                            {
                              Object.values(scheduleResults.busUtilization).filter((bus) => bus.busType === "minibus")
                                .length
                            }{" "}
                            adet
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Toplam Sefer:{" "}
                            {Object.values(scheduleResults.busUtilization)
                              .filter((bus) => bus.busType === "minibus")
                              .reduce((sum, bus) => sum + bus.trips, 0)}
                          </div>
                        </div>
                      </div>

                      {/* Kullanılan Solo Otobüs Sayısı */}
                      <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-blue-400/10 to-gray-400/20 p-[1px] shadow-md">
                        <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 h-full">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full">
                              <BusFront className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground">Solo Otobüs Sayısı</h3>
                          </div>
                          <div className="text-xl font-bold">
                            {
                              Object.values(scheduleResults.busUtilization).filter((bus) => bus.busType === "solo")
                                .length
                            }{" "}
                            adet
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Toplam Sefer:{" "}
                            {Object.values(scheduleResults.busUtilization)
                              .filter((bus) => bus.busType === "solo")
                              .reduce((sum, bus) => sum + bus.trips, 0)}
                          </div>
                        </div>
                      </div>

                      {/* Kullanılan Körüklü Otobüs Sayısı */}
                      <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-purple-400/10 to-gray-400/20 p-[1px] shadow-md">
                        <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 h-full">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-full">
                              <Bus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground">Körüklü Otobüs Sayısı</h3>
                          </div>
                          <div className="text-xl font-bold">
                            {
                              Object.values(scheduleResults.busUtilization).filter(
                                (bus) => bus.busType === "articulated",
                              ).length
                            }{" "}
                            adet
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Toplam Sefer:{" "}
                            {Object.values(scheduleResults.busUtilization)
                              .filter((bus) => bus.busType === "articulated")
                              .reduce((sum, bus) => sum + bus.trips, 0)}
                          </div>
                        </div>
                      </div>
                      {/* Interlining Bilgisi */}
                      <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-indigo-400/10 to-gray-400/20 p-[1px] shadow-md">
                        <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 h-full">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-1.5 rounded-full">
                              <RouteIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground">Maksimum Interlining</h3>
                          </div>
                          <div className="text-xl font-bold">{parameters.maxInterlining || 1} hat/otobüs</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Her otobüs en fazla {parameters.maxInterlining || 1} farklı hatta çalışabilir
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BUS SCHEDULE TIMELINE */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-md bg-white dark:bg-gray-950 relative mb-4">
                  <div className="relative p-5 z-10">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-400">
                      <Clock className="h-5 w-5" />
                      Otobüs Zaman Çizelgesi
                    </h3>
                    <BusScheduleTimeline
                      scheduleResults={scheduleResults}
                      routes={routes || []} // Ensure routes is never undefined
                    />
                  </div>
                </div>

                {/* Hat Seferleri Zaman Çizelgesi */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-md bg-white dark:bg-gray-950 relative mb-4">
                  <div className="relative p-5 z-10">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-400">
                      <RouteIcon className="h-5 w-5" />
                      Hat Seferleri Zaman Çizelgesi
                    </h3>
                    <RouteScheduleTimeline
                      scheduleResults={scheduleResults}
                      routes={routes || []} // Ensure routes is never undefined
                    />
                  </div>
                </div>

                {scheduleResults.routeSchedules && Object.keys(scheduleResults.routeSchedules).length > 0 && (
                  <div className="mb-4">
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="mb-4 flex flex-wrap">
                        <TabsTrigger value="all" className="mr-2 mb-2">
                          Tüm Hatlar
                        </TabsTrigger>
                        {Object.keys(scheduleResults.routeSchedules).map((routeNo) => (
                          <TabsTrigger value={routeNo} className="mr-2 mb-2" key={routeNo}>
                            Hat {routeNo}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {/* Tüm Hatlar Görünümü */}
                      <TabsContent value="all">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-base font-medium mb-3 flex items-center text-blue-600 dark:text-blue-400 p-2 rounded-md bg-blue-50 dark:bg-blue-900/20">
                              <ArrowRight className="mr-2 h-4 w-4 text-blue-500" />A → B Saat Planı
                            </h3>

                            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-[500px] overflow-y-auto">
                              <Table>
                                <TableHeader className="bg-gray-50/90 dark:bg-gray-900/90 sticky top-0 z-10">
                                  <TableRow>
                                    <TableHead className="font-medium">Sefer</TableHead>
                                    <TableHead className="font-medium">Saat</TableHead>
                                    <TableHead className="font-medium">Hat</TableHead>
                                    <TableHead className="font-medium">Otobüs</TableHead>
                                    <TableHead className="font-medium">Tip</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {scheduleResults.scheduleAB.map((trip, index) => (
                                    <TableRow
                                      key={index}
                                      className={`${index % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-900/50" : ""} table-row-hover`}
                                    >
                                      <TableCell className="py-2 font-medium">{index + 1}</TableCell>
                                      <TableCell className="py-2 flex items-center">
                                        <Clock className="mr-2 h-4 w-4 text-blue-500" />
                                        {trip.time}
                                      </TableCell>
                                      <TableCell className="py-2">
                                        {trip.routeNo ? `Hat ${trip.routeNo}` : "-"}
                                      </TableCell>
                                      <TableCell className="py-2">{trip.busId}</TableCell>
                                      <TableCell className="py-2">
                                        {trip.busType === "minibus"
                                          ? "Midibüs"
                                          : trip.busType === "solo"
                                            ? "Solo"
                                            : "Körüklü"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-base font-medium mb-3 flex items-center text-blue-600 dark:text-blue-400 p-2 rounded-md bg-blue-50 dark:bg-blue-900/20">
                              <ArrowRight className="mr-2 h-4 w-4 rotate-180 text-blue-500" />B → A Saat Planı
                            </h3>
                            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-[500px] overflow-y-auto">
                              <Table>
                                <TableHeader className="bg-gray-50/90 dark:bg-gray-900/90 sticky top-0 z-10">
                                  <TableRow>
                                    <TableHead className="font-medium">Sefer</TableHead>
                                    <TableHead className="font-medium">Saat</TableHead>
                                    <TableHead className="font-medium">Hat</TableHead>
                                    <TableHead className="font-medium">Otobüs</TableHead>
                                    <TableHead className="font-medium">Tip</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {scheduleResults.scheduleBA.map((trip, index) => (
                                    <TableRow
                                      key={index}
                                      className={`${index % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-900/50" : ""} table-row-hover`}
                                    >
                                      <TableCell className="py-2 font-medium">{index + 1}</TableCell>
                                      <TableCell className="py-2 flex items-center">
                                        <Clock className="mr-2 h-4 w-4 text-blue-500" />
                                        {trip.time}
                                      </TableCell>
                                      <TableCell className="py-2">
                                        {trip.routeNo ? `Hat ${trip.routeNo}` : "-"}
                                      </TableCell>
                                      <TableCell className="py-2">{trip.busId}</TableCell>
                                      <TableCell className="py-2">
                                        {trip.busType === "minibus"
                                          ? "Midibüs"
                                          : trip.busType === "solo"
                                            ? "Solo"
                                            : "Körüklü"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Her Hat İçin Ayrı Görünüm */}
                      {Object.keys(scheduleResults.routeSchedules).map((routeNo) => (
                        <TabsContent value={routeNo} key={routeNo}>
                          <p>Hat {routeNo} için içerik</p>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <h3 className="text-xl font-medium mb-3">Sefer Çizelgesi Sonucu Yok</h3>
                <p className="text-muted-foreground text-center">
                  Sefer çizelgesi sonuçlarını görmek için lütfen önce Sefer Çizelgesi optimizasyonunu çalıştırın.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {scheduleResults && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Hat Bazlı Sonuçlar</h3>
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 rounded-md overflow-hidden">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Hat No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      A→B Uzunluk (km)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      B→A Uzunluk (km)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Midibüs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Solo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Körüklü
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      A→B Sefer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      B→A Sefer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Yakıt Maliyeti (TL)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Bakım Maliyeti (TL)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Amortisman (TL)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Sürücü Maliyeti (TL)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Toplam Maliyet (TL)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {Object.entries(scheduleResults.routeSchedules || {}).map(([routeNo, routeData]) => {
                    const route = routes.find((r) => r.routeNo === routeNo)
                    if (!route) return null

                    // Count vehicle types used for this route
                    const vehicleCounts = {
                      minibus: 0,
                      solo: 0,
                      articulated: 0,
                    }

                    // Get unique bus IDs for this route
                    const busIds = new Set()
                    ;[...routeData.scheduleAB, ...routeData.scheduleBA].forEach((trip) => {
                      busIds.add(trip.busId)
                    })

                    // Count vehicle types
                    Array.from(busIds).forEach((busId) => {
                      const busInfo = scheduleResults.busUtilization[busId as string]
                      if (busInfo) {
                        vehicleCounts[busInfo.busType]++
                      }
                    })

                    // Calculate trip counts
                    const abTripCount = routeData.scheduleAB.length
                    const baTripCount = routeData.scheduleBA.length

                    // Calculate costs
                    const routeResult = results.find((r) => r.routeNo === routeNo)

                    // Calculate fuel cost based on vehicle types, route lengths and trip counts
                    let fuelCost = 0
                    routeData.scheduleAB.forEach((trip) => {
                      if (trip.busType === "minibus") {
                        fuelCost += parameters.minibus.fuelCost * route.routeLengthAtoB
                      } else if (trip.busType === "solo") {
                        fuelCost += parameters.solo.fuelCost * route.routeLengthAtoB
                      } else if (trip.busType === "articulated") {
                        fuelCost += parameters.articulated.fuelCost * route.routeLengthAtoB
                      }
                    })

                    routeData.scheduleBA.forEach((trip) => {
                      if (trip.busType === "minibus") {
                        fuelCost += parameters.minibus.fuelCost * route.routeLengthBtoA
                      } else if (trip.busType === "solo") {
                        fuelCost += parameters.solo.fuelCost * route.routeLengthBtoA
                      } else if (trip.busType === "articulated") {
                        fuelCost += parameters.articulated.fuelCost * route.routeLengthBtoA
                      }
                    })

                    // Calculate maintenance cost
                    let maintenanceCost = 0
                    routeData.scheduleAB.forEach((trip) => {
                      if (trip.busType === "minibus") {
                        maintenanceCost += parameters.minibus.maintenanceCost * route.routeLengthAtoB
                      } else if (trip.busType === "solo") {
                        maintenanceCost += parameters.solo.maintenanceCost * route.routeLengthAtoB
                      } else if (trip.busType === "articulated") {
                        maintenanceCost += parameters.articulated.maintenanceCost * route.routeLengthAtoB
                      }
                    })

                    routeData.scheduleBA.forEach((trip) => {
                      if (trip.busType === "minibus") {
                        maintenanceCost += parameters.minibus.maintenanceCost * route.routeLengthBtoA
                      } else if (trip.busType === "solo") {
                        maintenanceCost += parameters.solo.maintenanceCost * route.routeLengthBtoA
                      } else if (trip.busType === "articulated") {
                        maintenanceCost += parameters.articulated.maintenanceCost * route.routeLengthBtoA
                      }
                    })

                    // Calculate depreciation cost
                    let depreciationCost = 0
                    routeData.scheduleAB.forEach((trip) => {
                      if (trip.busType === "minibus") {
                        depreciationCost += parameters.minibus.depreciationCost * route.routeLengthAtoB
                      } else if (trip.busType === "solo") {
                        depreciationCost += parameters.solo.depreciationCost * route.routeLengthAtoB
                      } else if (trip.busType === "articulated") {
                        depreciationCost += parameters.articulated.depreciationCost * route.routeLengthAtoB
                      }
                    })

                    routeData.scheduleBA.forEach((trip) => {
                      if (trip.busType === "minibus") {
                        depreciationCost += parameters.minibus.depreciationCost * route.routeLengthBtoA
                      } else if (trip.busType === "solo") {
                        depreciationCost += parameters.solo.depreciationCost * route.routeLengthBtoA
                      } else if (trip.busType === "articulated") {
                        depreciationCost += parameters.articulated.depreciationCost * route.routeLengthBtoA
                      }
                    })

                    // Calculate driver cost
                    const driverCost =
                      parameters.driverCost *
                      (abTripCount * route.routeLengthAtoB + baTripCount * route.routeLengthBtoA)

                    // Calculate total cost
                    const totalCost = fuelCost + maintenanceCost + depreciationCost + driverCost

                    return (
                      <tr key={routeNo} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {routeNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {route.routeLengthAtoB.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {route.routeLengthBtoA.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {vehicleCounts.minibus}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {vehicleCounts.solo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {vehicleCounts.articulated}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {abTripCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {baTripCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          ₺{fuelCost.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          ₺
                          {maintenanceCost.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          ₺
                          {depreciationCost.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          ₺{driverCost.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          ₺{totalCost.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
