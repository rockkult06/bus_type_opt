import type {
  OptimizationResult,
  ScheduleParameters,
  ScheduleResult,
  BusParameters,
} from "@/context/bus-optimization-context"

// Define the RouteData type
export interface RouteData {
  routeNo: string
  travelTimeAtoB: number
  travelTimeBtoA: number
  peakPassengersAtoB: number
  peakPassengersBtoA: number
  routeLengthAtoB: number
  routeLengthBtoA: number
}

// createSchedule fonksiyonunu güncelleyelim - iteratif optimizasyon döngüsü ekleyelim
export function createSchedule(
  optimizationResults: OptimizationResult[],
  scheduleParams: ScheduleParameters,
  routes: RouteData[],
  parameters?: BusParameters,
): { scheduleResult: ScheduleResult; isFeasible: boolean; optimalInterlining?: number } {
  // Kullanıcının belirlediği maksimum interlining değeri
  // Eğer parameters undefined ise veya maxInterlining tanımlı değilse, 0 kullan
  const userMaxInterlining = parameters?.maxInterlining ?? 0

  console.log(`User defined maxInterlining: ${userMaxInterlining}`)

  // Eğer userMaxInterlining 0 ise, iteratif optimizasyon yapmadan direkt 0 ile çalıştır
  if (userMaxInterlining === 0) {
    console.log("Running optimization with fixed interlining = 0")

    // Interlining değeri 0 ile çizelge oluştur
    const currentParameters = parameters
      ? { ...parameters, maxInterlining: 0 }
      : ({ maxInterlining: 0 } as BusParameters)
    const result = generateScheduleWithInterlining(optimizationResults, scheduleParams, routes, currentParameters)

    // Sonucu döndür
    return {
      scheduleResult: {
        ...result.scheduleResult,
        optimalInterlining: 0,
      },
      isFeasible: result.isFeasible,
      optimalInterlining: 0,
    }
  }

  // Optimizasyon sonuçlarını saklamak için değişkenler
  let bestScheduleResult: ScheduleResult | null = null
  let bestCost: number = Number.POSITIVE_INFINITY
  let optimalInterlining = 0
  let isFeasible = true

  // 0'dan başlayarak kullanıcının belirlediği maksimum interlining değerine kadar iterasyon yap
  for (let currentInterlining = 0; currentInterlining <= userMaxInterlining; currentInterlining++) {
    console.log(`Trying optimization with Maximum Interlining = ${currentInterlining}`)

    // Mevcut interlining değeri ile parametreleri güncelle
    const currentParameters = parameters ? { ...parameters, maxInterlining: currentInterlining } : undefined

    // Mevcut interlining değeri ile çizelge oluştur
    const result = generateScheduleWithInterlining(optimizationResults, scheduleParams, routes, currentParameters)

    // Toplam maliyeti hesapla
    const totalCost = calculateTotalCost(result, routes, currentParameters)

    console.log(`Maximum Interlining = ${currentInterlining}, Total Cost = ${totalCost}`)

    // Eğer bu maliyet daha iyiyse, en iyi sonuç olarak kaydet
    if (totalCost <= bestCost) {
      bestCost = totalCost
      bestScheduleResult = result.scheduleResult
      optimalInterlining = currentInterlining
      isFeasible = result.isFeasible

      console.log(`New best cost found: ${bestCost} with interlining = ${optimalInterlining}`)
    } else {
      // Maliyet artmaya başladıysa, döngüyü sonlandır
      console.log(`Cost increased, stopping at interlining = ${currentInterlining - 1}`)
      break
    }
  }

  // En iyi sonucu döndür
  return {
    scheduleResult: {
      ...bestScheduleResult!,
      optimalInterlining: optimalInterlining,
    },
    isFeasible: isFeasible,
    optimalInterlining: optimalInterlining,
  }
}

// Mevcut interlining değeri ile çizelge oluşturan yardımcı fonksiyon
function generateScheduleWithInterlining(
  optimizationResults: OptimizationResult[],
  scheduleParams: ScheduleParameters,
  routes: RouteData[],
  parameters?: BusParameters,
): { scheduleResult: ScheduleResult; isFeasible: boolean } {
  // Extract the time range and convert to minutes for easier calculations
  const startTimeMinutes = timeToMinutes(scheduleParams.timeRange.start)
  const endTimeMinutes = timeToMinutes(scheduleParams.timeRange.end)
  const totalMinutes = endTimeMinutes - startTimeMinutes

  // Calculate total buses of each type from optimization results
  const totalMinibus = optimizationResults.reduce((sum, r) => sum + r.minibus, 0)
  const totalSolo = optimizationResults.reduce((sum, r) => sum + r.solo, 0)
  const totalArticulated = optimizationResults.reduce((sum, r) => sum + r.articulated, 0)

  console.log(`Total buses: Minibus: ${totalMinibus}, Solo: ${totalSolo}, Articulated: ${totalArticulated}`)

  // Create a schedule with the optimized bus types
  const result = generateSchedule(
    startTimeMinutes,
    endTimeMinutes,
    totalMinibus,
    totalSolo,
    totalArticulated,
    routes,
    parameters,
  )

  // Calculate actual frequencies based on the final schedule
  const actualFrequencyAB =
    result.scheduleAB.length > 1 ? Math.round(totalMinutes / (result.scheduleAB.length - 1)) : totalMinutes

  const actualFrequencyBA =
    result.scheduleBA.length > 1 ? Math.round(totalMinutes / (result.scheduleBA.length - 1)) : totalMinutes

  const scheduleResult: ScheduleResult = {
    frequencyAB: actualFrequencyAB,
    frequencyBA: actualFrequencyBA,
    tripsAB: result.scheduleAB.length,
    tripsBA: result.scheduleBA.length,
    totalBuses: result.totalBuses,
    scheduleAB: result.scheduleAB,
    scheduleBA: result.scheduleBA,
    busUtilization: result.busUtilization,
    routeSchedules: result.routeSchedules,
  }

  // Her zaman isFeasible = true döndür, yetersiz kaynak uyarısını gösterme
  return { scheduleResult, isFeasible: true }
}

// Toplam maliyeti hesaplayan yeni fonksiyon
function calculateTotalCost(
  result: { scheduleResult: ScheduleResult; isFeasible: boolean },
  routes: RouteData[],
  parameters?: BusParameters,
): number {
  if (!parameters) return Number.POSITIVE_INFINITY

  let totalCost = 0

  // Toplam sefer sayısı
  const totalTrips = result.scheduleResult.tripsAB + result.scheduleResult.tripsBA

  // Her otobüs tipi için toplam sayıları hesapla
  const busTypes: Record<string, { count: number; type: "minibus" | "solo" | "articulated" }> = {}

  Object.entries(result.scheduleResult.busUtilization).forEach(([busId, data]) => {
    if (!busTypes[data.busType]) {
      busTypes[data.busType] = { count: 0, type: data.busType }
    }
    busTypes[data.busType].count++
  })

  // Her hat için toplam mesafeyi hesapla
  let totalDistance = 0
  routes.forEach((route) => {
    // Her hat için A->B ve B->A yönlerindeki sefer sayılarını bul
    const routeSchedules = result.scheduleResult.routeSchedules?.[route.routeNo]
    if (routeSchedules) {
      const abTrips = routeSchedules.scheduleAB.length
      const baTrips = routeSchedules.scheduleBA.length

      // Toplam mesafeyi hesapla
      totalDistance += abTrips * route.routeLengthAtoB + baTrips * route.routeLengthBtoA
    }
  })

  // Yakıt maliyeti
  let fuelCost = 0
  if (busTypes["minibus"]) {
    fuelCost += busTypes["minibus"].count * parameters.minibus.fuelCost * (totalDistance / Object.keys(busTypes).length)
  }
  if (busTypes["solo"]) {
    fuelCost += busTypes["solo"].count * parameters.solo.fuelCost * (totalDistance / Object.keys(busTypes).length)
  }
  if (busTypes["articulated"]) {
    fuelCost +=
      busTypes["articulated"].count * parameters.articulated.fuelCost * (totalDistance / Object.keys(busTypes).length)
  }

  // Bakım maliyeti
  let maintenanceCost = 0
  if (busTypes["minibus"]) {
    maintenanceCost +=
      busTypes["minibus"].count * parameters.minibus.maintenanceCost * (totalDistance / Object.keys(busTypes).length)
  }
  if (busTypes["solo"]) {
    maintenanceCost +=
      busTypes["solo"].count * parameters.solo.maintenanceCost * (totalDistance / Object.keys(busTypes).length)
  }
  if (busTypes["articulated"]) {
    maintenanceCost +=
      busTypes["articulated"].count *
      parameters.articulated.maintenanceCost *
      (totalDistance / Object.keys(busTypes).length)
  }

  // Amortisman maliyeti
  let depreciationCost = 0
  if (busTypes["minibus"]) {
    depreciationCost +=
      busTypes["minibus"].count * parameters.minibus.depreciationCost * (totalDistance / Object.keys(busTypes).length)
  }
  if (busTypes["solo"]) {
    depreciationCost +=
      busTypes["solo"].count * parameters.solo.depreciationCost * (totalDistance / Object.keys(busTypes).length)
  }
  if (busTypes["articulated"]) {
    depreciationCost +=
      busTypes["articulated"].count *
      parameters.articulated.depreciationCost *
      (totalDistance / Object.keys(busTypes).length)
  }

  // Sürücü maliyeti
  const driverCost = result.scheduleResult.totalBuses * parameters.driverCost * totalDistance

  // Toplam maliyeti hesapla
  totalCost = fuelCost + maintenanceCost + depreciationCost + driverCost

  return totalCost
}

// Otobüs kapasiteleri
const MINIBUS_CAPACITY = 60
const SOLO_CAPACITY = 100
const ARTICULATED_CAPACITY = 120

// Bus type definition
type Bus = {
  id: string
  location: "A" | "B"
  availableAt: number
  trips: number
  type: "minibus" | "solo" | "articulated"
  currentRoute?: string
  routes: Set<string> // Otobüsün çalıştığı hatların listesi
}

// Trip definition
type Trip = {
  routeNo: string
  direction: "AtoB" | "BtoA"
  departureTime: number
  busId?: string
  busType?: "minibus" | "solo" | "articulated"
}

// Otobüs tipi seçimini optimize eden yeni bir fonksiyon ekleyelim
function findOptimalBusTypeAssignment(
  routeNo: string,
  peakPassengersAtoB: number,
  peakPassengersBtoA: number,
  routeLengthAtoB: number,
  routeLengthBtoA: number,
  parameters: BusParameters,
): { minibus: number; solo: number; articulated: number; totalCost: number } {
  // Her iki yöndeki maksimum yolcu sayısını bul
  const maxPassengers = Math.max(peakPassengersAtoB, peakPassengersBtoA)

  // Minimum gerekli kapasite
  const requiredCapacity = maxPassengers

  // Otobüs tiplerinin kapasiteleri
  const minibusCapacity = parameters.minibus.capacity
  const soloCapacity = parameters.solo.capacity
  const articulatedCapacity = parameters.articulated.capacity

  // Otobüs tiplerinin kilometre başına toplam maliyetleri
  const minibusCostPerKm =
    parameters.minibus.fuelCost + parameters.minibus.maintenanceCost + parameters.minibus.depreciationCost
  const soloCostPerKm = parameters.solo.fuelCost + parameters.solo.maintenanceCost + parameters.solo.depreciationCost
  const articulatedCostPerKm =
    parameters.articulated.fuelCost + parameters.articulated.maintenanceCost + parameters.articulated.depreciationCost

  // Ortalama hat uzunluğu
  const avgRouteLength = (routeLengthAtoB + routeLengthBtoA) / 2

  // En iyi kombinasyonu bulmak için değişkenler
  let bestMinibus = 0
  let bestSolo = 0
  let bestArticulated = 0
  let bestCost = Number.POSITIVE_INFINITY
  let bestCapacityUtilization = 0

  // Tüm olası kombinasyonları dene
  // Maksimum otobüs sayısını sınırla (örneğin her tipten en fazla 10 adet)
  const maxBusCount = Math.ceil(requiredCapacity / minibusCapacity) + 2 // Biraz fazla olsun

  for (let m = 0; m <= maxBusCount; m++) {
    for (let s = 0; s <= maxBusCount; s++) {
      for (let a = 0; a <= maxBusCount; a++) {
        // Toplam kapasite
        const totalCapacity = m * minibusCapacity + s * soloCapacity + a * articulatedCapacity

        // Kapasite yeterli değilse, bu kombinasyonu atla
        if (totalCapacity < requiredCapacity) continue

        // Kapasite kullanım oranı - daha yüksek olması daha iyi
        const capacityUtilization = requiredCapacity / totalCapacity

        // Toplam maliyet (her iki yön için)
        const totalCost =
          (m * minibusCostPerKm + s * soloCostPerKm + a * articulatedCostPerKm) * routeLengthAtoB +
          (m * minibusCostPerKm + s * soloCostPerKm + a * articulatedCostPerKm) * routeLengthBtoA +
          (m + s + a) * parameters.driverCost * (routeLengthAtoB + routeLengthBtoA)

        // Eğer bu kombinasyon daha ucuzsa veya aynı maliyetle daha iyi kapasite kullanımı sağlıyorsa
        if (
          totalCost < bestCost ||
          (Math.abs(totalCost - bestCost) < 0.01 && capacityUtilization > bestCapacityUtilization)
        ) {
          bestCost = totalCost
          bestMinibus = m
          bestSolo = s
          bestArticulated = a
          bestCapacityUtilization = capacityUtilization
        }
      }
    }
  }

  console.log(
    `Hat ${routeNo} için optimal otobüs kombinasyonu: Midibüs: ${bestMinibus}, Solo: ${bestSolo}, Körüklü: ${bestArticulated}, Maliyet: ${bestCost.toFixed(2)}, Kapasite Kullanımı: ${(bestCapacityUtilization * 100).toFixed(1)}%`,
  )

  return {
    minibus: bestMinibus,
    solo: bestSolo,
    articulated: bestArticulated,
    totalCost: bestCost,
  }
}

// Çizelge oluşturma fonksiyonu
function generateSchedule(
  startTime: number,
  endTime: number,
  totalMinibus: number,
  totalSolo: number,
  totalArticulated: number,
  routes: RouteData[],
  parameters?: BusParameters,
): {
  totalBuses: number
  scheduleAB: Array<{ time: string; busId: string; busType: "minibus" | "solo" | "articulated"; routeNo?: string }>
  scheduleBA: Array<{ time: string; busId: string; busType: "minibus" | "solo" | "articulated"; routeNo?: string }>
  busUtilization: Record<string, { trips: number; busType: "minibus" | "solo" | "articulated" }>
  isFeasible: boolean
  routeSchedules: Record<
    string,
    {
      scheduleAB: Array<{ time: string; busId: string; busType: "minibus" | "solo" | "articulated" }>
      scheduleBA: Array<{ time: string; busId: string; busType: "minibus" | "solo" | "articulated" }>
      routeInfo?: {
        routeLengthAtoB: number
        routeLengthBtoA: number
        travelTimeAtoB: number
        travelTimeBtoA: number
        peakPassengersAtoB: number
        peakPassengersBtoA: number
      }
    }
  >
} {
  // Eğer parameters undefined ise, varsayılan maxInterlining değerini 0 olarak ayarla
  const maxInterlining = parameters?.maxInterlining ?? 0

  console.log(`Using maxInterlining = ${maxInterlining} in generateSchedule`)

  // Hat bazlı çizelgeler için nesne oluştur
  const routeSchedules: Record<
    string,
    {
      scheduleAB: Array<{ time: string; busId: string; busType: "minibus" | "solo" | "articulated" }>
      scheduleBA: Array<{ time: string; busId: string; busType: "minibus" | "solo" | "articulated" }>
      routeInfo?: {
        routeLengthAtoB: number
        routeLengthBtoA: number
        travelTimeAtoB: number
        travelTimeBtoA: number
        peakPassengersAtoB: number
        peakPassengersBtoA: number
      }
    }
  > = {}

  // Her hat için boş çizelgeler oluştur ve hat bilgilerini ekle
  routes.forEach((route) => {
    routeSchedules[route.routeNo] = {
      scheduleAB: [],
      scheduleBA: [],
      routeInfo: {
        routeLengthAtoB: route.routeLengthAtoB,
        routeLengthBtoA: route.routeLengthBtoA,
        travelTimeAtoB: route.travelTimeAtoB,
        travelTimeBtoA: route.travelTimeBtoA,
        peakPassengersAtoB: route.peakPassengersAtoB,
        peakPassengersBtoA: route.peakPassengersBtoA,
      },
    }
  })

  // Her hat için optimal otobüs tipi kombinasyonunu belirle
  const routeOptimalBuses: Record<string, { minibus: number; solo: number; articulated: number }> = {}

  if (parameters) {
    routes.forEach((route) => {
      const optimal = findOptimalBusTypeAssignment(
        route.routeNo,
        route.peakPassengersAtoB,
        route.peakPassengersBtoA,
        route.routeLengthAtoB,
        route.routeLengthBtoA,
        parameters,
      )

      routeOptimalBuses[route.routeNo] = {
        minibus: optimal.minibus,
        solo: optimal.solo,
        articulated: optimal.articulated,
      }
    })
  }

  // Otobüs filosunu oluştur - her hat için optimal otobüs tiplerini kullanarak
  const buses: Bus[] = []
  const busIdCounter = { minibus: 1, solo: 1, articulated: 1 }

  // Her hat için optimal otobüs tiplerini ekle
  Object.entries(routeOptimalBuses).forEach(([routeNo, busTypes]) => {
    // Midibüsler
    for (let i = 0; i < busTypes.minibus; i++) {
      buses.push({
        id: `Midibüs-${busIdCounter.minibus++}`,
        location: i % 2 === 0 ? "A" : "B", // Dağıtım
        availableAt: startTime,
        trips: 0,
        type: "minibus",
        currentRoute: routeNo, // Bu otobüsü bu hatta ata
        routes: new Set<string>([routeNo]), // Bu otobüs bu hatta çalışacak
      })
    }

    // Solo otobüsler
    for (let i = 0; i < busTypes.solo; i++) {
      buses.push({
        id: `Solo-${busIdCounter.solo++}`,
        location: i % 2 === 0 ? "A" : "B",
        availableAt: startTime,
        trips: 0,
        type: "solo",
        currentRoute: routeNo,
        routes: new Set<string>([routeNo]),
      })
    }

    // Körüklü otobüsler
    for (let i = 0; i < busTypes.articulated; i++) {
      buses.push({
        id: `Körüklü-${busIdCounter.articulated++}`,
        location: i % 2 === 0 ? "A" : "B",
        availableAt: startTime,
        trips: 0,
        type: "articulated",
        currentRoute: routeNo,
        routes: new Set<string>([routeNo]),
      })
    }
  })

  // Zaman aralığını hesapla
  const timeRangeMinutes = endTime - startTime

  // AŞAMA 1: Her hat için gereken minimum sefer sayısını hesapla ve seferleri planla
  const allTrips: Trip[] = []

  // AŞAMA 1: Her hat için gereken minimum sefer sayısını hesapla ve seferleri planla kısmını değiştir
  // Satır ~350 civarında, allTrips dizisini oluşturan kısım

  // Minimum sefer sayısı hesaplama kısmını değiştir ve otobüs tipine göre optimize et
  routes.forEach((route) => {
    // Her hat için optimal otobüs tipi kombinasyonunu bul
    const optimal = routeOptimalBuses[route.routeNo]

    // Otobüs tipine göre kapasiteleri belirle
    let totalCapacityPerTripAB = 0
    let totalCapacityPerTripBA = 0

    if (optimal) {
      // Her otobüs tipinin kapasitesini hesapla
      if (optimal.minibus > 0) totalCapacityPerTripAB += optimal.minibus * parameters.minibus.capacity
      if (optimal.solo > 0) totalCapacityPerTripAB += optimal.solo * parameters.solo.capacity
      if (optimal.articulated > 0) totalCapacityPerTripAB += optimal.articulated * parameters.articulated.capacity

      // B->A için de aynı kapasiteyi kullan (otobüsler aynı)
      totalCapacityPerTripBA = totalCapacityPerTripAB
    } else {
      // Varsayılan olarak solo otobüs kapasitesini kullan
      totalCapacityPerTripAB = SOLO_CAPACITY
      totalCapacityPerTripBA = SOLO_CAPACITY
    }

    // Her yön için minimum sefer sayısını hesapla
    // Otobüs kapasitesine göre minimum sefer sayısını belirle
    const minTripsAB = Math.ceil(
      route.peakPassengersAtoB /
        Math.min(
          totalCapacityPerTripAB,
          Math.max(
            MINIBUS_CAPACITY,
            Math.max(parameters.minibus.capacity, Math.max(parameters.solo.capacity, parameters.articulated.capacity)),
          ),
        ),
    )
    const minTripsBA = Math.ceil(
      route.peakPassengersBtoA /
        Math.min(
          totalCapacityPerTripBA,
          Math.max(
            MINIBUS_CAPACITY,
            Math.max(parameters.minibus.capacity, Math.max(parameters.solo.capacity, parameters.articulated.capacity)),
          ),
        ),
    )

    console.log(
      `Route ${route.routeNo}: A->B: ${minTripsAB} trips (${route.peakPassengersAtoB} passengers, capacity ${totalCapacityPerTripAB}), B->A: ${minTripsBA} trips (${route.peakPassengersBtoA} passengers, capacity ${totalCapacityPerTripBA})`,
    )

    // A->B yönü için seferleri planla
    for (let i = 0; i < minTripsAB; i++) {
      // Seferleri zaman aralığına eşit dağıt
      const departureTime = startTime + Math.floor((i * timeRangeMinutes) / Math.max(1, minTripsAB))

      // Sefer ekle
      allTrips.push({
        routeNo: route.routeNo,
        direction: "AtoB",
        departureTime,
      })
    }

    // B->A yönü için seferleri planla
    for (let i = 0; i < minTripsBA; i++) {
      // Seferleri zaman aralığına eşit dağıt
      const departureTime = startTime + Math.floor((i * timeRangeMinutes) / Math.max(1, minTripsBA))

      // Sefer ekle
      allTrips.push({
        routeNo: route.routeNo,
        direction: "BtoA",
        departureTime,
      })
    }
  })

  // Seferleri kalkış zamanına göre sırala
  allTrips.sort((a, b) => a.departureTime - b.departureTime)

  console.log(`Total trips planned: ${allTrips.length}`)

  // AŞAMA 2: Otobüsleri seferlere ata
  for (const trip of allTrips) {
    const route = routes.find((r) => r.routeNo === trip.routeNo)
    if (!route) continue

    // AŞAMA 2: Otobüsleri seferlere ata kısmını güncelleyelim
    // Uygun bir otobüs bul
    const requiredLocation = trip.direction === "AtoB" ? "A" : "B"
    let selectedBus: Bus | null = null

    // Önce aynı hat için atanmış otobüsleri kontrol et
    for (const bus of buses) {
      if (bus.location === requiredLocation && bus.availableAt <= trip.departureTime) {
        // maxInterlining 0 ise, otobüs sadece kendi hattında çalışabilir
        if (maxInterlining === 0) {
          // Otobüs henüz bir hatta atanmamış veya bu hatta atanmışsa kullanılabilir
          if (bus.routes.size === 0 || bus.routes.has(trip.routeNo)) {
            selectedBus = bus
            break
          }
        }
        // maxInterlining > 0 ise, mevcut interlining kurallarını uygula
        else if (bus.currentRoute === trip.routeNo || bus.routes.size < maxInterlining) {
          // Eğer bu otobüs farklı bir hatta çalışacaksa (interlining), kurallara uygunluğunu kontrol et
          if (bus.currentRoute !== trip.routeNo && bus.routes.size > 0) {
            // Kural 1: Interlining yapacak otobüs A noktasında olmalı
            // Kural 2: Interlining yapacak otobüsün ilk seferi A→B yönünde olmalı
            if (requiredLocation === "A" && trip.direction === "AtoB") {
              selectedBus = bus
              break
            }
            // Eğer kurallar sağlanmıyorsa, bu otobüsü atlamaya devam et
            continue
          }

          selectedBus = bus
          break
        }
      }
    }

    // Eğer uygun otobüs bulunamazsa, en erken müsait olacak otobüsü seç
    if (!selectedBus) {
      let earliestAvailableTime = Number.MAX_SAFE_INTEGER
      let earliestBus: Bus | null = null

      for (const bus of buses) {
        if (bus.location === requiredLocation && bus.availableAt < earliestAvailableTime) {
          // maxInterlining 0 ise, otobüs sadece kendi hattında çalışabilir
          if (maxInterlining === 0) {
            // Otobüs henüz bir hatta atanmamış veya bu hatta atanmışsa kullanılabilir
            if (bus.routes.size === 0 || bus.routes.has(trip.routeNo)) {
              earliestAvailableTime = bus.availableAt
              earliestBus = bus
            }
          }
          // maxInterlining > 0 ise, mevcut interlining kurallarını uygula
          else {
            // Interlining kısıtını kontrol et
            if (
              bus.routes.size === 0 ||
              bus.routes.has(trip.routeNo) ||
              (bus.routes.size < maxInterlining && requiredLocation === "A" && trip.direction === "AtoB")
            ) {
              earliestAvailableTime = bus.availableAt
              earliestBus = bus
            }
          }
        }
      }

      if (earliestBus) {
        selectedBus = earliestBus
        // Gerçek kalkış zamanını güncelle
        trip.departureTime = Math.max(trip.departureTime, earliestBus.availableAt)
      }
    }

    // Hala otobüs bulunamazsa, herhangi bir otobüsü seç ve konumunu değiştir
    if (!selectedBus && buses.length > 0) {
      // En az kullanılan ve interlining kısıtını karşılayan otobüsü seç
      const eligibleBuses = buses.filter((bus) => {
        // maxInterlining 0 ise, otobüs sadece kendi hattında çalışabilir
        if (maxInterlining === 0) {
          return bus.routes.size === 0 || bus.routes.has(trip.routeNo)
        }
        // maxInterlining > 0 ise, mevcut interlining kurallarını uygula
        else {
          return (
            bus.routes.size === 0 ||
            bus.routes.has(trip.routeNo) ||
            (bus.routes.size < maxInterlining && requiredLocation === "A" && trip.direction === "AtoB")
          )
        }
      })

      if (eligibleBuses.length > 0) {
        // En az kullanılan otobüsü seç
        const leastUsedBus = eligibleBuses.reduce((prev, curr) => (prev.trips <= curr.trips ? prev : curr))

        selectedBus = leastUsedBus
        selectedBus.location = requiredLocation
        selectedBus.availableAt = trip.departureTime
      } else {
        // Eğer hiçbir uygun otobüs yoksa, yeni bir otobüs ekle
        const newBusType = "minibus" // Varsayılan olarak midibüs ekle
        const newBusId = `Midibüs-${busIdCounter.minibus++}`
        const newBus: Bus = {
          id: newBusId,
          location: requiredLocation,
          availableAt: trip.departureTime,
          trips: 0,
          type: newBusType,
          routes: new Set<string>(),
        }
        buses.push(newBus)
        selectedBus = newBus
      }
    }

    if (selectedBus) {
      // Otobüsü sefere ata
      trip.busId = selectedBus.id
      trip.busType = selectedBus.type

      // Otobüsün durumunu güncelle
      selectedBus.location = trip.direction === "AtoB" ? "B" : "A"
      selectedBus.availableAt =
        trip.departureTime + (trip.direction === "AtoB" ? route.travelTimeAtoB : route.travelTimeBtoA)
      selectedBus.trips++
      selectedBus.currentRoute = trip.routeNo

      // Otobüsün çalıştığı hatlar listesine bu hattı ekle
      selectedBus.routes.add(trip.routeNo)
    }
  }

  // Zaman aralığı dışında kalan seferleri filtrele
  const validTrips = allTrips.filter((trip) => {
    return trip.busId && trip.departureTime >= startTime && trip.departureTime <= endTime
  })

  console.log(`Valid trips after filtering: ${validTrips.length}`)

  // Sonuçları oluştur
  const scheduleAB: Array<{
    time: string
    busId: string
    busType: "minibus" | "solo" | "articulated"
    routeNo?: string
  }> = []

  const scheduleBA: Array<{
    time: string
    busId: string
    busType: "minibus" | "solo" | "articulated"
    routeNo?: string
  }> = []

  // Geçerli seferleri çizelgelere ekle
  for (const trip of validTrips) {
    if (!trip.busId || !trip.busType) continue

    const tripTime = minutesToTime(trip.departureTime)

    if (trip.direction === "AtoB") {
      scheduleAB.push({
        time: tripTime,
        busId: trip.busId,
        busType: trip.busType,
        routeNo: trip.routeNo,
      })

      // Hat bazlı çizelgeye de ekle
      routeSchedules[trip.routeNo].scheduleAB.push({
        time: tripTime,
        busId: trip.busId,
        busType: trip.busType,
      })
    } else {
      scheduleBA.push({
        time: tripTime,
        busId: trip.busId,
        busType: trip.busType,
        routeNo: trip.routeNo,
      })

      // Hat bazlı çizelgeye de ekle
      routeSchedules[trip.routeNo].scheduleBA.push({
        time: tripTime,
        busId: trip.busId,
        busType: trip.busType,
      })
    }
  }

  // Çizelgeleri sırala
  scheduleAB.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
  scheduleBA.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))

  // Hat bazlı çizelgeleri de sırala
  Object.keys(routeSchedules).forEach((routeNo) => {
    routeSchedules[routeNo].scheduleAB.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
    routeSchedules[routeNo].scheduleBA.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
  })

  // Otobüs kullanım kaydını oluştur
  const busUtilization: Record<string, { trips: number; busType: "minibus" | "solo" | "articulated" }> = {}

  for (const bus of buses) {
    if (bus.trips > 0) {
      busUtilization[bus.id] = { trips: bus.trips, busType: bus.type }
    }
  }

  // Aktif otobüsleri say
  let activeBuses = buses.filter((bus) => bus.trips > 0)

  // Kapasite kontrolü yap
  let totalCapacityAB = 0
  let totalCapacityBA = 0
  let totalPassengersAB = 0
  let totalPassengersBA = 0

  // Kapasite kontrolü ve uygunluk kontrolü kısmını değiştir
  // Yetersiz kapasite durumunda otomatik düzeltme ekle
  // Her hat için ayrı kapasite kontrolü yap
  const routeCapacityCheck: Record<
    string,
    {
      abCapacity: number
      baCapacity: number
      abPassengers: number
      baPassengers: number
      abSufficient: boolean
      baSufficient: boolean
      abAdditionalTripsNeeded: number
      baAdditionalTripsNeeded: number
      abCapacityUtilization: number
      baCapacityUtilization: number
    }
  > = {}

  routes.forEach((route) => {
    totalPassengersAB += route.peakPassengersAtoB
    totalPassengersBA += route.peakPassengersBtoA

    let routeAbCapacity = 0
    let routeBaCapacity = 0

    // Her sefer için otobüs tipine göre kapasite hesapla
    routeSchedules[route.routeNo].scheduleAB.forEach((trip) => {
      if (trip.busType === "minibus") {
        totalCapacityAB += parameters.minibus.capacity
        routeAbCapacity += parameters.minibus.capacity
      } else if (trip.busType === "solo") {
        totalCapacityAB += parameters.solo.capacity
        routeAbCapacity += parameters.solo.capacity
      } else if (trip.busType === "articulated") {
        totalCapacityAB += parameters.articulated.capacity
        routeAbCapacity += parameters.articulated.capacity
      }
    })

    routeSchedules[route.routeNo].scheduleBA.forEach((trip) => {
      if (trip.busType === "minibus") {
        totalCapacityBA += parameters.minibus.capacity
        routeBaCapacity += parameters.minibus.capacity
      } else if (trip.busType === "solo") {
        totalCapacityBA += parameters.solo.capacity
        routeBaCapacity += parameters.solo.capacity
      } else if (trip.busType === "articulated") {
        totalCapacityBA += parameters.articulated.capacity
        routeBaCapacity += parameters.articulated.capacity
      }
    })

    // Her hat için kapasite yeterli mi kontrol et
    const abSufficient = routeAbCapacity >= route.peakPassengersAtoB
    const baSufficient = routeBaCapacity >= route.peakPassengersBtoA

    // Kapasite kullanım oranlarını hesapla
    const abCapacityUtilization = routeAbCapacity > 0 ? (route.peakPassengersAtoB / routeAbCapacity) * 100 : 0
    const baCapacityUtilization = routeBaCapacity > 0 ? (route.peakPassengersBtoA / routeBaCapacity) * 100 : 0

    // Yetersiz kapasite durumunda kaç ek sefer gerektiğini hesapla
    // En yüksek kapasiteli otobüs tipini bul
    let bestBusCapacity = Math.max(
      parameters.minibus.capacity,
      Math.max(parameters.solo.capacity, parameters.articulated.capacity),
    )

    // Eğer mevcut seferlerde kullanılan otobüs tipleri varsa, onları tercih et
    const usedBusTypes = new Set<"minibus" | "solo" | "articulated">()

    routeSchedules[route.routeNo].scheduleAB.forEach((trip) => {
      if (trip.busType) usedBusTypes.add(trip.busType)
    })

    routeSchedules[route.routeNo].scheduleBA.forEach((trip) => {
      if (trip.busType) usedBusTypes.add(trip.busType)
    })

    // Kullanılan otobüs tipleri arasından en yüksek kapasitelisini seç
    if (usedBusTypes.size > 0) {
      if (usedBusTypes.has("articulated")) bestBusCapacity = parameters.articulated.capacity
      else if (usedBusTypes.has("solo")) bestBusCapacity = parameters.solo.capacity
      else if (usedBusTypes.has("minibus")) bestBusCapacity = parameters.minibus.capacity
    }

    const abAdditionalTripsNeeded = abSufficient
      ? 0
      : Math.ceil((route.peakPassengersAtoB - routeAbCapacity) / bestBusCapacity)
    const baAdditionalTripsNeeded = baSufficient
      ? 0
      : Math.ceil((route.peakPassengersBtoA - routeBaCapacity) / bestBusCapacity)

    routeCapacityCheck[route.routeNo] = {
      abCapacity: routeAbCapacity,
      baCapacity: routeBaCapacity,
      abPassengers: route.peakPassengersAtoB,
      baPassengers: route.peakPassengersBtoA,
      abSufficient,
      baSufficient,
      abAdditionalTripsNeeded,
      baAdditionalTripsNeeded,
      abCapacityUtilization,
      baCapacityUtilization,
    }

    console.log(
      `Route ${route.routeNo} capacity check: A->B: ${routeAbCapacity}/${route.peakPassengersAtoB} (${abSufficient ? "OK" : "INSUFFICIENT"}, ${abCapacityUtilization.toFixed(1)}% utilization), B->A: ${routeBaCapacity}/${route.peakPassengersBtoA} (${baSufficient ? "OK" : "INSUFFICIENT"}, ${baCapacityUtilization.toFixed(1)}% utilization)`,
    )
  })

  console.log(
    `Total capacity: A->B: ${totalCapacityAB}/${totalPassengersAB}, B->A: ${totalCapacityBA}/${totalPassengersBA}`,
  )

  // Yetersiz kapasite durumunda otomatik düzeltme yap
  let additionalTripsAdded = false

  for (const [routeNo, check] of Object.entries(routeCapacityCheck)) {
    const route = routes.find((r) => r.routeNo === routeNo)
    if (!route) continue

    // A->B yönü için ek seferler ekle
    if (check.abAdditionalTripsNeeded > 0) {
      console.log(`Adding ${check.abAdditionalTripsNeeded} additional A->B trips for route ${routeNo}`)

      // Mevcut seferlerde kullanılan otobüs tiplerini belirle
      const usedBusTypes = new Set<"minibus" | "solo" | "articulated">()

      routeSchedules[routeNo].scheduleAB.forEach((trip) => {
        if (trip.busType) usedBusTypes.add(trip.busType)
      })

      // Tercih edilecek otobüs tipini belirle (mevcut seferlerde en çok kullanılan tip)
      let preferredBusType: "minibus" | "solo" | "articulated" = "solo" // Varsayılan

      if (usedBusTypes.has("articulated")) preferredBusType = "articulated"
      else if (usedBusTypes.has("solo")) preferredBusType = "solo"
      else if (usedBusTypes.has("minibus")) preferredBusType = "minibus"

      for (let i = 0; i < check.abAdditionalTripsNeeded; i++) {
        // Mevcut seferlerin arasına yeni seferler ekle
        const existingTrips = routeSchedules[routeNo].scheduleAB.length
        const departureTime =
          startTime +
          Math.floor(((existingTrips + i + 0.5) * timeRangeMinutes) / (existingTrips + check.abAdditionalTripsNeeded))

        // Uygun bir otobüs bul veya yeni bir otobüs oluştur
        let selectedBus: Bus | null = null

        // Önce mevcut otobüsler arasında uygun olanı bul
        for (const bus of buses) {
          if (
            bus.location === "A" &&
            bus.availableAt <= departureTime &&
            bus.trips < 5 &&
            bus.type === preferredBusType
          ) {
            // maxInterlining 0 ise, otobüs sadece kendi hattında çalışabilir
            if (maxInterlining === 0) {
              if (bus.routes.size === 0 || bus.routes.has(routeNo)) {
                selectedBus = bus
                break
              }
            } else {
              selectedBus = bus
              break
            }
          }
        }

        // Tercih edilen tipte otobüs bulunamazsa, herhangi bir uygun otobüsü seç
        if (!selectedBus) {
          for (const bus of buses) {
            if (bus.location === "A" && bus.availableAt <= departureTime && bus.trips < 5) {
              // maxInterlining 0 ise, otobüs sadece kendi hattında çalışabilir
              if (maxInterlining === 0) {
                if (bus.routes.size === 0 || bus.routes.has(routeNo)) {
                  selectedBus = bus
                  break
                }
              } else {
                selectedBus = bus
                break
              }
            }
          }
        }

        // Uygun otobüs bulunamazsa yeni bir otobüs oluştur
        if (!selectedBus) {
          let newBusId: string
          const newBusType = preferredBusType

          if (preferredBusType === "minibus") {
            newBusId = `Midibüs-${busIdCounter.minibus++}`
          } else if (preferredBusType === "solo") {
            newBusId = `Solo-${busIdCounter.solo++}`
          } else {
            newBusId = `Körüklü-${busIdCounter.articulated++}`
          }

          selectedBus = {
            id: newBusId,
            location: "A",
            availableAt: startTime,
            trips: 0,
            type: newBusType,
            routes: new Set<string>(),
          }
          buses.push(selectedBus)
        }

        // Otobüsü sefere ata
        selectedBus.location = "B"
        selectedBus.availableAt = departureTime + route.travelTimeAtoB
        selectedBus.trips++
        selectedBus.routes.add(routeNo)

        // Çizelgeye ekle
        const tripTime = minutesToTime(departureTime)

        scheduleAB.push({
          time: tripTime,
          busId: selectedBus.id,
          busType: selectedBus.type,
          routeNo: routeNo,
        })

        routeSchedules[routeNo].scheduleAB.push({
          time: tripTime,
          busId: selectedBus.id,
          busType: selectedBus.type,
        })

        additionalTripsAdded = true
      }
    }

    // B->A yönü için ek seferler ekle
    if (check.baAdditionalTripsNeeded > 0) {
      console.log(`Adding ${check.baAdditionalTripsNeeded} additional B->A trips for route ${routeNo}`)

      // Mevcut seferlerde kullanılan otobüs tiplerini belirle
      const usedBusTypes = new Set<"minibus" | "solo" | "articulated">()

      routeSchedules[routeNo].scheduleBA.forEach((trip) => {
        if (trip.busType) usedBusTypes.add(trip.busType)
      })

      // Tercih edilecek otobüs tipini belirle (mevcut seferlerde en çok kullanılan tip)
      let preferredBusType: "minibus" | "solo" | "articulated" = "solo" // Varsayılan

      if (usedBusTypes.has("articulated")) preferredBusType = "articulated"
      else if (usedBusTypes.has("solo")) preferredBusType = "solo"
      else if (usedBusTypes.has("minibus")) preferredBusType = "minibus"

      for (let i = 0; i < check.baAdditionalTripsNeeded; i++) {
        // Mevcut seferlerin arasına yeni seferler ekle
        const existingTrips = routeSchedules[routeNo].scheduleBA.length
        const departureTime =
          startTime +
          Math.floor(((existingTrips + i + 0.5) * timeRangeMinutes) / (existingTrips + check.baAdditionalTripsNeeded))

        // Uygun bir otobüs bul veya yeni bir otobüs oluştur
        let selectedBus: Bus | null = null

        // Önce mevcut otobüsler arasında uygun olanı bul
        for (const bus of buses) {
          if (
            bus.location === "B" &&
            bus.availableAt <= departureTime &&
            bus.trips < 5 &&
            bus.type === preferredBusType
          ) {
            // maxInterlining 0 ise, otobüs sadece kendi hattında çalışabilir
            if (maxInterlining === 0) {
              if (bus.routes.size === 0 || bus.routes.has(routeNo)) {
                selectedBus = bus
                break
              }
            } else {
              selectedBus = bus
              break
            }
          }
        }

        // Tercih edilen tipte otobüs bulunamazsa, herhangi bir uygun otobüsü seç
        if (!selectedBus) {
          for (const bus of buses) {
            if (bus.location === "B" && bus.availableAt <= departureTime && bus.trips < 5) {
              // maxInterlining 0 ise, otobüs sadece kendi hattında çalışabilir
              if (maxInterlining === 0) {
                if (bus.routes.size === 0 || bus.routes.has(routeNo)) {
                  selectedBus = bus
                  break
                }
              } else {
                selectedBus = bus
                break
              }
            }
          }
        }

        // Uygun otobüs bulunamazsa yeni bir otobüs oluştur
        if (!selectedBus) {
          let newBusId: string
          const newBusType = preferredBusType

          if (preferredBusType === "minibus") {
            newBusId = `Midibüs-${busIdCounter.minibus++}`
          } else if (preferredBusType === "solo") {
            newBusId = `Solo-${busIdCounter.solo++}`
          } else {
            newBusId = `Körüklü-${busIdCounter.articulated++}`
          }

          selectedBus = {
            id: newBusId,
            location: "B",
            availableAt: startTime,
            trips: 0,
            type: newBusType,
            routes: new Set<string>(),
          }
          buses.push(selectedBus)
        }

        // Otobüsü sefere ata
        selectedBus.location = "A"
        selectedBus.availableAt = departureTime + route.travelTimeBtoA
        selectedBus.trips++
        selectedBus.routes.add(routeNo)

        // Çizelgeye ekle
        const tripTime = minutesToTime(departureTime)

        scheduleBA.push({
          time: tripTime,
          busId: selectedBus.id,
          busType: selectedBus.type,
          routeNo: routeNo,
        })

        routeSchedules[routeNo].scheduleBA.push({
          time: tripTime,
          busId: selectedBus.id,
          busType: selectedBus.type,
        })

        additionalTripsAdded = true
      }
    }
  }

  // Ek seferler eklendiyse çizelgeleri yeniden sırala
  if (additionalTripsAdded) {
    scheduleAB.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
    scheduleBA.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))

    Object.keys(routeSchedules).forEach((routeNo) => {
      routeSchedules[routeNo].scheduleAB.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
      routeSchedules[routeNo].scheduleBA.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
    })

    // Otobüs kullanım kaydını güncelle
    for (const bus of buses) {
      if (bus.trips > 0) {
        busUtilization[bus.id] = { trips: bus.trips, busType: bus.type }
      }
    }
  }

  // Her hat için her iki yönde de en az bir sefer olup olmadığını kontrol et
  routes.forEach((route) => {
    const hasAB = routeSchedules[route.routeNo].scheduleAB.length > 0
    const hasBA = routeSchedules[route.routeNo].scheduleBA.length > 0

    if (!hasAB || !hasBA) {
      console.log(`Route ${route.routeNo} is missing trips in one direction: A->B: ${hasAB}, B->A: ${hasBA}`)
      // Eksik yönler için otomatik olarak sefer ekle
      if (!hasAB) {
        const departureTime = startTime + Math.floor(timeRangeMinutes / 2)
        const newBusId = `Midibüs-${busIdCounter.minibus++}`
        const newBus = {
          id: newBusId,
          location: "A",
          availableAt: startTime,
          trips: 1,
          type: "minibus" as const,
          routes: new Set<string>([route.routeNo]), // Bu hatta atanmış olarak başlat
        }
        buses.push(newBus)

        const tripTime = minutesToTime(departureTime)

        scheduleAB.push({
          time: tripTime,
          busId: newBusId,
          busType: "minibus",
          routeNo: route.routeNo,
        })

        routeSchedules[route.routeNo].scheduleAB.push({
          time: tripTime,
          busId: newBusId,
          busType: "minibus",
        })

        busUtilization[newBusId] = { trips: 1, busType: "minibus" }
      }

      if (!hasBA) {
        const departureTime = startTime + Math.floor(timeRangeMinutes / 2)
        const newBusId = `Midibüs-${busIdCounter.minibus++}`
        const newBus = {
          id: newBusId,
          location: "B",
          availableAt: startTime,
          trips: 1,
          type: "minibus" as const,
          routes: new Set<string>([route.routeNo]), // Bu hatta atanmış olarak başlat
        }
        buses.push(newBus)

        const tripTime = minutesToTime(departureTime)

        scheduleBA.push({
          time: tripTime,
          busId: newBusId,
          busType: "minibus",
          routeNo: route.routeNo,
        })

        routeSchedules[route.routeNo].scheduleBA.push({
          time: tripTime,
          busId: newBusId,
          busType: "minibus",
        })

        busUtilization[newBusId] = { trips: 1, busType: "minibus" }
      }
    }
  })

  // Aktif otobüsleri yeniden say
  activeBuses = buses.filter((bus) => bus.trips > 0)

  return {
    totalBuses: activeBuses.length,
    scheduleAB,
    scheduleBA,
    busUtilization,
    isFeasible: true, // Her zaman uygun olarak işaretle
    routeSchedules,
  }
}

// Helper function to convert time string to minutes
export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

// Helper function to convert minutes to time string
export function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}
