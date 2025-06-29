import type { RouteData, BusParameters, StrategicResult } from "@/types"

/**
 * Stratejik Filo Optimizasyonu
 *
 * Bu fonksiyon, verilen tüm hatlardaki 24 saatlik talep verilerini analiz eder.
 * Sistemin tamamında, herhangi bir saatte oluşacak en yüksek anlık yolcu talebini (sistem tepe noktası) bulur.
 * Ardından, bu tepe noktasındaki talebi karşılayabilecek, mevcut filo kısıtları dahilinde
 * en düşük maliyetli otobüs (Minibüs, Solo, Körüklü) kombinasyonunu belirler.
 *
 * @param routes - Tüm hatların verilerini içeren dizi.
 * @param parameters - Otobüs tipleri ve operasyonel parametreler.
 * @returns - Önerilen filo kompozisyonunu ve tepe talep bilgilerini içeren bir `StrategicResult` nesnesi.
 */
export function runStrategicOptimization(
  routes: RouteData[],
  parameters: BusParameters,
): StrategicResult {
  let peakSystemDemand = 0
  let peakSystemHour = -1

  // 1. Tüm sistem için saatlik talep profilini oluştur
  const hourlySystemDemand: { [hour: number]: number } = {}
  for (const route of routes) {
    for (const demand of route.hourlyDemand) {
      const hour = demand.hour
      if (!hourlySystemDemand[hour]) {
        hourlySystemDemand[hour] = 0
      }
      // O saatteki, o hattaki en yoğun yönün talebini sistem talebine ekle.
      // Bu, iki yönün aynı anda farklı otobüslerle servis edileceği varsayımına dayanır.
      const maxDirectionalDemand = Math.max(demand.passengersAtoB, demand.passengersBtoA)
      hourlySystemDemand[hour] += maxDirectionalDemand
    }
  }

  // 2. Sistem tepe noktasını (en yoğun saati ve talebi) bul
  for (const hour in hourlySystemDemand) {
    if (hourlySystemDemand[hour] > peakSystemDemand) {
      peakSystemDemand = hourlySystemDemand[hour]
      peakSystemHour = parseInt(hour, 10)
    }
  }

  // 3. En düşük maliyetli filo kompozisyonunu bul (Kaba Kuvvet Optimizasyonu)
  const capacities = {
    minibus: parameters.minibus.capacity,
    solo: parameters.solo.capacity,
    articulated: parameters.articulated.capacity,
  }

  // Maliyetleri karşılaştırma için birim maliyet olarak alıyoruz.
  // Gerçekçi bir günlük maliyet değil, sadece tipler arası bir oran.
  const costs = {
    minibus:
      parameters.minibus.fuelCost +
      parameters.minibus.maintenanceCost +
      parameters.minibus.depreciationCost,
    solo:
      parameters.solo.fuelCost +
      parameters.solo.maintenanceCost +
      parameters.solo.depreciationCost,
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

  // Mevcut filoyu aşmayacak şekilde kombinasyonları dene
  for (let m = 0; m <= availableFleet.minibus; m++) {
    for (let s = 0; s <= availableFleet.solo; s++) {
      // Kalan talebi karşılamak için gereken körüklü otobüs sayısını hesapla
      const remainingDemand = peakSystemDemand - m * capacities.minibus - s * capacities.solo
      const articulatedNeeded = remainingDemand > 0 ? Math.ceil(remainingDemand / capacities.articulated) : 0

      // Eğer gereken körüklü sayısı filodakinden fazlaysa bu kombinasyon geçersiz
      if (articulatedNeeded > availableFleet.articulated) {
        continue
      }
      
      const a = articulatedNeeded

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
    peakDemand: {
      hour: peakSystemHour,
      demand: peakSystemDemand,
    },
  }
} 