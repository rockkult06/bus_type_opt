"use client"

import { BusOptimizationProvider } from "@/context/bus-optimization-context"
import HelpTab from "@/components/help-tab"

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4">
      <BusOptimizationProvider>
        <HelpTab />
      </BusOptimizationProvider>
    </div>
  )
}
