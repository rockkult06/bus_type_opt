"use client"

import { BusOptimizationProvider } from "@/context/bus-optimization-context"
import ResultsTab from "@/components/results-tab"

export default function ResultsPage() {
  return (
    <div className="container mx-auto px-4">
      <BusOptimizationProvider>
        <ResultsTab />
      </BusOptimizationProvider>
    </div>
  )
}
