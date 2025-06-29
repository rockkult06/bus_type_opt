"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Clock,
  Bus,
  Calendar,
  Users,
  Timer,
  ArrowRight,
  BarChart2,
  Loader2,
  Sparkles,
  Sun,
  Moon,
  Route,
  AlertCircle,
  FileSpreadsheet,
  Home,
  BarChart,
  HelpCircle,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { DataFlowAnimation } from "@/components/data-flow-animation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function TransportPlanner() {
  const [timeRange, setTimeRange] = useState({ start: "07:00", end: "08:00" })
  const [busCapacity, setBusCapacity] = useState(100)
  const [passengerCountAB, setPassengerCountAB] = useState(500)
  const [passengerCountBA, setPassengerCountBA] = useState(490)
  const [routeDurationAB, setRouteDurationAB] = useState(50)
  const [routeDurationBA, setRouteDurationBA] = useState(45)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showTaskComplete, setShowTaskComplete] = useState(false)
  const { theme, setTheme } = useTheme()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const successAudioRef = useRef<HTMLAudioElement | null>(null)
  const [results, setResults] = useState<null | {
    frequencyAB: number
    frequencyBA: number
    tripsAB: number
    tripsBA: number
    totalBuses: number
    scheduleAB: Array<{ time: string; busId: string }>
    scheduleBA: Array<{ time: string; busId: string }>
    busUtilization: Record<string, { trips: number }>
  }>(null)
  const [optimizationScore, setOptimizationScore] = useState(0)

  // Ensure theme switch works properly with SSR
  useEffect(() => {
    setMounted(true)

    // Create audio elements for UI sounds
    audioRef.current = new Audio("/click.mp3")
    audioRef.current.volume = 0.2

    successAudioRef.current = new Audio("/success.mp3")
    successAudioRef.current.volume = 0.3

    return () => {
      if (audioRef.current) {
        audioRef.current = null
      }
      if (successAudioRef.current) {
        successAudioRef.current = null
      }
    }
  }, [])

  const resetForm = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((e) => console.log("Audio play failed:", e))
    }

    setTimeRange({ start: "07:00", end: "08:00" })
    setBusCapacity(100)
    setPassengerCountAB(500)
    setPassengerCountBA(490)
    setRouteDurationAB(50)
    setRouteDurationBA(45)
    setResults(null)
    setOptimizationScore(0)
  }

  // Function to get the bus color class based on the bus ID
  const getBusColorClass = (busId: string) => {
    // Extract the bus number from the ID (e.g., "Bus-1" -> 1)
    const busNumber = Number.parseInt(busId.split("-")[1], 10)
    // Use modulo to handle more than 10 buses
    const colorIndex = ((busNumber - 1) % 10) + 1
    return `bus-color-${colorIndex}`
  }

  const calculatePlan = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((e) => console.log("Audio play failed:", e))
    }

    setLoading(true)
    setOptimizationScore(0)

    // Simulate optimization progress
    const progressInterval = setInterval(() => {
      setOptimizationScore((prev) => {
        const newScore = prev + Math.random() * 10
        return newScore > 100 ? 100 : newScore
      })
    }, 100)

    // Simulate a short delay to show loading state
    setTimeout(() => {
      clearInterval(progressInterval)
      setOptimizationScore(100)

      // Convert time range to minutes for easier calculations
      const startTimeMinutes = timeToMinutes(timeRange.start)
      const endTimeMinutes = timeToMinutes(timeRange.end)
      const totalMinutes = endTimeMinutes - startTimeMinutes

      // Calculate minimum required trips based on passenger demand
      const minTripsAB = Math.ceil(passengerCountAB / busCapacity)
      const minTripsBA = Math.ceil(passengerCountBA / busCapacity)

      // Create a completely new schedule with a direct approach
      const result = createDirectSchedule(
        minTripsAB,
        minTripsBA,
        startTimeMinutes,
        endTimeMinutes,
        routeDurationAB,
        routeDurationBA,
      )

      // Calculate actual frequencies based on the final schedule
      const actualFrequencyAB =
        result.scheduleAB.length > 1 ? Math.round(totalMinutes / (result.scheduleAB.length - 1)) : totalMinutes

      const actualFrequencyBA =
        result.scheduleBA.length > 1 ? Math.round(totalMinutes / (result.scheduleBA.length - 1)) : totalMinutes

      setResults({
        frequencyAB: actualFrequencyAB,
        frequencyBA: actualFrequencyBA,
        tripsAB: result.scheduleAB.length,
        tripsBA: result.scheduleBA.length,
        totalBuses: result.totalBuses,
        scheduleAB: result.scheduleAB,
        scheduleBA: result.scheduleBA,
        busUtilization: result.busUtilization,
      })

      setLoading(false)

      // Play success sound and show task complete notification
      if (successAudioRef.current) {
        successAudioRef.current.play().catch((e) => console.log("Audio play failed:", e))
      }

      setShowTaskComplete(true)
      setTimeout(() => {
        setShowTaskComplete(false)
      }, 3000)
    }, 1500) // Simulate calculation taking 1.5s
  }

  // Direct approach to create a schedule with minimum buses
  const createDirectSchedule = (
    minTripsAB: number,
    minTripsBA: number,
    startTime: number,
    endTime: number,
    routeDurationAB: number,
    routeDurationBA: number,
  ) => {
    // Calculate total time available
    const totalMinutes = endTime - startTime

    // Calculate ideal spacing between trips
    const idealSpacingAB = totalMinutes / minTripsAB
    const idealSpacingBA = totalMinutes / minTripsBA

    // Create a timeline of all trips in both directions
    type Trip = {
      direction: "AB" | "BA"
      idealTime: number
      actualTime?: number
      busId?: string
    }

    const allTrips: Trip[] = []

    // Add A->B trips to timeline
    for (let i = 0; i < minTripsAB; i++) {
      allTrips.push({
        direction: "AB",
        idealTime: startTime + Math.round(i * idealSpacingAB),
      })
    }

    // Add B->A trips to timeline
    for (let i = 0; i < minTripsBA; i++) {
      allTrips.push({
        direction: "BA",
        idealTime: startTime + Math.round(i * idealSpacingBA),
      })
    }

    // Sort all trips by ideal time
    allTrips.sort((a, b) => a.idealTime - b.idealTime)

    // Bus type definition
    type Bus = {
      id: string
      location: "A" | "B"
      availableAt: number
      trips: number
    }

    // Start with just 2 buses, one at each location
    const buses: Bus[] = [
      { id: "Bus-1", location: "A", availableAt: startTime, trips: 0 },
      { id: "Bus-2", location: "B", availableAt: startTime, trips: 0 },
    ]

    // Function to find the best available bus for a trip
    const findBestBus = (direction: "AB" | "BA", time: number): { bus: Bus | null; availableAt: number } => {
      const requiredLocation = direction === "AB" ? "A" : "B"
      let bestBus: Bus | null = null
      let bestAvailableAt = Number.POSITIVE_INFINITY

      // First, check if any existing bus is available at the required location
      for (const bus of buses) {
        if (bus.location === requiredLocation && bus.availableAt <= bestAvailableAt) {
          bestBus = bus
          bestAvailableAt = bus.availableAt
        }
      }

      return { bus: bestBus, availableAt: bestAvailableAt }
    }

    // Function to add a new bus at a specific location
    const addNewBus = (location: "A" | "B"): Bus => {
      const newBus: Bus = {
        id: `Bus-${buses.length + 1}`,
        location,
        availableAt: startTime,
        trips: 0,
      }
      buses.push(newBus)
      return newBus
    }

    // Process each trip in the timeline
    for (const trip of allTrips) {
      // Find the best available bus for this trip
      const { bus, availableAt } = findBestBus(trip.direction, trip.idealTime)

      // If no suitable bus found or the best bus is available too late, add a new bus
      if (!bus || availableAt > trip.idealTime + idealSpacingAB / 2) {
        const newBus = addNewBus(trip.direction === "AB" ? "A" : "B")

        // Assign this bus to the trip
        trip.busId = newBus.id
        trip.actualTime = trip.idealTime

        // Update bus status
        newBus.location = trip.direction === "AB" ? "B" : "A"
        // Yöne göre doğru parkur süresini kullan
        newBus.availableAt = trip.idealTime + (trip.direction === "AB" ? routeDurationAB : routeDurationBA)
        newBus.trips++
      } else {
        // Assign the best available bus to this trip
        trip.busId = bus.id
        trip.actualTime = Math.max(trip.idealTime, availableAt)

        // Update bus status
        bus.location = trip.direction === "AB" ? "B" : "A"
        // Yöne göre doğru parkur süresini kullan
        bus.availableAt = trip.actualTime + (trip.direction === "AB" ? routeDurationAB : routeDurationBA)
        bus.trips++
      }
    }

    // Create final schedules
    const scheduleAB: Array<{ time: string; busId: string }> = []
    const scheduleBA: Array<{ time: string; busId: string }> = []

    for (const trip of allTrips) {
      if (trip.actualTime !== undefined && trip.busId !== undefined) {
        const scheduleItem = {
          time: minutesToTime(trip.actualTime),
          busId: trip.busId,
        }

        if (trip.direction === "AB") {
          scheduleAB.push(scheduleItem)
        } else {
          scheduleBA.push(scheduleItem)
        }
      }
    }

    // Sort schedules by time
    scheduleAB.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
    scheduleBA.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))

    // Create bus utilization record
    const busUtilization: Record<string, { trips: number }> = {}

    for (const bus of buses) {
      if (bus.trips > 0) {
        busUtilization[bus.id] = { trips: bus.trips }
      }
    }

    // Now, try to optimize by reducing the number of buses
    // We'll do this by trying to reassign trips from buses with few trips
    const optimizeBuses = () => {
      // Sort buses by number of trips (ascending)
      const sortedBuses = [...buses].sort((a, b) => a.trips - b.trips)

      // For each bus with few trips, try to reassign its trips
      for (const lowUsageBus of sortedBuses) {
        // Skip buses with no trips
        if (lowUsageBus.trips === 0) continue

        // Find all trips assigned to this bus
        const busTrips = allTrips.filter((trip) => trip.busId === lowUsageBus.id)

        // Try to reassign each trip
        let allReassigned = true

        for (const trip of busTrips) {
          let reassigned = false

          // Try to find another bus that could handle this trip
          for (const otherBus of buses) {
            if (otherBus.id === lowUsageBus.id) continue

            // Check if this bus could handle the trip
            // We need to simulate the bus's schedule

            // Create a copy of all trips for simulation
            const simTrips = allTrips.map((t) => ({ ...t }))

            // Remove this trip from the simulation
            const tripIndex = simTrips.findIndex(
              (t) => t.direction === trip.direction && t.actualTime === trip.actualTime && t.busId === lowUsageBus.id,
            )

            if (tripIndex >= 0) {
              simTrips.splice(tripIndex, 1)
            }

            // Reset bus simulation state
            const simBuses = buses.map((b) => ({ ...b, location: "A", availableAt: startTime, trips: 0 }))

            // Reassign the trip to the other bus
            const reassignedTrip = { ...trip, busId: otherBus.id }
            simTrips.push(reassignedTrip)

            // Sort trips by actual time
            simTrips.sort((a, b) => (a.actualTime || 0) - (b.actualTime || 0))

            // Simulate the schedule
            let validSchedule = true

            for (const simTrip of simTrips) {
              if (!simTrip.busId || !simTrip.actualTime) continue

              const simBus = simBuses.find((b) => b.id === simTrip.busId)
              if (!simBus) continue

              const requiredLocation = simTrip.direction === "AB" ? "A" : "B"

              // Check if the bus is at the right location and available
              if (simBus.location !== requiredLocation || simBus.availableAt > simTrip.actualTime) {
                validSchedule = false
                break
              }

              // Update bus state
              simBus.location = simTrip.direction === "AB" ? "B" : "A"
              simBus.availableAt = simTrip.actualTime + (simTrip.direction === "AB" ? routeDurationAB : routeDurationBA)
              simBus.trips++
            }

            if (validSchedule) {
              // This bus can handle the reassigned trip
              trip.busId = otherBus.id
              reassigned = true
              break
            }
          }

          if (!reassigned) {
            allReassigned = false
          }
        }

        // If all trips were reassigned, mark this bus as unused
        if (allReassigned) {
          lowUsageBus.trips = 0
        }
      }
    }

    // Run optimization
    optimizeBuses()

    // Count active buses
    const activeBuses = buses.filter((bus) => bus.trips > 0)

    // Update bus IDs to be sequential
    const busMap: Record<string, string> = {}
    activeBuses.forEach((bus, index) => {
      busMap[bus.id] = `Bus-${index + 1}`
    })

    // Update schedules with new bus IDs
    scheduleAB.forEach((trip) => {
      trip.busId = busMap[trip.busId] || trip.busId
    })

    scheduleBA.forEach((trip) => {
      trip.busId = busMap[trip.busId] || trip.busId
    })

    // Update bus utilization with new IDs
    const finalBusUtilization: Record<string, { trips: number }> = {}

    for (const [oldId, data] of Object.entries(busUtilization)) {
      const newId = busMap[oldId] || oldId
      if (newId in finalBusUtilization) {
        finalBusUtilization[newId].trips += data.trips
      } else {
        finalBusUtilization[newId] = { trips: data.trips }
      }
    }

    return {
      totalBuses: activeBuses.length,
      scheduleAB,
      scheduleBA,
      busUtilization: finalBusUtilization,
    }
  }

  // Helper function to convert time string to minutes
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  // Helper function to convert minutes to time string
  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60) % 24
    const mins = minutes % 60
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
  }

  // Function to export results to Excel (CSV format)
  const exportToExcel = () => {
    if (!results) return

    if (audioRef.current) {
      audioRef.current.play().catch((e) => console.log("Audio play failed:", e))
    }

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,"

    // Add header for A->B schedule
    csvContent += "A->B Seferleri\r\n"
    csvContent += "Sefer No,Saat,Otobüs\r\n"

    // Add A->B schedule data
    results.scheduleAB.forEach((trip, index) => {
      csvContent += `${index + 1},${trip.time},${trip.busId}\r\n`
    })

    // Add empty line
    csvContent += "\r\n"

    // Add header for B->A schedule
    csvContent += "B->A Seferleri\r\n"
    csvContent += "Sefer No,Saat,Otobüs\r\n"

    // Add B->A schedule data
    results.scheduleBA.forEach((trip, index) => {
      csvContent += `${index + 1},${trip.time},${trip.busId}\r\n`
    })

    // Add empty line
    csvContent += "\r\n"

    // Add bus utilization data
    csvContent += "Otobüs Kullanımı\r\n"
    csvContent += "Otobüs,Sefer Sayısı\r\n"

    Object.entries(results.busUtilization).forEach(([busId, data]) => {
      csvContent += `${busId},${data.trips}\r\n`
    })

    // Add summary data
    csvContent += "\r\n"
    csvContent += "Özet Bilgiler\r\n"
    csvContent += `Toplam Otobüs Sayısı,${results.totalBuses}\r\n`
    csvContent += `A->B Sefer Sıklığı,${results.frequencyAB} dakika\r\n`
    csvContent += `B->A Sefer Sıklığı,${results.frequencyBA} dakika\r\n`
    csvContent += `A->B Sefer Sayısı,${results.tripsAB}\r\n`
    csvContent += `B->A Sefer Sayısı,${results.tripsBA}\r\n`

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "sefer_plani.csv")
    document.body.appendChild(link)

    // Trigger download
    link.click()

    // Clean up
    document.body.removeChild(link)
  }

  if (!mounted) return null

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 transition-colors duration-500">
      {/* Task Complete Notification */}
      <AnimatePresence>
        {showTaskComplete && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-50 flex justify-center"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mt-4 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full shadow-lg flex items-center">
              <Sparkles className="mr-2 h-5 w-5" />
              <span>Optimizasyon tamamlandı!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <BarChart className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium text-gray-900 dark:text-gray-100">Sefer Planı Platformu</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="flex items-center space-x-1 text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Ana Sayfa</span>
              </Link>
              <Link
                href="/planner"
                className="flex items-center space-x-1 text-blue-500 dark:text-blue-400 font-medium"
              >
                <Bus className="h-4 w-4" />
                <span>Sefer Planlama</span>
              </Link>

              {/* Help Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                    <HelpCircle className="h-4 w-4" />
                    <span>Yardım</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl flex items-center text-gray-900 dark:text-gray-100">
                      <HelpCircle className="mr-2 h-5 w-5 text-blue-500" />
                      Sefer Planı Platformu Hakkında
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400 pt-2">
                      Platform amacı, algoritması ve özellikleri hakkında bilgiler
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 mt-4">
                    <div>
                      <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-2">Platform Amacı</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        Sefer Planı Platformu, toplu taşıma operatörlerinin sefer çizelgelerini optimize etmelerine
                        yardımcı olmak için tasarlanmıştır. Platform, yolcu talebine göre en verimli otobüs sayısını ve
                        sefer sıklığını hesaplar, böylece kaynakların etkin kullanımını sağlar.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-2">
                        Optimizasyon Algoritması
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        Platform, aşağıdaki adımları izleyen özel bir optimizasyon algoritması kullanır:
                      </p>
                      <ol className="list-decimal pl-5 mt-2 space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Yolcu talebine göre minimum sefer sayısını hesaplar</li>
                        <li>İdeal sefer aralıklarını belirler</li>
                        <li>Otobüslerin konumlarını ve müsaitlik durumlarını takip eder</li>
                        <li>Her sefer için en uygun otobüsü atar</li>
                        <li>Gerektiğinde yeni otobüs ekler</li>
                        <li>Az kullanılan otobüslerin seferlerini yeniden dağıtarak toplam otobüs sayısını azaltır</li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-2">Özellikler</h3>
                      <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Yolcu sayısı, otobüs kapasitesi ve zaman aralığı gibi parametreleri özelleştirme</li>
                        <li>Her iki yön için ayrı sefer çizelgeleri oluşturma</li>
                        <li>Otobüs kullanım analizleri</li>
                        <li>Sonuçları Excel formatında dışa aktarma</li>
                        <li>Koyu ve açık tema desteği</li>
                        <li>Sezgisel ve modern kullanıcı arayüzü</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-2">Nasıl Kullanılır?</h3>
                      <ol className="list-decimal pl-5 mt-2 space-y-2 text-gray-700 dark:text-gray-300">
                        <li>
                          Sol paneldeki parametreleri girin (zaman aralığı, otobüs kapasitesi, yolcu sayıları, parkur
                          süreleri)
                        </li>
                        <li>"Sefer Planı Oluştur" butonuna tıklayın</li>
                        <li>Sağ panelde oluşturulan sefer planını inceleyin</li>
                        <li>İsterseniz "Excel'e Aktar" butonu ile sonuçları dışa aktarın</li>
                      </ol>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 text-yellow-500 dark:hidden" />
              <Moon className="h-5 w-5 text-blue-400 hidden dark:block" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-24 px-4 font-sans transition-all duration-300 theme-transition">
        <motion.div
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            Sefer Çizelgesi Optimizasyonu
          </h1>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="frosted-glass modern-shadow border-0 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <CardTitle className="text-xl flex items-center text-gray-900 dark:text-gray-100">
                  <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                  Parametreler
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 font-medium">
                  Sefer planı oluşturmak için gerekli parametreleri girin
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 group">
                      <Label
                        htmlFor="timeStart"
                        className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors"
                      >
                        <Clock className="mr-2 h-4 w-4 text-blue-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                        Başlangıç Saati
                      </Label>
                      <div className="relative">
                        <Input
                          id="timeStart"
                          type="time"
                          value={timeRange.start}
                          onChange={(e) => setTimeRange({ ...timeRange, start: e.target.value })}
                          className="modern-input w-full focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/40 transition-all"
                        />
                        <div className="absolute inset-0 rounded-md pointer-events-none ring-0 group-focus-within:ring-2 group-focus-within:ring-blue-500/20 dark:group-focus-within:ring-blue-500/40 transition-all"></div>
                      </div>
                    </div>
                    <div className="space-y-2 group">
                      <Label
                        htmlFor="timeEnd"
                        className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors"
                      >
                        <Clock className="mr-2 h-4 w-4 text-blue-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                        Bitiş Saati
                      </Label>
                      <div className="relative">
                        <Input
                          id="timeEnd"
                          type="time"
                          value={timeRange.end}
                          onChange={(e) => setTimeRange({ ...timeRange, end: e.target.value })}
                          className="modern-input w-full focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/40 transition-all"
                        />
                        <div className="absolute inset-0 rounded-md pointer-events-none ring-0 group-focus-within:ring-2 group-focus-within:ring-blue-500/20 dark:group-focus-within:ring-blue-500/40 transition-all"></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 group">
                    <Label
                      htmlFor="busCapacity"
                      className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors"
                    >
                      <Bus className="mr-2 h-4 w-4 text-blue-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                      Otobüs Kapasitesi
                    </Label>
                    <div className="relative">
                      <Input
                        id="busCapacity"
                        type="number"
                        min="1"
                        value={busCapacity}
                        onChange={(e) => {
                          const value = e.target.value === "" ? "" : Number(e.target.value)
                          setBusCapacity(value === "" ? 100 : value)
                        }}
                        className="modern-input w-full focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/40 transition-all"
                      />
                      <div className="absolute inset-0 rounded-md pointer-events-none ring-0 group-focus-within:ring-2 group-focus-within:ring-blue-500/20 dark:group-focus-within:ring-blue-500/40 transition-all"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 group">
                      <Label
                        htmlFor="passengerCountAB"
                        className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors"
                      >
                        <Users className="mr-2 h-4 w-4 text-blue-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                        A → B Yolcu Sayısı
                      </Label>
                      <div className="relative">
                        <Input
                          id="passengerCountAB"
                          type="number"
                          min="1"
                          value={passengerCountAB}
                          onChange={(e) => {
                            const value = e.target.value === "" ? "" : Number(e.target.value)
                            setPassengerCountAB(value === "" ? 500 : value)
                          }}
                          className="modern-input w-full focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/40 transition-all"
                        />
                        <div className="absolute inset-0 rounded-md pointer-events-none ring-0 group-focus-within:ring-2 group-focus-within:ring-blue-500/20 dark:group-focus-within:ring-blue-500/40 transition-all"></div>
                      </div>
                    </div>
                    <div className="space-y-2 group">
                      <Label
                        htmlFor="passengerCountBA"
                        className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors"
                      >
                        <Users className="mr-2 h-4 w-4 text-blue-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                        B → A Yolcu Sayısı
                      </Label>
                      <div className="relative">
                        <Input
                          id="passengerCountBA"
                          type="number"
                          min="1"
                          value={passengerCountBA}
                          onChange={(e) => {
                            const value = e.target.value === "" ? "" : Number(e.target.value)
                            setPassengerCountBA(value === "" ? 490 : value)
                          }}
                          className="modern-input w-full focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/40 transition-all"
                        />
                        <div className="absolute inset-0 rounded-md pointer-events-none ring-0 group-focus-within:ring-2 group-focus-within:ring-blue-500/20 dark:group-focus-within:ring-blue-500/40 transition-all"></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 group">
                      <Label
                        htmlFor="routeDurationAB"
                        className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors"
                      >
                        <Timer className="mr-2 h-4 w-4 text-blue-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                        A → B Parkur Süresi (dk)
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              <Input
                                id="routeDurationAB"
                                type="number"
                                min="1"
                                value={routeDurationAB}
                                onChange={(e) => {
                                  const value = e.target.value === "" ? "" : Number(e.target.value)
                                  setRouteDurationAB(value === "" ? 50 : value)
                                }}
                                className="modern-input w-full pr-8 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/40 transition-all"
                              />
                              <AlertCircle className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500/70" />
                              <div className="absolute inset-0 rounded-md pointer-events-none ring-0 group-focus-within:ring-2 group-focus-within:ring-blue-500/20 dark:group-focus-within:ring-blue-500/40 transition-all"></div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                            <p>Otobüsün A'dan B'ye gidiş süresi</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="space-y-2 group">
                      <Label
                        htmlFor="routeDurationBA"
                        className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors"
                      >
                        <Timer className="mr-2 h-4 w-4 text-blue-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                        B → A Parkur Süresi (dk)
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              <Input
                                id="routeDurationBA"
                                type="number"
                                min="1"
                                value={routeDurationBA}
                                onChange={(e) => {
                                  const value = e.target.value === "" ? "" : Number(e.target.value)
                                  setRouteDurationBA(value === "" ? 45 : value)
                                }}
                                className="modern-input w-full pr-8 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/40 transition-all"
                              />
                              <AlertCircle className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500/70" />
                              <div className="absolute inset-0 rounded-md pointer-events-none ring-0 group-focus-within:ring-2 group-focus-within:ring-blue-500/20 dark:group-focus-within:ring-blue-500/40 transition-all"></div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                            <p>Otobüsün B'den A'ya dönüş süresi</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <Button
                      className="col-span-3 py-6 text-base font-medium bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-md hover:shadow-lg hover:shadow-blue-500/20 dark:hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      onClick={calculatePlan}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          <div className="relative">
                            <span className="opacity-0">Optimizasyon</span>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span>%{Math.round(optimizationScore)}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Sefer Planı Oluştur
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="py-6 text-base font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      onClick={resetForm}
                      disabled={loading}
                    >
                      Sıfırla
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {results ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="frosted-glass modern-shadow border-0 overflow-hidden transition-all duration-500 animate-fadeIn">
                <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl flex items-center text-gray-900 dark:text-gray-100">
                      <BarChart2 className="mr-2 h-5 w-5 text-blue-500" />
                      Sefer Planı Sonuçları
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                      onClick={exportToExcel}
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                      Excel'e Aktar
                    </Button>
                  </div>
                  <CardDescription className="text-gray-600 dark:text-gray-400 font-medium">
                    Hesaplanan sefer planı ve otobüs ihtiyacı
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div
                        className="frosted-glass-light p-3 rounded-md"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center font-medium">
                          <ArrowRight className="mr-2 h-4 w-4 text-blue-500" />A → B Sefer Sıklığı
                        </p>
                        <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mt-1">
                          {results.frequencyAB} dakika
                        </p>
                      </motion.div>
                      <motion.div
                        className="frosted-glass-light p-3 rounded-md"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center font-medium">
                          <ArrowRight className="mr-2 h-4 w-4 rotate-180 text-blue-500" />B → A Sefer Sıklığı
                        </p>
                        <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mt-1">
                          {results.frequencyBA} dakika
                        </p>
                      </motion.div>
                      <motion.div
                        className="frosted-glass-light p-3 rounded-md"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                      >
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center font-medium">
                          <Route className="mr-2 h-4 w-4 text-blue-500" />A → B Sefer Sayısı
                        </p>
                        <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mt-1">
                          {results.tripsAB} sefer
                        </p>
                      </motion.div>
                      <motion.div
                        className="frosted-glass-light p-3 rounded-md"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                      >
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center font-medium">
                          <Route className="mr-2 h-4 w-4 rotate-180 text-blue-500" />B → A Sefer Sayısı
                        </p>
                        <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mt-1">
                          {results.tripsBA} sefer
                        </p>
                      </motion.div>
                    </div>

                    <motion.div
                      className="frosted-glass-light p-3 rounded-md flex items-center justify-between"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Toplam Otobüs İhtiyacı</p>
                        <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                          {results.totalBuses} otobüs
                        </p>
                      </div>
                      <Bus className="h-8 w-8 text-blue-500" />
                    </motion.div>

                    <div className="divider"></div>

                    <Tabs defaultValue="schedules" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-6 custom-tabs">
                        <TabsTrigger value="schedules" className="custom-tab">
                          <Bus className="mr-2 h-4 w-4" />
                          Sefer Çizelgeleri
                        </TabsTrigger>
                        <TabsTrigger value="utilization" className="custom-tab">
                          <BarChart2 className="mr-2 h-4 w-4" />
                          Otobüs Kullanımı
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="schedules">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-base font-medium mb-3 flex items-center text-blue-600 dark:text-blue-400 p-2 rounded-md bg-blue-50 dark:bg-blue-900/20">
                              <ArrowRight className="mr-2 h-4 w-4 text-blue-500" />A → B Saat Planı
                            </h3>
                            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                              <Table>
                                <TableHeader className="bg-gray-50/90 dark:bg-gray-900/90">
                                  <TableRow>
                                    <TableHead className="font-medium">Sefer</TableHead>
                                    <TableHead className="font-medium">Saat</TableHead>
                                    <TableHead className="font-medium">Otobüs</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {results.scheduleAB.map((trip, index) => (
                                    <TableRow
                                      key={index}
                                      className={`${index % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-900/50" : ""} table-row-hover`}
                                    >
                                      <TableCell className="py-2 font-medium">{index + 1}</TableCell>
                                      <TableCell className="py-2 flex items-center">
                                        <Clock className="mr-2 h-4 w-4 text-blue-500" />
                                        {trip.time}
                                      </TableCell>
                                      <TableCell className="py-2 flex items-center">
                                        <div className="bus-icon">{trip.busId.split("-")[1]}</div>
                                        <span className={`px-2 py-1 rounded-md ${getBusColorClass(trip.busId)}`}>
                                          {trip.busId}
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-base font-medium mb-3 flex items-center text-blue-600 dark:text-blue-400 p-2 rounded-md bg-blue-50 dark:bg-blue-900/20">
                              <ArrowRight className="mr-2 h-4 w-4 rotate-180 text-blue-500" />B → A Saat Planı
                            </h3>
                            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                              <Table>
                                <TableHeader className="bg-gray-50/90 dark:bg-gray-900/90">
                                  <TableRow>
                                    <TableHead className="font-medium">Sefer</TableHead>
                                    <TableHead className="font-medium">Saat</TableHead>
                                    <TableHead className="font-medium">Otobüs</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {results.scheduleBA.map((trip, index) => (
                                    <TableRow
                                      key={index}
                                      className={`${index % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-900/50" : ""} table-row-hover`}
                                    >
                                      <TableCell className="py-2 font-medium">{index + 1}</TableCell>
                                      <TableCell className="py-2 flex items-center">
                                        <Clock className="mr-2 h-4 w-4 text-blue-500" />
                                        {trip.time}
                                      </TableCell>
                                      <TableCell className="py-2 flex items-center">
                                        <div className="bus-icon">{trip.busId.split("-")[1]}</div>
                                        <span className={`px-2 py-1 rounded-md ${getBusColorClass(trip.busId)}`}>
                                          {trip.busId}
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="utilization">
                        <div className="p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700">
                          <h3 className="text-base font-medium mb-5 text-blue-600 dark:text-blue-400">
                            Otobüs Başına Sefer Sayısı
                          </h3>
                          <div className="space-y-4">
                            {Object.entries(results.busUtilization).map(([busId, data], index) => (
                              <motion.div
                                key={index}
                                className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 * index }}
                              >
                                <div className="w-24 flex items-center">
                                  <div className="bus-icon">{busId.split("-")[1]}</div>
                                  <span className="font-medium">{busId}</span>
                                </div>
                                <div className="flex-1 ml-4">
                                  <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600 transition-all duration-500 flex items-center justify-end pr-3 text-sm text-white font-medium"
                                      initial={{ width: "0%" }}
                                      animate={{
                                        width: `${Math.max(5, (data.trips / (results.tripsAB + results.tripsBA)) * 100)}%`,
                                      }}
                                      transition={{ duration: 1, delay: 0.2 + 0.1 * index }}
                                    >
                                      {data.trips} sefer
                                    </motion.div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              className="flex items-center justify-center h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center">
                <DataFlowAnimation />
                <p className="text-gray-500 dark:text-gray-400 mt-6 text-center max-w-md">
                  Parametreleri girin ve "Sefer Planı Oluştur" butonuna tıklayarak optimum sefer planını hesaplayın.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
