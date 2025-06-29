"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { RouteData, BusParameters, CombinedOptimizationResult } from "@/types"

/**
 * BusOptimizationContext için tip tanımı.
 * Uygulama genelinde paylaşılacak tüm state ve fonksiyonları içerir.
 */
type BusOptimizationContextType = {
  routeData: RouteData[]
  setRouteData: (routes: RouteData[]) => void
  parameters: BusParameters
  setParameters: (parameters: BusParameters) => void
  combinedResults: CombinedOptimizationResult | null
  setCombinedResults: (results: CombinedOptimizationResult | null) => void
  isOptimizing: boolean
  setIsOptimizing: (isOptimizing: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  resetOptimization: () => void
}

/**
 * Uygulama için varsayılan parametreler.
 * Kullanıcı arayüzü ilk yüklendiğinde bu değerler kullanılır.
 */
const defaultParameters: BusParameters = {
  minibus: {
    capacity: 60,
    fleetCount: 600,
    fuelCost: 16,
    maintenanceCost: 2,
    depreciationCost: 3,
    carbonEmission: 0.7,
  },
  solo: {
    capacity: 100,
    fleetCount: 1400,
    fuelCost: 20,
    maintenanceCost: 3,
    depreciationCost: 4,
    carbonEmission: 1.1,
  },
  articulated: {
    capacity: 120,
    fleetCount: 400,
    fuelCost: 28,
    maintenanceCost: 4,
    depreciationCost: 6,
    carbonEmission: 1.4,
  },
  driver: {
    costPerHour: 150,
  },
  operationStartTime: 240, // 04:00
  maxInterlining: 10, // 10 dakika
}

// React Context'i oluşturma
const BusOptimizationContext = createContext<BusOptimizationContextType | undefined>(undefined)

/**
 * BusOptimizationProvider bileşeni, tüm uygulamayı sararak
 * context verilerinin ve fonksiyonlarının alt bileşenler tarafından kullanılmasını sağlar.
 */
export function BusOptimizationProvider({ children }: { children: ReactNode }) {
  const [routeData, setRouteData] = useState<RouteData[]>([])
  const [parameters, setParameters] = useState<BusParameters>(defaultParameters)
  const [combinedResults, setCombinedResults] = useState<CombinedOptimizationResult | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("parameters")

  /** Optimizasyon durumunu sıfırlar ve kullanıcıyı başlangıç sekmesine yönlendirir. */
  const resetOptimization = () => {
    setRouteData([])
    setCombinedResults(null)
    setActiveTab("parameters")
    setIsOptimizing(false)
  }

  const value = {
    routeData,
    setRouteData,
    parameters,
    setParameters,
    combinedResults,
    setCombinedResults,
    isOptimizing,
    setIsOptimizing,
    activeTab,
    setActiveTab,
    resetOptimization,
  }

  return <BusOptimizationContext.Provider value={value}>{children}</BusOptimizationContext.Provider>
}

/**
 * `useBusOptimization` hook'u, bileşenlerin context verilerine
 * kolayca erişmesini sağlayan bir yardımcıdır.
 */
export function useBusOptimization() {
  const context = useContext(BusOptimizationContext)
  if (context === undefined) {
    throw new Error("useBusOptimization must be used within a BusOptimizationProvider")
  }
  return context
}
