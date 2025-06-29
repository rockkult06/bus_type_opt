// RouteData tipini güncelle
export type RouteData = {
  routeNo: string
  routeName: string
  routeLengthAtoB: number
  routeLengthBtoA: number
  travelTimeAtoB: number
  travelTimeBtoA: number
  hourlyDemand: { hour: number; demandAtoB: number; demandBtoA: number }[]
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
  driver: {
    costPerHour: number
  }
  operationStartTime: number // Operation start time in minutes from midnight
  maxInterlining: number // Maximum number of routes a bus can serve
}

export type Trip = {
  tripId: string
  busId: string
  busType: "minibus" | "solo" | "articulated"
  routeNo: string
  direction: "AtoB" | "BtoA"
  startTime: number // in minutes from operation start
  endTime: number // in minutes from operation start
}

// ScheduleResult tipini güncelle
export type ScheduleResult = {
  schedule: Trip[]
  stats: {
    totalTrips: number
    totalDistance: number
    totalDuration: number
    busUtilization: Record<string, { trips: number; busType: string; routes: number[] }>
  }
}

export type StrategicResult = {
  recommendedFleet: {
    minibus: number
    solo: number
    articulated: number
  }
  totalCost: number
  peakDemand: {
    hour: number
    demand: number
  }
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
