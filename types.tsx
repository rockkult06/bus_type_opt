// RouteData tipini güncelle
export type RouteData = {
  routeNo: string
  routeName: string
  routeLengthAtoB: number
  routeLengthBtoA: number
  travelTimeAtoB: number
  travelTimeBtoA: number
  peakPassengersAtoB: number
  peakPassengersBtoA: number
}

// BusParameters tipini güncelleyelim
export type BusParameters = {
  minibus: {
    capacity: number
    fuelCost: number
    fleetCount: number
    maintenanceCost: number
    depreciationCost: number
    carbonEmission: number
  }
  solo: {
    capacity: number
    fuelCost: number
    fleetCount: number
    maintenanceCost: number
    depreciationCost: number
    carbonEmission: number
  }
  articulated: {
    capacity: number
    fuelCost: number
    fleetCount: number
    maintenanceCost: number
    depreciationCost: number
    carbonEmission: number
  }
  driverCost: number
  maxInterlining: number // Maximum number of routes a bus can serve
}

// ScheduleResult tipini güncelle
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
    }
  >
}

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
  totalCarbonEmission: number
  carbonPerPassenger: number
  carbonSaved: number
}

// OptimizationResult tipini güncelle
export type OptimizationResult = {
  routeNo: string
  routeName: string
  routeLengthAtoB: number
  routeLengthBtoA: number
  minibus: number
  solo: number
  articulated: number
  fuelCost: number
  maintenanceCost: number
  depreciationCost: number
  driverCost: number
  totalCost: number
  carbonEmission: number
  capacityUtilization: number
  peakPassengersAtoB: number
  peakPassengersBtoA: number
}

// ScheduleParameters tipini güncelle
export type ScheduleParameters = {
  timeRange: {
    start: string
    end: string
  }
}
