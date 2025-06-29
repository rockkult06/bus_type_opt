import type { RouteData, BusParameters, OptimizationResult, KPIData, HourlyDemand } from "@/context/bus-optimization-context"

// Main optimization function
export function runOptimization(
  routes: RouteData[],
  parameters: BusParameters,
): { results: OptimizationResult[]; kpis: KPIData; isFeasible: boolean } {
  const results: OptimizationResult[] = []
  let isFeasible = true

  // Track total fleet needs across all routes
  let totalMinibusNeeded = 0
  let totalSoloNeeded = 0
  let totalArticulatedNeeded = 0

  // Optimize each route to find the required fleet for its own peak
  for (const route of routes) {
    const result = optimizeRouteForPeakDemand(route, parameters)
    results.push(result)
    totalMinibusNeeded += result.minibus
    totalSoloNeeded += result.solo
    totalArticulatedNeeded += result.articulated
  }

  // Check if the company's total fleet is sufficient
  if (
    totalMinibusNeeded > parameters.minibus.fleetCount ||
    totalSoloNeeded > parameters.solo.fleetCount ||
    totalArticulatedNeeded > parameters.articulated.fleetCount
  ) {
    isFeasible = false
  }

  // Note: KPIs at this stage are just estimations based on peak demand.
  // The real, detailed KPIs will be calculated after the 24h schedule simulation.
  const estimatedKpis = calculateEstimatedKPIs(results, routes, parameters)

  return { results, kpis: estimatedKpis, isFeasible }
}

// New function to find the peak demand within a 24-hour period for a single route
function findPeakDemand(hourlyDemand: HourlyDemand[]): {
  peakPassengersAtoB: number
  peakPassengersBtoA: number
  peakHourData: HourlyDemand
} {
  let peakPassengersAtoB = 0
  let peakPassengersBtoA = 0
  let peakCombined = 0
  let peakHourData: HourlyDemand = { hour: -1, passengersAtoB: 0, passengersBtoA: 0 }

  for (const demand of hourlyDemand) {
    if (demand.passengersAtoB > peakPassengersAtoB) {
      peakPassengersAtoB = demand.passengersAtoB
    }
    if (demand.passengersBtoA > peakPassengersBtoA) {
      peakPassengersBtoA = demand.passengersBtoA
    }
    // We might also care about the combined peak for bus assignment
    if (demand.passengersAtoB + demand.passengersBtoA > peakCombined) {
      peakCombined = demand.passengersAtoB + demand.passengersBtoA
      peakHourData = demand
    }
  }

  // The optimization needs to satisfy the highest demand in either direction at any time.
  // We use the highest unidirectional peak for capacity calculation.
  return {
    peakPassengersAtoB: Math.max(...hourlyDemand.map((d) => d.passengersAtoB)),
    peakPassengersBtoA: Math.max(...hourlyDemand.map((d) => d.passengersBtoA)),
    peakHourData,
  }
}

function optimizeRouteForPeakDemand(route: RouteData, parameters: BusParameters): OptimizationResult {
  const { routeNo, routeName, routeLengthAtoB, routeLengthBtoA, hourlyDemand } = route

  // Step 1: Find the absolute peak demand for this route from the hourly data
  const { peakPassengersAtoB, peakPassengersBtoA, peakHourData } = findPeakDemand(hourlyDemand)

  // The rest of the logic is similar to the old `optimizeRoute`, but uses the found peak demand.
  // The goal is to find the minimal fleet composition for THIS route that can handle its busiest hour.

  // Minimum number of buses of each type to meet the highest demand in either direction
  const minMinibuses = Math.ceil(Math.max(peakPassengersAtoB, peakPassengersBtoA) / parameters.minibus.capacity)
  const minSoloBuses = Math.ceil(Math.max(peakPassengersAtoB, peakPassengersBtoA) / parameters.solo.capacity)
  const minArticulatedBuses = Math.ceil(
    Math.max(peakPassengersAtoB, peakPassengersBtoA) / parameters.articulated.capacity,
  )

  // Initialize variables to track the best solution
  let bestCost = Number.POSITIVE_INFINITY
  let bestMinibus = 0
  let bestSolo = 0
  let bestArticulated = 0

  // Brute-force try different combinations of bus types
  // We iterate up to the minimum required number for each type, as using more of one type
  // just to reduce another is the core of the optimization.
  for (let m = 0; m <= minMinibuses; m++) {
    for (let s = 0; s <= minSoloBuses; s++) {
      for (let a = 0; a <= minArticulatedBuses; a++) {
        const totalCapacity =
          m * parameters.minibus.capacity + s * parameters.solo.capacity + a * parameters.articulated.capacity

        // Ensure capacity is met for both directions during the peak hour
        if (totalCapacity < peakPassengersAtoB || totalCapacity < peakPassengersBtoA) continue

        // Cost calculation is an estimation for a single "peak hour" trip for comparison.
        const tripCost =
          (m * (parameters.minibus.fuelCost + parameters.minibus.maintenanceCost) +
            s * (parameters.solo.fuelCost + parameters.solo.maintenanceCost) +
            a * (parameters.articulated.fuelCost + parameters.articulated.maintenanceCost)) *
            (routeLengthAtoB + routeLengthBtoA) +
          (m + s + a) * parameters.driverCost * (routeLengthAtoB + routeLengthBtoA)

        if (tripCost < bestCost) {
          bestCost = tripCost
          bestMinibus = m
          bestSolo = s
          bestArticulated = a
        }
      }
    }
  }

  // Return the result for this route
  return {
    routeNo,
    routeName,
    minibus: bestMinibus,
    solo: bestSolo,
    articulated: bestArticulated,
    totalCost: bestCost, // This is just the comparative cost, not the full day's cost
    peakHourDemand: {
      hour: peakHourData.hour,
      passengersAtoB: peakPassengersAtoB,
      passengersBtoA: peakPassengersBtoA,
    },
  }
}

// This function now provides a rough estimation. The real KPIs come from the schedule optimizer.
function calculateEstimatedKPIs(results: OptimizationResult[], routes: RouteData[], parameters: BusParameters): KPIData {
  // For now, return a simplified or zeroed KPI object, as the detailed calculation
  // is now the responsibility of the schedule optimizer.
  return {
    totalPassengers: 0,
    totalDistance: 0,
    optimizationTime: 0,
    totalFuelCost: 0,
    totalMaintenanceCost: 0,
    totalDepreciationCost: 0,
    totalDriverCost: 0,
    totalCost: 0,
    costPerKm: 0,
    costPerPassenger: 0,
    totalCarbonEmission: 0,
    carbonPerPassenger: 0,
    carbonSaved: 0,
  }
}
