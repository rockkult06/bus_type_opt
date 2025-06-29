"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBusOptimization } from "@/context/bus-optimization-context"
import { createSchedule } from "@/lib/schedule-optimization"
import OptimizingOverlay from "@/components/optimizing-overlay"
import InsufficientResourcesWarning from "@/components/insufficient-resources-warning"
import { ArrowRight, ArrowLeft, Clock, Sparkles } from "lucide-react"

export default function ScheduleOptimizationTab() {
  const {
    routes,
    results,
    parameters,
    scheduleParameters,
    setScheduleParameters,
    setScheduleResults,
    isOptimizing,
    setIsOptimizing,
    setActiveStep,
    scheduleResults,
  } = useBusOptimization()

  const [showInsufficientWarning, setShowInsufficientWarning] = useState(false)
  const [startButtonHover, setStartButtonHover] = useState(false)

  const handleStartOptimization = async () => {
    if (routes.length === 0 || results.length === 0) {
      return
    }

    setIsOptimizing(true)
    setShowInsufficientWarning(false)

    // Simulate optimization delay
    setTimeout(() => {
      const startTime = performance.now()

      // Burada parameters'ı doğrudan geçiriyoruz, böylece maxInterlining değeri korunur
      const result = createSchedule(results, scheduleParameters, routes, parameters)
      const endTime = performance.now()

      // Sonuçları ayarla
      setScheduleResults(result.scheduleResult)

      setIsOptimizing(false)

      // Yetersiz kaynak uyarısını gösterme, her zaman sonuçlar sayfasına git
      setActiveStep("results")
    }, 2000)
  }

  const closeWarning = () => {
    setShowInsufficientWarning(false)
  }

  const goBack = () => {
    setActiveStep("busOptimization")
  }

  return (
    <div className="space-y-6">
      {isOptimizing && <OptimizingOverlay />}
      {showInsufficientWarning && (
        <div onClick={closeWarning} className="cursor-pointer">
          <InsufficientResourcesWarning />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Sefer Çizelgesi Optimizasyonu</h2>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-blue-400/10 to-gray-400/20 p-[1px] shadow-md">
          <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Optimizasyon Adımı 2: Sefer Çizelgesi Oluşturma</h3>

              <p className="text-muted-foreground">
                Bu adımda, her hat için sefer çizelgeleri oluşturulacaktır. Algoritma, her iki yöndeki parkur sürelerini
                dikkate alarak, yolcu talebini karşılayacak şekilde sefer sıklıklarını belirleyecektir.
              </p>

              {/* Maksimum Interlining değerini göstermek için UI'a bir alan ekleyelim */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                <h4 className="font-medium mb-2 text-blue-700 dark:text-blue-400">Çizelge Parametreleri:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeRangeStart" className="text-sm">
                      Başlangıç Saati
                    </Label>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-blue-500" />
                      <Input
                        id="timeRangeStart"
                        type="time"
                        value={scheduleParameters.timeRange.start}
                        onChange={(e) =>
                          setScheduleParameters({
                            ...scheduleParameters,
                            timeRange: { ...scheduleParameters.timeRange, start: e.target.value },
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeRangeEnd" className="text-sm">
                      Bitiş Saati
                    </Label>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-blue-500" />
                      <Input
                        id="timeRangeEnd"
                        type="time"
                        value={scheduleParameters.timeRange.end}
                        onChange={(e) =>
                          setScheduleParameters({
                            ...scheduleParameters,
                            timeRange: { ...scheduleParameters.timeRange, end: e.target.value },
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {scheduleResults && scheduleResults.optimalInterlining !== undefined && (
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                  <div className="flex items-center">
                    <Sparkles className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="font-medium">Optimal Interlining Değeri:</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {scheduleResults.optimalInterlining}
                  </span>
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md">
                <h4 className="font-medium mb-2 text-amber-700 dark:text-amber-400">Çizelge Sonuçları:</h4>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Her hat için A→B ve B→A yönlerinde sefer çizelgeleri</li>
                  <li>Her seferin kalkış saati ve atanan otobüs tipi</li>
                  <li>Otobüs kullanım oranları ve sefer sayıları</li>
                  <li>Zaman çizelgesi görselleştirmesi</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button
            onClick={goBack}
            className="px-4 py-2 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>

          <Button
            onClick={handleStartOptimization}
            disabled={routes.length === 0 || results.length === 0 || isOptimizing}
            className={`px-6 py-2 text-base transition-all duration-300 shadow-md hover:shadow-lg rounded-md ${
              startButtonHover
                ? "bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 scale-105"
                : "bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500"
            }`}
            onMouseEnter={() => setStartButtonHover(true)}
            onMouseLeave={() => setStartButtonHover(false)}
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            Optimizasyonu Başlat
          </Button>
        </div>
      </div>
    </div>
  )
}
