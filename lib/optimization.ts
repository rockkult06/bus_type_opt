import type { RouteData, BusParameters, StrategicResult } from "@/types"

export function runStrategicOptimization(routes: RouteData[], parameters: BusParameters): StrategicResult {
  let peakDemand = 0
  let peakHour = -1

  // Find the peak demand across the entire system at any given hour
  const hourlySystemDemand: { [hour: number]: number } = {}
  if (routes) {
    for (const route of routes) {
      if (route.hourlyDemand) {
        for (const demand of route.hourlyDemand) {
          const hour = demand.hour
          if (!hourlySystemDemand[hour]) {
            hourlySystemDemand[hour] = 0
          }
          // Consider the max demand on a route for that hour, not sum of directions
          const maxDirectionalDemand = Math.max(demand.demandAtoB, demand.demandBtoA)
          hourlySystemDemand[hour] += maxDirectionalDemand
        }
      }
    }
  }

  for (const hour in hourlySystemDemand) {
    if (hourlySystemDemand[hour] > peakDemand) {
      peakDemand = hourlySystemDemand[hour]
      peakHour = parseInt(hour)
    }
  }

  // Now, find the cheapest fleet composition to satisfy this system-wide peak demand
  const capacities = {
    minibus: parameters.minibus.capacity,
    solo: parameters.solo.capacity,
    articulated: parameters.articulated.capacity,
  }

  // Simplified cost factor - can be made more complex
  const costs = {
    minibus: parameters.minibus.fuelCost + parameters.minibus.maintenanceCost + parameters.minibus.depreciationCost,
    solo: parameters.solo.fuelCost + parameters.solo.maintenanceCost + parameters.solo.depreciationCost,
    articulated:
      parameters.articulated.fuelCost +
      parameters.articulated.maintenanceCost +
      parameters.articulated.depreciationCost,
  }

  let bestCost = Infinity
  let recommendedFleet = {
    minibus: 0,
    solo: 0,
    articulated: 0,
  }

  const availableFleet = {
    minibus: parameters.minibus.fleetCount,
    solo: parameters.solo.fleetCount,
    articulated: parameters.articulated.fleetCount,
  }

  // Brute-force search for the best fleet mix
  for (let m = 0; m <= availableFleet.minibus; m++) {
    for (let s = 0; s <= availableFleet.solo; s++) {
      let remainingDemand = peakDemand - m * capacities.minibus - s * capacities.solo
      if (remainingDemand < 0) remainingDemand = 0

      const a = Math.ceil(remainingDemand / capacities.articulated)

      if (a > availableFleet.articulated) {
        continue // Not enough articulated buses
      }

      const totalCapacity = m * capacities.minibus + s * capacities.solo + a * capacities.articulated
      if (totalCapacity < peakDemand) {
        continue
      }

      const currentCost = m * costs.minibus + s * costs.solo + a * costs.articulated

      if (currentCost < bestCost) {
        bestCost = currentCost
        recommendedFleet = {
          minibus: m,
          solo: s,
          articulated: a,
        }
      }
    }
  }

  return {
    recommendedFleet,
    totalCost: bestCost,
    peakDemand: {
      hour: peakHour,
      demand: peakDemand,
    },
  }
} 