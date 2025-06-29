"use client"

import { AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"

export default function InsufficientResourcesWarning() {
  return (
    <motion.div
      className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 15 }}
      >
        <div className="flex flex-col items-center">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
            <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>

          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">Yetersiz Kaynak Uyarısı</h3>

          <p className="mt-2 text-center text-gray-500 dark:text-gray-400">
            Mevcut filo büyüklüğü, tüm hatların talebini karşılamak için yeterli değil. Lütfen filo büyüklüğünü artırın
            veya yolcu talebini azaltın.
          </p>

          <div className="w-full mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-center">
            <button className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800/30 transition-colors">
              Tamam
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
