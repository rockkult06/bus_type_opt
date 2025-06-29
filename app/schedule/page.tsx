"use client"

import { BusOptimizationProvider } from "@/context/bus-optimization-context"
import ScheduleOptimizationTab from "@/components/schedule-optimization-tab"

export default function SchedulePage() {
  return (
    <div className="container mx-auto px-4">
      <BusOptimizationProvider>
        <ScheduleOptimizationTab />
      </BusOptimizationProvider>
    </div>
  )
}
