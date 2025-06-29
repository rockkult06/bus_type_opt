"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

// RouteData tipini güncelle - her iki yön için ayrı uzunluk ve parkur süresi ekle
export type RouteData = {
  routeNo: string
  routeName: string
  routeLengthAtoB: number // A'dan B'ye hat uzunluğu
  routeLengthBtoA: number // B'den A'ya hat uzunluğu
  travelTimeAtoB: number // A'dan B'ye parkur süresi (dakika)
  travelTimeBtoA: number // B'den A'ya parkur süresi (dakika)
  peakPassengersAtoB: number // A'dan B'ye yolcu sayısı
  peakPassengersBtoA: number // B'den A'ya yolcu sayısı
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
  driverCost: number
  maxInterlining: number // Maximum number of routes a bus can serve
}

// Schedule optimization types
// ScheduleParameters tipini güncelle - artık parkur sürelerini içermeyecek
export type ScheduleParameters = {
  timeRange: {
    start: string
    end: string
  }
}

// ScheduleResult tipini güncelle - hat bazlı çizelgeleri ekle
export type ScheduleResult = {
  frequencyAB: number
  frequencyBA: number
  tripsAB: number
  tripsBA: number
  totalBuses: number
  scheduleAB: Array<{ time: string; busId: string; busType?: string; routeNo?: string }>
  scheduleBA: Array<{ time: string; busId: string; busType?: string; routeNo?: string }>
  busUtilization: Record<string, { trips: number; busType?: string }>
  routeSchedules?: Record<
    string,
    {
      scheduleAB: Array<{ time: string; busId: string; busType?: string }>
      scheduleBA: Array<{ time: string; busId: string; busType?: string }>
      routeInfo?: {
        routeLengthAtoB: number
        routeLengthBtoA: number
        travelTimeAtoB: number
        travelTimeBtoA: number
        peakPassengersAtoB: number
        peakPassengersBtoA: number
      }
    }
  >
  optimalInterlining?: number // Optimal interlining değerini ekledik
}

// OptimizationResult tipini güncelle
export type OptimizationResult = {
  routeNo: string
  routeName: string
  routeLength: number
  minibus: number
  solo: number
  articulated: number
  fuelCost: number
  maintenanceCost: number
  depreciationCost: number
  driverCost: number
  totalCost: number
  carbonEmission: number // Carbon emission for this route
  capacityUtilization: number
  peakPassengersAtoB: number // A'dan B'ye yolcu sayısı
  peakPassengersBtoA: number // B'den A'ya yolcu sayısı
}

// Schedule optimization types
export type ScheduleEntry = {
  routeNo: string
  departureTime: string
  arrivalTime: string
  busType: "minibus" | "solo" | "articulated"
  busNumber: string
  direction: "AtoB" | "BtoA"
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
  routes: RouteData[]
  setRoutes: (routes: RouteData[]) => void
  parameters: BusParameters
  setParameters: (parameters: BusParameters) => void
  results: OptimizationResult[]
  setResults: (results: OptimizationResult[]) => void
  scheduleParameters: ScheduleParameters
  setScheduleParameters: (scheduleParameters: ScheduleParameters) => void
  scheduleResults: ScheduleResult | null
  setScheduleResults: (scheduleResults: ScheduleResult) => void
  kpis: KPIData | null
  setKpis: (kpis: KPIData) => void
  isOptimizing: boolean
  setIsOptimizing: (isOptimizing: boolean) => void
  activeStep: string
  setActiveStep: (step: string) => void
}

// Varsayılan parametrelere maxInterlining ekleyelim
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
  driverCost: 38,
  maxInterlining: 0, // Varsayılan olarak her otobüs sadece bir hatta çalışabilir (interlining yok)
}

const defaultScheduleParameters: ScheduleParameters = {
  timeRange: {
    start: "07:00",
    end: "08:00",
  },
}

const BusOptimizationContext = createContext<BusOptimizationContextType | undefined>(undefined)

export function BusOptimizationProvider({ children }: { children: ReactNode }) {
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [parameters, setParameters] = useState<BusParameters>(defaultParameters)
  const [results, setResults] = useState<OptimizationResult[]>([])
  const [scheduleParameters, setScheduleParameters] = useState<ScheduleParameters>(defaultScheduleParameters)
  const [scheduleResults, setScheduleResults] = useState<ScheduleResult | null>(null)
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [activeStep, setActiveStep] = useState<string>("parameters")

  return (
    <BusOptimizationContext.Provider
      value={{
        routes,
        setRoutes,
        parameters,
        setParameters,
        results,
        setResults,
        scheduleParameters,
        setScheduleParameters,
        scheduleResults,
        setScheduleResults,
        kpis,
        setKpis,
        isOptimizing,
        setIsOptimizing,
        activeStep,
        setActiveStep,
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
