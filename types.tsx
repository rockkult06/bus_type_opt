/**
 * Temel Veri Tipleri
 * Bu dosya, tüm uygulama genelinde kullanılan temel TypeScript arayüzlerini ve tiplerini tanımlar.
 */

// 1. Otobüslerin ve Operasyonel Parametrelerin Tanımı
export interface BusTypeParameters {
  capacity: number // Yolcu kapasitesi
  fleetCount: number // Filodaki mevcut otobüs sayısı
  fuelCost: number // Yakıt maliyeti (TL/km)
  maintenanceCost: number // Bakım maliyeti (TL/km)
  depreciationCost: number // Amortisman maliyeti (TL/km)
  carbonEmission: number // Karbon emisyonu (kg/km)
}

export interface BusParameters {
  minibus: BusTypeParameters
  solo: BusTypeParameters
  articulated: BusTypeParameters
  driver: {
    costPerHour: number
  }
  operationStartTime: number // Operasyon başlangıç saati (04:00 = 240 dakika)
  maxInterlining: number // Bir otobüsün hizmet verebileceği maksimum farklı hat sayısı
}

// 2. Hat ve Talep Verilerinin Tanımı (CSV'den gelen veri)
export interface HourlyDemand {
  hour: number // Günün saati (örn: 4, 13, 23)
  passengersAtoB: number
  passengersBtoA: number
}

export interface RouteData {
  routeNo: string
  routeName: string
  routeLengthAtoB: number // A'dan B'ye hat uzunluğu (km)
  routeLengthBtoA: number // B'den A'ya hat uzunluğu (km)
  travelTimeAtoB: number // A'dan B'ye parkur süresi (dk)
  travelTimeBtoA: number // B'den A'ya parkur süresi (dk)
  hourlyDemand: HourlyDemand[]
}

// 3. Optimizasyon Sonuç Tipleri

// Stratejik Optimizasyon (lib/optimization.ts) Sonucu
export interface StrategicResult {
  recommendedFleet: {
    minibus: number
    solo: number
    articulated: number
  }
  totalCost: number // Bu, sadece karşılaştırma için kullanılan tahmini bir maliyettir
  peakDemand: {
    hour: number
    demand: number
  }
}

// Sefer Çizelgesi (lib/schedule-optimization.ts) Sonucu
export interface Trip {
  tripId: string
  busId: string
  busType: "minibus" | "solo" | "articulated"
  routeNo: string
  direction: "AtoB" | "BtoA"
  startTime: number // Operasyon başlangıcından itibaren dakika (örn: 04:00 -> 0)
  endTime: number // Operasyon başlangıcından itibaren dakika
}

export interface ScheduleResult {
  schedule: Trip[]
  stats: {
    totalTrips: number
    totalDistance: number // Toplam kat edilen mesafe (km)
    totalDuration: number // Toplam sefer süresi (dakika)
    busUtilization: {
      [busId: string]: {
        trips: number
        busType: "minibus" | "solo" | "articulated"
        routes: string[] // hizmet verilen hat numaraları
      }
    }
  }
}

// Sonuçlar sekmesinde kullanılacak birleşik KPI verisi
export interface KPIData {
  totalPassengers: number
  totalDistance: number
  totalFuelCost: number
  totalMaintenanceCost: number
  totalDepreciationCost: number
  totalDriverCost: number
  totalCost: number
  costPerKm: number
  costPerPassenger: number
  totalCarbonEmission: number
  carbonPerPassenger: number
  carbonSaved: number // Bu, gelecekteki bir özellik için yer tutucudur
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
