"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useBusOptimization } from "@/context/bus-optimization-context"
import { runOptimization } from "@/lib/optimization"
import OptimizingOverlay from "@/components/optimizing-overlay"
import InsufficientResourcesWarning from "@/components/insufficient-resources-warning"
import { ArrowRight, ArrowLeft } from "lucide-react"

export default function BusOptimizationTab() {
  const { routes, parameters, setResults, setKpis, isOptimizing, setIsOptimizing, setActiveStep } = useBusOptimization()

  const [showInsufficientWarning, setShowInsufficientWarning] = useState(false)
  const [startButtonHover, setStartButtonHover] = useState(false)

  const handleStartOptimization = async () => {
    if (routes.length === 0) {
      return
    }

    setIsOptimizing(true)
    setShowInsufficientWarning(false)

    // Simulate optimization delay
    setTimeout(() => {
      const startTime = performance.now()
      const { results, kpis, isFeasible } = runOptimization(routes, parameters)
      const endTime = performance.now()

      setResults(results)
      setKpis({
        ...kpis,
        optimizationTime: (endTime - startTime) / 1000,
      })

      setIsOptimizing(false)

      if (!isFeasible) {
        setShowInsufficientWarning(true)
      } else {
        // Move to the next step
        setActiveStep("scheduleOptimization")
      }
    }, 2000)
  }

  const closeWarning = () => {
    setShowInsufficientWarning(false)
  }

  const goBack = () => {
    setActiveStep("parameters")
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
          <h2 className="text-xl font-semibold">Otobüs Tipi Optimizasyonu</h2>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-blue-400/10 to-gray-400/20 p-[1px] shadow-md">
          <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Optimizasyon Adımı 1: Otobüs Tipi Belirleme</h3>

              <p className="text-muted-foreground">
                Bu adımda, her hat için en uygun otobüs tipi kombinasyonu belirlenecektir. Algoritma, yolcu talebini
                karşılarken toplam maliyeti (yakıt + bakım + amortisman + sürücü) minimize etmeye çalışacaktır.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                <h4 className="font-medium mb-2 text-blue-700 dark:text-blue-400">Optimizasyon Kriterleri:</h4>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Her hattın zirve saat yolcu sayısı karşılanmalıdır</li>
                  <li>Toplam maliyet (yakıt + bakım + amortisman + sürücü) minimize edilmelidir</li>
                  <li>Filodaki mevcut otobüs sayısı aşılmamalıdır</li>
                  <li>Karbon emisyonu hesaplanacak ve raporlanacaktır</li>
                </ul>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md">
                <h4 className="font-medium mb-2 text-amber-700 dark:text-amber-400">Optimizasyon Sonuçları:</h4>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Her hat için atanacak midibüs, solo ve körüklü otobüs sayısı</li>
                  <li>Her hat için maliyet detayları (yakıt, bakım, amortisman, sürücü)</li>
                  <li>Toplam maliyet ve kilometre/yolcu başına maliyet</li>
                  <li>Filo kullanım oranları ve kapasite kullanım yüzdeleri</li>
                  <li>Toplam karbon emisyonu ve çevresel etki analizi</li>
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
            disabled={routes.length === 0 || isOptimizing}
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
