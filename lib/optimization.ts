import type { RouteData, BusParameters, OptimizationResult, KPIData } from "@/context/bus-optimization-context"

// Main optimization function
export function runOptimization(
  routes: RouteData[],
  parameters: BusParameters,
): { results: OptimizationResult[]; kpis: KPIData; isFeasible: boolean } {
  // Initialize results array
  const results: OptimizationResult[] = []
  let isFeasible = true

  // Track total fleet usage
  let totalMinibusUsed = 0
  let totalSoloUsed = 0
  let totalArticulatedUsed = 0

  // Optimize each route
  for (const route of routes) {
    const result = optimizeRoute(route, parameters)

    // Update total fleet usage
    totalMinibusUsed += result.minibus
    totalSoloUsed += result.solo
    totalArticulatedUsed += result.articulated

    results.push(result)
  }

  // Check if we have enough buses in the fleet
  if (
    totalMinibusUsed > parameters.minibus.fleetCount ||
    totalSoloUsed > parameters.solo.fleetCount ||
    totalArticulatedUsed > parameters.articulated.fleetCount
  ) {
    isFeasible = false
  }

  // Calculate KPIs
  const kpis = calculateKPIs(results, routes, parameters)

  return { results, kpis, isFeasible }
}

// OptimizationResult tipini güncelle - routeLength alanını kaldır ve her iki yön için ayrı uzunluk ekle
function optimizeRoute(route: RouteData, parameters: BusParameters): OptimizationResult {
  const { routeNo, routeName, routeLengthAtoB, routeLengthBtoA, peakPassengersAtoB, peakPassengersBtoA } = route

  // Ortalama hat uzunluğunu hesapla
  const avgRouteLength = (routeLengthAtoB + routeLengthBtoA) / 2

  // Her iki yöndeki toplam yolcu sayısını hesapla
  const totalPassengers = peakPassengersAtoB + peakPassengersBtoA

  // Her yön için ayrı ayrı minimum otobüs sayılarını hesapla
  const minMinibusesAtoB = Math.ceil(peakPassengersAtoB / parameters.minibus.capacity)
  const minSoloBusesAtoB = Math.ceil(peakPassengersAtoB / parameters.solo.capacity)
  const minArticulatedBusesAtoB = Math.ceil(peakPassengersAtoB / parameters.articulated.capacity)

  const minMinibusesBtoA = Math.ceil(peakPassengersBtoA / parameters.minibus.capacity)
  const minSoloBusesBtoA = Math.ceil(peakPassengersBtoA / parameters.solo.capacity)
  const minArticulatedBusesBtoA = Math.ceil(peakPassengersBtoA / parameters.articulated.capacity)

  // Her iki yön için toplam minimum otobüs sayılarını hesapla
  const minMinibuses = Math.max(minMinibusesAtoB, minMinibusesBtoA)
  const minSoloBuses = Math.max(minSoloBusesAtoB, minSoloBusesBtoA)
  const minArticulatedBuses = Math.max(minArticulatedBusesAtoB, minArticulatedBusesBtoA)

  // Calculate costs for different bus types
  const minibusOperatingCost =
    parameters.minibus.fuelCost + parameters.minibus.maintenanceCost + parameters.minibus.depreciationCost
  const soloOperatingCost =
    parameters.solo.fuelCost + parameters.solo.maintenanceCost + parameters.solo.depreciationCost
  const articulatedOperatingCost =
    parameters.articulated.fuelCost + parameters.articulated.maintenanceCost + parameters.articulated.depreciationCost

  // Initialize variables to track the best solution
  let bestCost = Number.POSITIVE_INFINITY
  let bestMinibus = 0
  let bestSolo = 0
  let bestArticulated = 0
  let bestCapacityUtilization = 0

  // Try different combinations of bus types
  for (let m = 0; m <= minMinibuses; m++) {
    for (let s = 0; s <= minSoloBuses; s++) {
      for (let a = 0; a <= minArticulatedBuses; a++) {
        // Calculate total capacity
        const totalCapacity =
          m * parameters.minibus.capacity + s * parameters.solo.capacity + a * parameters.articulated.capacity

        // Her iki yön için kapasite kontrolü yap
        if (totalCapacity < peakPassengersAtoB || totalCapacity < peakPassengersBtoA) continue

        // Calculate capacity utilization (her iki yönün ortalaması)
        const capacityUtilizationAtoB = peakPassengersAtoB / totalCapacity
        const capacityUtilizationBtoA = peakPassengersBtoA / totalCapacity
        const capacityUtilization = (capacityUtilizationAtoB + capacityUtilizationBtoA) / 2

        // Calculate total cost - her iki yöndeki hat uzunluklarını kullan
        const totalFuelCost =
          m * parameters.minibus.fuelCost * routeLengthAtoB +
          s * parameters.solo.fuelCost * routeLengthAtoB +
          a * parameters.articulated.fuelCost * routeLengthAtoB +
          m * parameters.minibus.fuelCost * routeLengthBtoA +
          s * parameters.solo.fuelCost * routeLengthBtoA +
          a * parameters.articulated.fuelCost * routeLengthBtoA

        const totalMaintenanceCost =
          m * parameters.minibus.maintenanceCost * routeLengthAtoB +
          s * parameters.solo.maintenanceCost * routeLengthAtoB +
          a * parameters.articulated.maintenanceCost * routeLengthAtoB +
          m * parameters.minibus.maintenanceCost * routeLengthBtoA +
          s * parameters.solo.maintenanceCost * routeLengthBtoA +
          a * parameters.articulated.maintenanceCost * routeLengthBtoA

        const totalDepreciationCost =
          m * parameters.minibus.depreciationCost * routeLengthAtoB +
          s * parameters.solo.depreciationCost * routeLengthAtoB +
          a * parameters.articulated.depreciationCost * routeLengthAtoB +
          m * parameters.minibus.depreciationCost * routeLengthBtoA +
          s * parameters.solo.depreciationCost * routeLengthBtoA +
          a * parameters.articulated.depreciationCost * routeLengthBtoA

        const totalDriverCost = (m + s + a) * parameters.driverCost * (routeLengthAtoB + routeLengthBtoA)

        const totalCost = totalFuelCost + totalMaintenanceCost + totalDepreciationCost + totalDriverCost

        // Calculate carbon emission - her iki yöndeki hat uzunluklarını kullan
        const totalCarbonEmission =
          m * parameters.minibus.carbonEmission * routeLengthAtoB +
          s * parameters.solo.carbonEmission * routeLengthAtoB +
          a * parameters.articulated.carbonEmission * routeLengthAtoB +
          m * parameters.minibus.carbonEmission * routeLengthBtoA +
          s * parameters.solo.carbonEmission * routeLengthBtoA +
          a * parameters.articulated.carbonEmission * routeLengthBtoA

        // Update best solution if this is better
        if (totalCost < bestCost) {
          bestCost = totalCost
          bestMinibus = m
          bestSolo = s
          bestArticulated = a
          bestCapacityUtilization = capacityUtilization
        }
      }
    }
  }

  // Calculate detailed costs for the best solution - her iki yöndeki hat uzunluklarını kullan
  const fuelCost =
    bestMinibus * parameters.minibus.fuelCost * (routeLengthAtoB + routeLengthBtoA) +
    bestSolo * parameters.solo.fuelCost * (routeLengthAtoB + routeLengthBtoA) +
    bestArticulated * parameters.articulated.fuelCost * (routeLengthAtoB + routeLengthBtoA)

  const maintenanceCost =
    bestMinibus * parameters.minibus.maintenanceCost * (routeLengthAtoB + routeLengthBtoA) +
    bestSolo * parameters.solo.maintenanceCost * (routeLengthAtoB + routeLengthBtoA) +
    bestArticulated * parameters.articulated.maintenanceCost * (routeLengthAtoB + routeLengthBtoA)

  const depreciationCost =
    bestMinibus * parameters.minibus.depreciationCost * (routeLengthAtoB + routeLengthBtoA) +
    bestSolo * parameters.solo.depreciationCost * (routeLengthAtoB + routeLengthBtoA) +
    bestArticulated * parameters.articulated.depreciationCost * (routeLengthAtoB + routeLengthBtoA)

  const driverCost =
    (bestMinibus + bestSolo + bestArticulated) * parameters.driverCost * (routeLengthAtoB + routeLengthBtoA)

  const carbonEmission =
    bestMinibus * parameters.minibus.carbonEmission * (routeLengthAtoB + routeLengthBtoA) +
    bestSolo * parameters.solo.carbonEmission * (routeLengthAtoB + routeLengthBtoA) +
    bestArticulated * parameters.articulated.carbonEmission * (routeLengthAtoB + routeLengthBtoA)

  // Return the optimization result
  return {
    routeNo,
    routeName,
    routeLength: avgRouteLength, // Ortalama hat uzunluğunu kullan
    minibus: bestMinibus,
    solo: bestSolo,
    articulated: bestArticulated,
    fuelCost,
    maintenanceCost,
    depreciationCost,
    driverCost,
    totalCost: fuelCost + maintenanceCost + depreciationCost + driverCost,
    carbonEmission,
    capacityUtilization: bestCapacityUtilization,
    peakPassengersAtoB,
    peakPassengersBtoA,
  }
}

// calculateKPIs fonksiyonunu güncelle - NaN değerlerini önlemek için
function calculateKPIs(results: OptimizationResult[], routes: RouteData[], parameters: BusParameters): KPIData {
  // Calculate total passengers (her iki yön için)
  const totalPassengers = routes.reduce((sum, route) => sum + route.peakPassengersAtoB + route.peakPassengersBtoA, 0)

  // Calculate total distance - her iki yöndeki hat uzunluklarını kullan
  let totalDistance = 0

  results.forEach((result) => {
    const route = routes.find((r) => r.routeNo === result.routeNo)
    if (route) {
      // Her iki yöndeki toplam mesafe
      const routeDistance = route.routeLengthAtoB + route.routeLengthBtoA
      // Her otobüs tipi için sefer sayısı
      const totalTrips = result.minibus + result.solo + result.articulated
      // Bu hat için toplam mesafe
      totalDistance += routeDistance * totalTrips
    }
  })

  // Calculate total costs
  const totalFuelCost = results.reduce((sum, result) => sum + result.fuelCost, 0)
  const totalMaintenanceCost = results.reduce((sum, result) => sum + result.maintenanceCost, 0)
  const totalDepreciationCost = results.reduce((sum, result) => sum + result.depreciationCost, 0)
  const totalDriverCost = results.reduce((sum, result) => sum + result.driverCost, 0)
  const totalCost = totalFuelCost + totalMaintenanceCost + totalDepreciationCost + totalDriverCost

  // Calculate cost per km and per passenger
  const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0
  const costPerPassenger = totalPassengers > 0 ? totalCost / totalPassengers : 0

  // Calculate carbon emission metrics
  const totalCarbonEmission = results.reduce((sum, result) => sum + result.carbonEmission, 0)
  const carbonPerPassenger = totalPassengers > 0 ? totalCarbonEmission / totalPassengers : 0

  // Estimate carbon saved by using public transport
  // Assuming average car emission is 0.2 kg/km per passenger
  const carEmissionPerPassenger = 0.2
  const carbonSaved = totalPassengers * totalDistance * (carEmissionPerPassenger - carbonPerPassenger)

  return {
    totalPassengers,
    totalDistance,
    optimizationTime: 0, // This will be set by the caller
    totalFuelCost,
    totalMaintenanceCost,
    totalDepreciationCost,
    totalDriverCost,
    totalCost,
    costPerKm,
    costPerPassenger,
    totalCarbonEmission,
    carbonPerPassenger,
    carbonSaved,
  }
}
