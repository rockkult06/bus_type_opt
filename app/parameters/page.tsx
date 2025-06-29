"use client"

import { BusOptimizationProvider } from "@/context/bus-optimization-context"
import ParametersTab from "@/components/parameters-tab"

export default function ParametersPage() {
  return (
    <div className="container mx-auto px-4">
      <BusOptimizationProvider>
        <ParametersTab />
      </BusOptimizationProvider>
    </div>
  )
}
