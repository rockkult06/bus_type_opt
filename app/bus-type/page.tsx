"use client"

import { BusOptimizationProvider } from "@/context/bus-optimization-context"
import BusOptimizationTab from "@/components/bus-optimization-tab"

export default function BusTypePage() {
  return (
    <div className="container mx-auto px-4">
      <BusOptimizationProvider>
        <BusOptimizationTab />
      </BusOptimizationProvider>
    </div>
  )
}
