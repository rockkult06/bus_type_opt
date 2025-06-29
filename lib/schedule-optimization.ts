import type { StrategicResult, RouteData, BusParameters, ScheduleResult, Trip } from "@/types"

type Bus = {
  id: string
  type: "minibus" | "solo" | "articulated"
  availableFrom: number // time in minutes
  assignedRoute: string | null
}

export function runScheduleOptimization(
  strategicResult: StrategicResult,
  routes: RouteData[],
  parameters: BusParameters,
): ScheduleResult {
  const { recommendedFleet } = strategicResult
  const operationStartTime = parameters.operationStartTime

  // 1. Create the pool of buses based on the strategic results
  const busPool: Bus[] = []
  let busIdCounter = 0
  Object.entries(recommendedFleet).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) {
      busPool.push({
        id: `${type.toUpperCase()}-${busIdCounter++}`,
        type: type as "minibus" | "solo" | "articulated",
        availableFrom: operationStartTime,
        assignedRoute: null,
      })
    }
  })

  const schedule: Trip[] = []
  const routeMap = new Map(routes.map(r => [r.routeNo, r]))

  // 2. Simple scheduling heuristic
  // This is a very basic greedy algorithm. A real-world solution would be more complex.
  for (let hour = operationStartTime / 60; hour < 28; hour++) {
    for (const route of routes) {
      const demandData = route.hourlyDemand.find(d => d.hour === (hour % 24))
      if (!demandData) continue

      const capacityNeededAtoB = demandData.demandAtoB
      const capacityNeededBtoA = demandData.demandBtoA
      const travelTimeAtoB = route.travelTimeAtoB
      const travelTimeBtoA = route.travelTimeBtoA

      // Schedule trips for AtoB direction for this hour
      let scheduledCapacityAtoB = 0
      while (scheduledCapacityAtoB < capacityNeededAtoB) {
        const bus = findAvailableBus(busPool, hour * 60, route.routeNo, parameters.maxInterlining)
        if (!bus) break // No available buses

        const busCapacity = parameters[bus.type].capacity
        schedule.push({
          tripId: `T_${schedule.length}`,
          busId: bus.id,
          busType: bus.type,
          routeNo: route.routeNo,
          direction: "AtoB",
          startTime: hour * 60,
          endTime: hour * 60 + travelTimeAtoB,
        })
        bus.availableFrom = hour * 60 + travelTimeAtoB + 10 // 10 min turnaround
        bus.assignedRoute = route.routeNo
        scheduledCapacityAtoB += busCapacity
      }
      
      // Schedule trips for BtoA direction for this hour
      let scheduledCapacityBtoA = 0
      while (scheduledCapacityBtoA < capacityNeededBtoA) {
          const bus = findAvailableBus(busPool, hour * 60, route.routeNo, parameters.maxInterlining)
          if (!bus) break // No available buses

          const busCapacity = parameters[bus.type].capacity
          schedule.push({
              tripId: `T_${schedule.length}`,
              busId: bus.id,
              busType: bus.type,
              routeNo: route.routeNo,
              direction: "BtoA",
              startTime: hour * 60,
              endTime: hour * 60 + travelTimeBtoA,
          })
          bus.availableFrom = hour * 60 + travelTimeBtoA + 10 // 10 min turnaround
          bus.assignedRoute = route.routeNo
          scheduledCapacityBtoA += busCapacity
      }
    }
  }
  
  // 3. Calculate final stats
  const totalTrips = schedule.length
  let totalDistance = 0
  let totalDuration = 0
  const busUtilization: ScheduleResult["stats"]["busUtilization"] = {}

  for(const trip of schedule) {
      const route = routeMap.get(trip.routeNo)
      if(route) {
          totalDistance += trip.direction === 'AtoB' ? route.routeLengthAtoB : route.routeLengthBtoA
      }
      totalDuration += trip.endTime - trip.startTime

      if(!busUtilization[trip.busId]) {
          busUtilization[trip.busId] = { trips: 0, busType: trip.busType, routes: [] }
      }
      busUtilization[trip.busId].trips++
      if(!busUtilization[trip.busId].routes.includes(Number(trip.routeNo))) {
        busUtilization[trip.busId].routes.push(Number(trip.routeNo))
      }
  }

  return {
    schedule,
    stats: {
      totalTrips,
      totalDistance,
      totalDuration,
      busUtilization,
    },
  }
}

function findAvailableBus(busPool: Bus[], currentTime: number, routeNo: string, maxInterlining: number): Bus | null {
  // Find the earliest available bus, preferring buses already on the same route
  busPool.sort((a, b) => a.availableFrom - b.availableFrom)
  
  const idealBus = busPool.find(
    bus => bus.availableFrom <= currentTime && bus.assignedRoute === routeNo
  )
  if(idealBus) return idealBus

  // If no bus on the same route, find any available bus that can take a new route
  const interlineBus = busPool.find(
    bus => bus.availableFrom <= currentTime && (bus.assignedRoute === null || maxInterlining > 1) // Simplified interlining logic
  )
  return interlineBus || null
} 