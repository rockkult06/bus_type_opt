import type {
  RouteData,
  BusParameters,
  StrategicResult,
  ScheduleResult,
  Trip,
} from "@/types"

/**
 * Otobüsün anlık durumunu ve planını yönetmek için kullanılan iç veri yapısı.
 */
interface VirtualBus {
  id: string
  type: "minibus" | "solo" | "articulated"
  capacity: number
  availableFrom: number // Otobüsün bir sonraki sefere başlayabileceği en erken zaman (dakika)
  currentLocation: "garage" | { routeNo: string; endPoint: "A" | "B" } // En son görevinin bittiği yer
}

/**
 * Operasyonel Sefer Optimizasyonu (24 Saatlik Çizelgeleme)
 *
 * Bu fonksiyon, stratejik olarak belirlenmiş filoyu kullanarak, 24 saatlik
 * dinamik yolcu talebine göre detaylı bir sefer çizelgesi oluşturur.
 * Zamanı ileriye doğru simüle eder, anlık talebe göre seferler oluşturur
 * ve müsait otobüsleri bu seferlere atar. Interlining (hat birleştirme)
 * mantığını kullanarak otobüslerin atıl kalma süresini azaltmayı hedefler.
 *
 * @param strategicResult - Stratejik optimizasyondan gelen önerilen filo.
 * @param routes - Tüm hatların statik ve dinamik verileri.
 * @param parameters - Otobüs tipleri ve operasyonel parametreler.
 * @returns - 24 saatlik tam sefer çizelgesi ve operasyonel istatistikleri içeren bir `ScheduleResult` nesnesi.
 */
export function runScheduleOptimization(
  strategicResult: StrategicResult,
  routes: RouteData[],
  parameters: BusParameters,
): ScheduleResult {
  // 1. Sanal Filoyu Oluştur
  const fleet: VirtualBus[] = []
  let busCounter = 0
  Object.entries(strategicResult.recommendedFleet).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) {
      const busType = type as "minibus" | "solo" | "articulated"
      fleet.push({
        id: `${busType.charAt(0).toUpperCase()}${++busCounter}`,
        type: busType,
        capacity: parameters[busType].capacity,
        availableFrom: parameters.operationStartTime, // 04:00'da müsait
        currentLocation: "garage",
      })
    }
  })

  // 2. Saatlik talebi daha kolay erişilebilir bir formata getir
  const demandByHour: { [hour: number]: { [routeNo: string]: { AtoB: number; BtoA: number } } } = {}
  routes.forEach(route => {
    route.hourlyDemand.forEach(demand => {
      if (!demandByHour[demand.hour]) demandByHour[demand.hour] = {}
      demandByHour[demand.hour][route.routeNo] = {
        AtoB: demand.passengersAtoB,
        BtoA: demand.passengersBtoA,
      }
    })
  })
    
  // 3. Zaman Simülasyonu ve Sefer Atama
  const schedule: Trip[] = []
  const operationDuration = 24 * 60 // 24 saat (dakika olarak)
  const simulationStartTime = parameters.operationStartTime

  // Her hat için o an bekleyen yolcu sayısını takip et
  const pendingPassengers: { [routeNo: string]: { AtoB: number; BtoA: number } } = {}
  routes.forEach(r => { pendingPassengers[r.routeNo] = { AtoB: 0, BtoA: 0 }})


  for (let currentTime = simulationStartTime; currentTime < simulationStartTime + operationDuration; currentTime++) {
    const currentHour = Math.floor((currentTime % (24 * 60)) / 60)

    // O anki saate ait talebi, bekleyen yolculara ekle (dakikaya bölerek)
    if (demandByHour[currentHour]) {
      routes.forEach(route => {
        const hourlyData = demandByHour[currentHour][route.routeNo]
        if (hourlyData) {
            pendingPassengers[route.routeNo].AtoB += hourlyData.AtoB / 60
            pendingPassengers[route.routeNo].BtoA += hourlyData.BtoA / 60
        }
      })
    }

    // Sefer ihtiyacını kontrol et ve otobüs ata
    routes.forEach(route => {
        const directions: ("AtoB" | "BtoA")[] = ["AtoB", "BtoA"];
        for (const direction of directions) {
            
            // Bu yönde bir sefer tetiklemek için yeterli yolcu birikti mi?
            // Geçici olarak bir otobüsün kapasitesinin %50'si dolunca sefer yapsın diyelim.
            // Bu mantık daha sonra geliştirilebilir.
            const tripTriggerThreshold = parameters.solo.capacity * 0.5; // Ortalama bir otobüsün yarısı

            if (pendingPassengers[route.routeNo][direction] >= tripTriggerThreshold) {
                // Sefer gerekiyor. Uygun bir otobüs bul.
                const bestBus = findBestAvailableBus(fleet, currentTime, route, direction, parameters.maxInterlining);

                if (bestBus) {
                    // Seferi oluştur ve otobüsü ata
                    const travelTime = direction === "AtoB" ? route.travelTimeAtoB : route.travelTimeBtoA;
                    const newTrip: Trip = {
                        tripId: `T-${schedule.length + 1}`,
                        busId: bestBus.id,
                        busType: bestBus.type,
                        routeNo: route.routeNo,
                        direction: direction,
                        startTime: currentTime,
                        endTime: currentTime + travelTime
                    };
                    schedule.push(newTrip);

                    // Atanan otobüsün durumunu güncelle
                    bestBus.availableFrom = newTrip.endTime + 5; // 5 dk mola
                    bestBus.currentLocation = { routeNo: route.routeNo, endPoint: direction === "AtoB" ? "B" : "A" };
                    
                    // Bekleyen yolcuları azalt
                    const passengersServed = Math.min(pendingPassengers[route.routeNo][direction], bestBus.capacity);
                    pendingPassengers[route.routeNo][direction] -= passengersServed;
                }
            }
        }
    });
  }


  // 4. İstatistikleri Hesapla
  // ... Bu kısım daha sonra detaylandırılacak. Şimdilik temel bir yapı döndürelim.
  const stats = {
      totalTrips: schedule.length,
      totalDistance: 0, // hesaplanacak
      totalOperatingTime: 0, // hesaplanacak
      busUtilization: {} // hesaplanacak
  }

  return { schedule, stats }
}


/**
 * Belirtilen görev için en uygun müsait otobüsü bulur.
 * Interlining'i de dikkate alır.
 */
function findBestAvailableBus(
    fleet: VirtualBus[],
    currentTime: number,
    targetRoute: RouteData,
    targetDirection: "AtoB" | "BtoA",
    maxInterliningTime: number
): VirtualBus | null {
    const availableBuses = fleet.filter(bus => bus.availableFrom <= currentTime);
    if (availableBuses.length === 0) return null;

    let bestBus: VirtualBus | null = null;
    let minCost = Infinity;

    for (const bus of availableBuses) {
        let cost = 0; // Maliyet = bekleme süresi + (varsa) hat değiştirme süresi

        // 1. Bekleme süresi maliyeti
        cost += currentTime - bus.availableFrom;

        // 2. Interlining maliyeti (eğer farklı bir hattaysa)
        // Bu basit bir implementasyon. Gerçekte garajlar arası mesafeler vs. gerekir.
        // Şimdilik, sadece aynı hatta değilse bir ceza puanı ekleyelim.
        if(bus.currentLocation !== "garage" && bus.currentLocation.routeNo !== targetRoute.routeNo){
            cost += maxInterliningTime; // Sabit bir hat değiştirme süresi maliyeti
        }

        if (cost < minCost) {
            minCost = cost;
            bestBus = bus;
        }
    }

    return bestBus;
} 