"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type {
  RouteData,
  BusParameters,
  StrategicResult,
  ScheduleResult,
  ScheduleParameters,
  KPIData,
} from "@/types"

// RouteData tipini güncelle - her iki yön için ayrı uzunluk ve parkur süresi ekle
export type RouteData = {
  routeNo: string
  routeName: string
  routeLengthAtoB: number // A'dan B'ye hat uzunluğu
  routeLengthBtoA: number // B'den A'ya hat uzunluğu
  travelTimeAtoB: number // A'dan B'ye parkur süresi (dakika)
  travelTimeBtoA: number // B'den A'ya parkur süresi (dakika)
  hourlyDemand: HourlyDemand[] // 24 saatlik yolcu verisi
}

export type HourlyDemand = {
  hour: number // e.g., 4 for 04:00-05:00
  passengersAtoB: number
  passengersBtoA: number
}

// BusParameters tipine maxInterlining ekleyelim
export type BusParameters = {
  minibus: {
    capacity: number
    fuelCost: number
    fleetCount: number // Number of available minibuses in the fleet
    maintenanceCost: number // Maintenance cost per kilometer
    depreciationCost: number // Depreciation cost per kilometer
    carbonEmission: number // Carbon emission per kilometer (kg/km)
  }
  solo: {
    capacity: number
    fuelCost: number
    fleetCount: number // Number of available solo buses in the fleet
    maintenanceCost: number // Maintenance cost per kilometer
    depreciationCost: number // Depreciation cost per kilometer
    carbonEmission: number // Carbon emission per kilometer (kg/km)
  }
  articulated: {
    capacity: number
    fuelCost: number
    fleetCount: number // Number of available articulated buses in the fleet
    maintenanceCost: number // Maintenance cost per kilometer
    depreciationCost: number // Depreciation cost per kilometer
    carbonEmission: number // Carbon emission per kilometer (kg/km)
  }
  driver: {
    costPerHour: number
  }
  operationStartTime: number // 04:00 in minutes
  maxInterlining: number // Maximum number of routes a bus can serve
}

// Schedule optimization types
// ScheduleParameters tipini güncelle - artık 24 saatlik operasyon için
export type ScheduleParameters = {
  operationStartTime: number // e.g., 240 for 04:00
  operationEndTime: string // e.g., "04:00" (next day)
}

// ScheduleResult tipini tamamen yeniden yapılandırıyoruz
export type ScheduleResult = {
  schedule: ScheduleEntry[] // Tüm 24 saatlik sefer planı
  totalBusesUsed: {
    minibus: number
    solo: number
    articulated: number
  }
  busUtilization: Record<string, { trips: number; busType: string; totalTimeOnDuty: number }> // busId -> utilization
  kpis: KPIData // 24 saatlik operasyonun KPI'ları
  optimalInterlining?: number
}

// OptimizationResult tipini güncelle - artık zirve saat yolcu sayısı yok
export type OptimizationResult = {
  routeNo: string
  routeName: string
  minibus: number // Required number of minibuses for this route's peak
  solo: number // Required number of solo buses
  articulated: number // Required number of articulated buses
  totalCost: number // Estimated cost for this fleet on this route (can be simplified)
  peakHourDemand: { // The peak demand found for this route
    hour: number
    passengersAtoB: number
    passengersBtoA: number
  }
}

// ScheduleEntry tipini daha detaylı hale getiriyoruz
export type ScheduleEntry = {
  tripId: string // Unique ID for the trip
  routeNo: string
  busId: string
  busType: "minibus" | "solo" | "articulated"
  direction: "AtoB" | "BtoA"
  departureTime: number // Minutes from start of operation (04:00)
  arrivalTime: number // Minutes from start of operation
}

// Update the KPIData type to include carbon emission metrics
export type KPIData = {
  totalPassengers: number
  totalDistance: number
  optimizationTime: number
  totalFuelCost: number
  totalMaintenanceCost: number
  totalDepreciationCost: number
  totalDriverCost: number
  totalCost: number
  costPerKm: number
  costPerPassenger: number
  totalCarbonEmission: number // Total carbon emission
  carbonPerPassenger: number // Carbon emission per passenger
  carbonSaved: number // Carbon emission saved by using public transport
}

type BusOptimizationContextType = {
  routeData: RouteData[]
  setRouteData: (routes: RouteData[]) => void
  parameters: BusParameters
  setParameters: (parameters: BusParameters) => void
  strategicResults: StrategicResult | null
  setStrategicResults: (results: StrategicResult | null) => void
  scheduleParameters: ScheduleParameters
  setScheduleParameters: (scheduleParameters: ScheduleParameters) => void
  scheduleResults: ScheduleResult | null
  setScheduleResults: (scheduleResults: ScheduleResult | null) => void
  kpis: KPIData | null
  setKpis: (kpis: KPIData | null) => void
  isOptimizing: boolean
  setIsOptimizing: (isOptimizing: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  resetOptimization: () => void
}

const defaultParameters: BusParameters = {
  minibus: {
    capacity: 60,
    fuelCost: 16,
    fleetCount: 600,
    maintenanceCost: 2,
    depreciationCost: 3,
    carbonEmission: 0.7,
  },
  solo: {
    capacity: 100,
    fuelCost: 20,
    fleetCount: 1400,
    maintenanceCost: 3,
    depreciationCost: 4,
    carbonEmission: 1.1,
  },
  articulated: {
    capacity: 120,
    fuelCost: 28,
    fleetCount: 400,
    maintenanceCost: 4,
    depreciationCost: 6,
    carbonEmission: 1.4,
  },
  driver: {
    costPerHour: 150,
  },
  operationStartTime: 240, // 04:00 in minutes
  maxInterlining: 1,
}

const BusOptimizationContext = createContext<BusOptimizationContextType | undefined>(undefined)

export function BusOptimizationProvider({ children }: { children: ReactNode }) {
  const [routeData, setRouteData] = useState<RouteData[]>([])
  const [parameters, setParameters] = useState<BusParameters>(defaultParameters)
  const [strategicResults, setStrategicResults] = useState<StrategicResult | null>(null)
  const [scheduleParameters, setScheduleParameters] = useState<ScheduleParameters>({
    operationStartTime: 240,
  })
  const [scheduleResults, setScheduleResults] = useState<ScheduleResult | null>(null)
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("parameters")

  const resetOptimization = () => {
    setRouteData([])
    setStrategicResults(null)
    setScheduleResults(null)
    setKpis(null)
    setActiveTab("parameters")
    setIsOptimizing(false)
  }

  return (
    <BusOptimizationContext.Provider
      value={{
        routeData,
        setRouteData,
        parameters,
        setParameters,
        strategicResults,
        setStrategicResults,
        scheduleParameters,
        setScheduleParameters,
        scheduleResults,
        setScheduleResults,
        kpis,
        setKpis,
        isOptimizing,
        setIsOptimizing,
        activeTab,
        setActiveTab,
        resetOptimization,
      }}
    >
      {children}
    </BusOptimizationContext.Provider>
  )
}

export function useBusOptimization() {
  const context = useContext(BusOptimizationContext)
  if (context === undefined) {
    throw new Error("useBusOptimization must be used within a BusOptimizationProvider")
  }
  return context
}
