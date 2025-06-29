"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useBusOptimization } from "@/context/bus-optimization-context"
import { runStrategicOptimization } from "@/lib/optimization"
import { runScheduleOptimization } from "@/lib/schedule-optimization"
import OptimizingOverlay from "@/components/optimizing-overlay"
import { ArrowRight, ArrowLeft } from "lucide-react"

export default function BusOptimizationTab() {
  const {
    routeData,
    parameters,
    setStrategicResults,
    setScheduleResults,
    isOptimizing,
    setIsOptimizing,
    setActiveTab,
  } = useBusOptimization()

  const [statusText, setStatusText] = useState("Optimizasyon başlatılıyor...")

  const handleStartOptimization = async () => {
    if (routeData.length === 0) {
      return
    }

    setIsOptimizing(true)

    // --- Stratejik Optimizasyon ---
    setStatusText("1/2: En uygun filo kompozisyonu belirleniyor...")
    await new Promise(resolve => setTimeout(resolve, 500)) // UI update time
    const strategicResults = runStrategicOptimization(routeData, parameters)
    setStrategicResults(strategicResults)

    // --- Operasyonel Çizelgeleme Optimizasyonu ---
    setStatusText("2/2: 24 saatlik operasyonel sefer planı oluşturuluyor...")
    await new Promise(resolve => setTimeout(resolve, 500)) // UI update time
    const scheduleResults = runScheduleOptimization(strategicResults, routeData, parameters)
    setScheduleResults(scheduleResults)

    // --- Bitiş ---
    setStatusText("Optimizasyon tamamlandı! Sonuçlar yükleniyor...")
    await new Promise(resolve => setTimeout(resolve, 1000)) // allow user to read final status

    setIsOptimizing(false)
    setActiveTab("results")
  }

  const goBack = () => {
    setActiveTab("parameters")
  }

  return (
    <div className="space-y-6">
      {isOptimizing && <OptimizingOverlay statusText={statusText} />}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Optimizasyon Süreci</h2>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">İki Aşamalı Optimizasyon</h3>

              <p className="text-muted-foreground">
                Optimizasyon süreci, en verimli ve düşük maliyetli çözümü bulmak için iki ana adımdan oluşur:
              </p>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 p-4 border rounded-lg bg-muted/40">
                  <h4 className="font-semibold mb-2 text-primary">1. Stratejik Filo Belirleme</h4>
                  <p className="text-sm text-muted-foreground">
                    İlk olarak, 24 saatlik yolcu talebi verileri analiz edilir. Sistemin en yoğun olduğu "zirve an"
                    tespit edilir ve bu talebi en düşük maliyetle karşılayacak olan ideal otobüs tipi (Minibüs,
                    Solo, Körüklü) kompozisyonu belirlenir. Bu adım, "kaç tane hangi tip otobüse ihtiyacımız var?"
                    sorusunu cevaplar.
                  </p>
                </div>

                <div className="flex-1 p-4 border rounded-lg bg-muted/40">
                  <h4 className="font-semibold mb-2 text-primary">2. Operasyonel Sefer Planlama</h4>
                  <p className="text-sm text-muted-foreground">
                    Stratejik adımda belirlenen bu optimize edilmiş filo kullanılarak, 24 saatlik operasyon için
                    detaylı bir sefer çizelgesi oluşturulur. Bu adımda, her bir otobüsün hangi hatta, hangi saatte,
                    hangi yönde görev yapacağı planlanır. Amaç, belirlenen filoyu gün boyunca en verimli şekilde
                    kullanmaktır.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button onClick={goBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>

          <Button
            onClick={handleStartOptimization}
            disabled={routeData.length === 0 || isOptimizing}
            className="bg-green-600 hover:bg-green-700 text-white font-bold"
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            Optimizasyonu Başlat
          </Button>
        </div>
      </div>
    </div>
  )
}
