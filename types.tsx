/**
 * =================================================================================
 * Proje Veri Tipleri (types.tsx)
 * =================================================================================
 * Bu dosya, 24 Saatlik Dinamik Toplu Taşıma Planlama ve Optimizasyon Sistemi'nin
 * tüm veri yapılarını, arayüzlerini ve tiplerini merkezi olarak tanımlar.
 * Bu, projenin "tek doğruluk kaynağıdır".
 */

// ---------------------------------------------------------------------------------
// 1. Parametreler ve Temel Konfigürasyon
// ---------------------------------------------------------------------------------

/** Bir otobüs tipinin (Midibüs, Solo, Körüklü) teknik ve maliyet özelliklerini tanımlar. */
export interface BusTypeParameters {
  capacity: number // Yolcu kapasitesi (kişi)
  fleetCount: number // Filoda bu tipten kaç adet olduğu
  fuelCost: number // Yakıt maliyeti (TL/km)
  maintenanceCost: number // Bakım maliyeti (TL/km)
  depreciationCost: number // Amortisman (yıpranma) maliyeti (TL/km)
  carbonEmission: number // Karbon emisyonu (kg CO2/km)
}

/** Uygulamanın genel operasyonel ve maliyet parametrelerini bir arada tutar. */
export interface BusParameters {
  minibus: BusTypeParameters
  solo: BusTypeParameters
  articulated: BusTypeParameters
  driver: {
    costPerHour: number // Bir şoförün saatlik maliyeti
  }
  operationStartTime: number // Operasyonun başlangıç saati (dakika olarak, örn: 04:00 -> 240)
  maxInterlining: number // Bir otobüsün hatlar arası geçiş için maksimum bekleme süresi (dakika)
}

// ---------------------------------------------------------------------------------
// 2. Hat Verileri ve Talep (CSV'den gelen yapı)
// ---------------------------------------------------------------------------------

/** Belirli bir saat dilimindeki tek yönlü yolcu talebini temsil eder. */
export interface HourlyDemand {
  hour: number // Günün saati (örn: 4, 15, 23)
  passengersAtoB: number // A -> B yönündeki yolcu sayısı
  passengersBtoA: number // B -> A yönündeki yolcu sayısı
}

/** Bir otobüs hattının tüm statik ve dinamik verilerini içerir. */
export interface RouteData {
  routeNo: string // Hat numarası (örn: "8", "25E")
  routeName: string // Hattın adı
  routeLengthAtoB: number // A -> B yönü hat uzunluğu (km)
  routeLengthBtoA: number // B -> A yönü hat uzunluğu (km)
  travelTimeAtoB: number // A -> B yönü parkur süresi (dakika)
  travelTimeBtoA: number // B -> A yönü parkur süresi (dakika)
  hourlyDemand: HourlyDemand[] // O hat için 24 saatlik talep verisi
}

// ---------------------------------------------------------------------------------
// 3. Optimizasyon Sonuçları
// ---------------------------------------------------------------------------------

/**
 * Bir otobüsün gerçekleştirdiği tek bir seferi (trip) tanımlar.
 * Operasyonel planlamanın en küçük birimidir.
 */
export interface Trip {
  tripId: string // Sefer için benzersiz ID
  busId: string // Seferi yapan otobüsün benzersiz ID'si
  busType: "minibus" | "solo" | "articulated" // Otobüsün tipi
  routeNo: string // Seferin yapıldığı hat numarası
  direction: "AtoB" | "BtoA" // Seferin yönü
  startTime: number // Seferin başlangıç zamanı (operasyon başlangıcından itibaren dakika)
  endTime: number // Seferin bitiş zamanı (operasyon başlangıcından itibaren dakika)
}

/**
 * Stratejik Optimizasyon (lib/optimization.ts) sonucunda üretilen veri yapısı.
 * Sistemin geneli için en uygun filo kompozisyonunu belirtir.
 */
export interface StrategicResult {
  recommendedFleet: {
    minibus: number
    solo: number
    articulated: number
  }
  peakDemand: {
    hour: number // Sistemin en yoğun olduğu saat
    demand: number // O saatteki toplam talep
  }
}

/**
 * Operasyonel Optimizasyon (lib/schedule-optimization.ts) sonucunda üretilen veri yapısı.
 * 24 saatlik tüm sefer planını ve ilişkili istatistikleri içerir.
 */
export interface ScheduleResult {
  schedule: Trip[] // Oluşturulan tüm seferlerin listesi
  stats: {
    totalTrips: number // Toplam yapılan sefer sayısı
    totalDistance: number // Toplam kat edilen mesafe (km)
    totalOperatingTime: number // Otobüslerin yolda geçirdiği toplam süre (dakika)
    busUtilization: {
      [busId: string]: {
        trips: number
        totalTimeOnDuty: number // Otobüsün görevde olduğu toplam süre (dakika)
        routesServed: string[] // Hizmet verdiği hatların listesi
      }
    }
  }
}

/**
 * Uygulamanın finalde kullanıcıya sunduğu, tüm adımlardan gelen bilgileri
 * birleştiren birleşik sonuç veri yapısı.
 */
export interface CombinedOptimizationResult {
  strategicResult: StrategicResult
  scheduleResult: ScheduleResult
  kpi: KPIData
}

/** Hesaplanan anahtar performans göstergelerini (KPI) bir arada tutar. */
export interface KPIData {
  totalPassengers: number
  totalDistance: number // == scheduleResult.stats.totalDistance
  totalOperatingCost: number
  totalFuelCost: number
  totalMaintenanceCost: number
  totalDepreciationCost: number
  totalDriverCost: number
  costPerKm: number
  costPerPassenger: number
  totalCarbonEmission: number
  carbonPerPassenger: number
}
