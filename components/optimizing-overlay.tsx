"use client"

import { Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

export default function OptimizingOverlay() {
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState("Veriler hazırlanıyor...")

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval)
          return 100
        }

        const increment = Math.random() * 10
        const newProgress = Math.min(prevProgress + increment, 100)

        // Update status text based on progress
        if (newProgress > 80) {
          setStatusText("Sonuçlar hazırlanıyor...")
        } else if (newProgress > 60) {
          setStatusText("Optimizasyon tamamlanıyor...")
        } else if (newProgress > 40) {
          setStatusText("Çözüm hesaplanıyor...")
        } else if (newProgress > 20) {
          setStatusText("Optimizasyon çalıştırılıyor...")
        }

        return newProgress
      })
    }, 200)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          <div className="relative">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
              {Math.round(progress)}%
            </div>
          </div>

          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">Optimizasyon Çalışıyor</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{statusText}</p>

          <div className="w-full mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Lütfen bekleyin, bu işlem birkaç saniye sürebilir...
          </p>
        </div>
      </div>
    </div>
  )
}
