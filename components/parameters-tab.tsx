"use client"

import { useState, useRef, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Upload,
  Bus,
  BusFront,
  UserCog,
  Info,
  Leaf,
  Users,
  Fuel,
  Wrench,
  TrendingDown,
  ArrowRight,
  RouteIcon,
  AlertCircle,
  Clock,
} from "lucide-react"
import { useBusOptimization, type RouteData, type HourlyDemand } from "@/context/bus-optimization-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { parse, ParseResult } from "papaparse"
import {
  BusParameters,
  StrategicResult,
  ScheduleResult,
  CombinedOptimizationResult,
  KPIData,
} from "@/types"
import { runStrategicOptimization } from "@/lib/optimization"
import { runScheduleOptimization } from "@/lib/schedule-optimization"
import { toast } from "sonner"

// CSV'den gelen bir satırın yapısını tanımlayan arayüz.
// Anahtarlar string, değerler de string veya undefined olabilir.
interface CsvRow {
  [key: string]: string | undefined;
}

export default function ParametersTab() {
  const {
    routeData,
    setRouteData,
    parameters,
    setParameters,
    setCombinedResults,
    setIsOptimizing,
    setActiveTab,
  } = useBusOptimization()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [startButtonHover, setStartButtonHover] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      toast.error("Dosya seçilmedi.")
      return
    }
    setCsvError(null)
    setIsUploading(true)

    parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result: ParseResult<CsvRow>) => {
        try {
          const parsedRoutes: RouteData[] = result.data.map((row: CsvRow) => {
            const hourlyDemand: HourlyDemand[] = []
            // Sütun başlıklarını dinamik olarak analiz et ve saatlik talepleri oluştur
            for (let hour = 4; hour < 28; hour++) {
              const realHour = hour % 24
              const nextHour = (hour + 1) % 24
              const hourString = `${String(realHour).padStart(2, "0")}:00–${String(nextHour).padStart(2, "0")}:00`

              const atobKey = `${hourString} A→B Yolcu Sayısı`
              const btoaKey = `${hourString} B→A Yolcu Sayısı`

              if (row[atobKey] && row[btoaKey]) {
                hourlyDemand.push({
                  hour: realHour,
                  passengersAtoB: parseInt(row[atobKey]!, 10) || 0,
                  passengersBtoA: parseInt(row[btoaKey]!, 10) || 0,
                })
              }
            }
            
            const routeNo = row["Hat No"]
            const routeName = row["Hat Adı"]
            const lengthAtoB = row["A→B Hat Uzunluğu (km)"]
            const lengthBtoA = row["B→A Hat Uzunluğu (km)"]
            const timeAtoB = row["A→B Parkur Süresi (dk)"]
            const timeBtoA = row["B→A Parkur Süresi (dk)"]

            if (!routeNo || hourlyDemand.length !== 24 || !routeName || !lengthAtoB || !lengthBtoA || !timeAtoB || !timeBtoA) {
              // Hatanın daha anlaşılır olması için hangi satırda olduğunu belirtelim.
              throw new Error(`CSV satırında eksik veya yanlış formatta veri. Satır: ${JSON.stringify(row)}`)
            }

            return {
              routeNo: routeNo,
              routeName: routeName,
              routeLengthAtoB: parseFloat(lengthAtoB.replace(',', '.')),
              routeLengthBtoA: parseFloat(lengthBtoA.replace(',', '.')),
              travelTimeAtoB: parseInt(timeAtoB, 10),
              travelTimeBtoA: parseInt(timeBtoA, 10),
              hourlyDemand,
            }
          })
          setRouteData(parsedRoutes)
          toast.success(`${parsedRoutes.length} hat başarıyla yüklendi.`)
        } catch (error: any) {
          console.error("CSV işleme hatası:", error)
          toast.error(`CSV dosyasını işlerken hata oluştu: ${error.message}`)
          setRouteData([])
        } finally {
          setIsUploading(false)
        }
      },
      error: (error: Error) => {
        console.error("PapaParse hatası:", error)
        toast.error(`Dosya okunamadı: ${error.message}`)
        setIsUploading(false)
      },
    })
  }

  const handleParameterChange = (
    busType: "minibus" | "solo" | "articulated" | "driver" | "operation",
    field: string,
    value: number | string,
  ) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return

    setParameters((prevParams: BusParameters) => {
      const newParams = { ...prevParams }
      if (busType === 'driver' || busType === 'operation') {
        // @ts-ignore
        newParams[busType][field] = numValue
      } else {
        // @ts-ignore
        newParams[busType][field] = numValue
      }
      return newParams
    })
  }

  const handleDriverCostChange = (value: number) => {
    // Prevent NaN values
    if (isNaN(value)) {
      value = 0
    }

    setParameters({
      ...parameters,
      driver: {
        costPerHour: value,
      },
    })
  }

  const handleStartOptimization = async () => {
    if (routeData.length === 0) {
      toast.error("Optimizasyonu başlatmak için lütfen önce bir talep dosyası yükleyin.")
      return
    }
    
    setIsOptimizing(true)
    setActiveTab("results") // Kullanıcıyı hemen sonuçlar sekmesine yönlendir

    await new Promise(resolve => setTimeout(resolve, 50))

    try {
      const strategicResult = runStrategicOptimization(routeData, parameters)
      const scheduleResult = runScheduleOptimization(strategicResult, routeData, parameters)
      const kpi = calculateKpis(strategicResult, scheduleResult, routeData, parameters)
      const combinedResults: CombinedOptimizationResult = { strategicResult, scheduleResult, kpi }
      
      setCombinedResults(combinedResults)
      toast.success("Optimizasyon başarıyla tamamlandı!")
    } catch (error: any) {
      console.error("Optimizasyon sırasında bir hata oluştu:", error)
      toast.error(`Optimizasyon başarısız oldu: ${error.message}`)
      setActiveTab("parameters")
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-5">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Değiştirilebilir Parametreler</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Midibüs Card */}
            <div className="rounded-lg bg-gradient-to-br from-gray-400/40 via-teal-400/20 to-gray-400/40 p-[1px] shadow-lg">
              <div className="rounded-lg bg-white/95 dark:bg-black/95 backdrop-blur-md p-4 h-full">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-teal-100 p-2 rounded-full">
                    <Bus className="h-5 w-5 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-medium">Midibüs</h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="minibus-capacity" className="text-sm flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-teal-600" />
                      Kapasite (Yolcu)
                    </Label>
                    <Input
                      id="minibus-capacity"
                      type="number"
                      value={isNaN(parameters.minibus.capacity) ? "" : parameters.minibus.capacity}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value)
                        handleParameterChange("minibus", "capacity", value)
                      }}
                      className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-teal-200 h-9 text-base transition-all focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-teal-400"
                      placeholder="60"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="minibus-fleet" className="text-sm flex items-center gap-1">
                      <Bus className="h-3.5 w-3.5 text-teal-600" />
                      Filodaki Sayısı
                    </Label>
                    <Input
                      id="minibus-fleet"
                      type="number"
                      value={isNaN(parameters.minibus.fleetCount) ? "" : parameters.minibus.fleetCount}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value)
                        handleParameterChange("minibus", "fleetCount", value)
                      }}
                      className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-teal-200 h-9 text-base transition-all focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-teal-400"
                      placeholder="600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="minibus-fuel" className="text-sm flex items-center gap-1">
                      <Fuel className="h-3.5 w-3.5 text-teal-600" />
                      Yakıt Maliyeti (TL/km)
                    </Label>
                    <Input
                      id="minibus-fuel"
                      type="number"
                      value={isNaN(parameters.minibus.fuelCost) ? "" : parameters.minibus.fuelCost}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                        handleParameterChange("minibus", "fuelCost", value)
                      }}
                      className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-teal-200 h-9 text-base transition-all focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-teal-400"
                      placeholder="16"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="minibus-maintenance" className="text-sm flex items-center gap-1">
                      <Wrench className="h-3.5 w-3.5 text-teal-600" />
                      Bakım Maliyeti (TL/km)
                    </Label>
                    <Input
                      id="minibus-maintenance"
                      type="number"
                      value={isNaN(parameters.minibus.maintenanceCost) ? "" : parameters.minibus.maintenanceCost}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                        handleParameterChange("minibus", "maintenanceCost", value)
                      }}
                      className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-teal-200 h-9 text-base transition-all focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-teal-400"
                      placeholder="2"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="minibus-depreciation" className="text-sm flex items-center gap-1">
                      <TrendingDown className="h-3.5 w-3.5 text-teal-600" />
                      Amortisman (TL/km)
                    </Label>
                    <Input
                      id="minibus-depreciation"
                      type="number"
                      value={isNaN(parameters.minibus.depreciationCost) ? "" : parameters.minibus.depreciationCost}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                        handleParameterChange("minibus", "depreciationCost", value)
                      }}
                      className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-teal-200 h-9 text-base transition-all focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-teal-400"
                      placeholder="3"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="minibus-carbon" className="text-sm flex items-center gap-1">
                      <Leaf className="h-3.5 w-3.5 text-green-600" />
                      Karbon Emisyonu (kg/km)
                    </Label>
                    <Input
                      id="minibus-carbon"
                      type="number"
                      step="0.01"
                      value={isNaN(parameters.minibus.carbonEmission) ? "" : parameters.minibus.carbonEmission}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                        handleParameterChange("minibus", "carbonEmission", value)
                      }}
                      className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-teal-200 h-9 text-base transition-all focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-teal-400"
                      placeholder="0.70"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Solo Otobüs Card */}
            <div className="rounded-lg bg-gradient-to-br from-gray-400/40 via-blue-400/20 to-gray-400/40 p-[1px] shadow-lg">
              <div className="rounded-lg bg-white/95 dark:bg-black/95 backdrop-blur-md p-4 h-full">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <BusFront className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium">Solo Otobüs</h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="solo-capacity" className="text-sm flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                      Kapasite (Yolcu)
                    </Label>
                    <Input
                      id="solo-capacity"
                      type="number"
                      value={isNaN(parameters.solo.capacity) ? "" : parameters.solo.capacity}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value)
                        handleParameterChange("solo", "capacity", value)
                      }}
                      className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-blue-200 h-9 text-base transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-blue-400"
                      placeholder="100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="solo-fleet" className="text-sm flex items-center gap-1">
                      <Bus className="h-3.5 w-3.5 text-blue-600" />
                      Filodaki Sayısı
                    </Label>
                    <Input
                      id="solo-fleet"
                      type="number"
                      value={isNaN(parameters.solo.fleetCount) ? "" : parameters.solo.fleetCount}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value)
                        handleParameterChange("solo", "fleetCount", value)
                      }}
                      className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-blue-200 h-9 text-base transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-blue-400"
                      placeholder="1400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="solo-fuel" className="text-sm flex items-center gap-1">
                      <Fuel className="h-3.5 w-3.5 text-blue-600" />
                      Yakıt Maliyeti (TL/km)
                    </Label>
                    <Input
                      id="solo-fuel"
                      type="number"
                      value={isNaN(parameters.solo.fuelCost) ? "" : parameters.solo.fuelCost}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                        handleParameterChange("solo", "fuelCost", value)
                      }}
                      className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-blue-200 h-9 text-base transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-blue-400"
                      placeholder="20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="solo-maintenance" className="text-sm flex items-center gap-1">
                      <Wrench className="h-3.5 w-3.5 text-blue-600" />
                      Bakım Maliyeti (TL/km)
                    </Label>
                    <Input
                      id="solo-maintenance"
                      type="number"
                      value={isNaN(parameters.solo.maintenanceCost) ? "" : parameters.solo.maintenanceCost}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                        handleParameterChange("solo", "maintenanceCost", value)
                      }}
                      className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-blue-200 h-9 text-base transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-blue-400"
                      placeholder="3"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="solo-depreciation" className="text-sm flex items-center gap-1">
                      <TrendingDown className="h-3.5 w-3.5 text-blue-600" />
                      Amortisman (TL/km)
                    </Label>
                    <Input
                      id="solo-depreciation"
                      type="number"
                      value={isNaN(parameters.solo.depreciationCost) ? "" : parameters.solo.depreciationCost}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                        handleParameterChange("solo", "depreciationCost", value)
                      }}
                      className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-blue-200 h-9 text-base transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-blue-400"
                      placeholder="4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="solo-carbon" className="text-sm flex items-center gap-1">
                      <Leaf className="h-3.5 w-3.5 text-green-600" />
                      Karbon Emisyonu (kg/km)
                    </Label>
                    <Input
                      id="solo-carbon"
                      type="number"
                      step="0.01"
                      value={isNaN(parameters.solo.carbonEmission) ? "" : parameters.solo.carbonEmission}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                        handleParameterChange("solo", "carbonEmission", value)
                      }}
                      className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-blue-200 h-9 text-base transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-blue-400"
                      placeholder="1.1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Körüklü Otobüs Card */}
            <div className="rounded-lg bg-gradient-to-br from-gray-400/40 via-purple-400/20 to-gray-400/40 p-[1px] shadow-lg">
              <div className="rounded-lg bg-white/95 dark:bg-black/95 backdrop-blur-md p-4 h-full">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <div className="flex items-center">
                      <Bus className="h-5 w-5 text-purple-600" />
                      <div className="ml-[-2px] w-1.5 h-4 bg-purple-600 rounded-sm"></div>
                      <Bus className="h-4 w-4 text-purple-600 ml-[-2px]" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium">Körüklü Otobüs</h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="articulated-capacity" className="text-sm flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-purple-600" />
                      Kapasite (Yolcu)
                    </Label>
                    <Input
                      id="articulated-capacity"
                      type="number"
                      value={isNaN(parameters.articulated.capacity) ? "" : parameters.articulated.capacity}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value)
                        handleParameterChange("articulated", "capacity", value)
                      }}
                      className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-purple-200 h-9 text-base transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-purple-400"
                      placeholder="120"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="articulated-fleet" className="text-sm flex items-center gap-1">
                      <Bus className="h-3.5 w-3.5 text-purple-600" />
                      Filodaki Sayısı
                    </Label>
                    <Input
                      id="articulated-fleet"
                      type="number"
                      value={isNaN(parameters.articulated.fleetCount) ? "" : parameters.articulated.fleetCount}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value)
                        handleParameterChange("articulated", "fleetCount", value)
                      }}
                      className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-purple-200 h-9 text-base transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-purple-400"
                      placeholder="400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="articulated-fuel" className="text-sm flex items-center gap-1">
                      <Fuel className="h-3.5 w-3.5 text-purple-600" />
                      Yakıt Maliyeti (TL/km)
                    </Label>
                    <Input
                      id="articulated-fuel"
                      type="number"
                      value={isNaN(parameters.articulated.fuelCost) ? "" : parameters.articulated.fuelCost}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                        handleParameterChange("articulated", "fuelCost", value)
                      }}
                      className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-purple-200 h-9 text-base transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-purple-400"
                      placeholder="28"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="articulated-maintenance" className="text-sm flex items-center gap-1">
                      <Wrench className="h-3.5 w-3.5 text-purple-600" />
                      Bakım Maliyeti (TL/km)
                    </Label>
                    <Input
                      id="articulated-maintenance"
                      type="number"
                      value={
                        isNaN(parameters.articulated.maintenanceCost) ? "" : parameters.articulated.maintenanceCost
                      }
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                        handleParameterChange("articulated", "maintenanceCost", value)
                      }}
                      className="bg-white/50 dark:bg-black/90 backdrop-blur-sm border-purple-200 h-9 text-base transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-purple-400"
                      placeholder="4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="articulated-depreciation" className="text-sm flex items-center gap-1">
                      <TrendingDown className="h-3.5 w-3.5 text-purple-600" />
                      Amortisman (TL/km)
                    </Label>
                    <Input
                      id="articulated-depreciation"
                      type="number"
                      value={
                        isNaN(parameters.articulated.depreciationCost) ? "" : parameters.articulated.depreciationCost
                      }
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                        handleParameterChange("articulated", "depreciationCost", value)
                      }}
                      className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-purple-200 h-9 text-base transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-purple-400"
                      placeholder="6"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="articulated-carbon" className="text-sm flex items-center gap-1">
                      <Leaf className="h-3.5 w-3.5 text-green-600" />
                      Karbon Emisyonu (kg/km)
                    </Label>
                    <Input
                      id="articulated-carbon"
                      type="number"
                      step="0.01"
                      value={isNaN(parameters.articulated.carbonEmission) ? "" : parameters.articulated.carbonEmission}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                        handleParameterChange("articulated", "carbonEmission", value)
                      }}
                      className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-purple-200 h-9 text-base transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-purple-400"
                      placeholder="1.4"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sürücü Maliyeti Card */}
          <div className="mt-4 flex justify-center">
            <div className="rounded-lg bg-gradient-to-br from-gray-400/40 via-amber-400/20 to-gray-400/40 p-[1px] shadow-lg max-w-md w-full">
              <div className="rounded-lg bg-white/95 dark:bg-black/95 backdrop-blur-md p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <UserCog className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-medium">Sürücü Maliyeti</h3>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="driver-cost" className="text-sm flex items-center gap-1">
                    <UserCog className="h-3.5 w-3.5 text-amber-600" />
                    Sürücü Maliyeti (TL/km)
                  </Label>
                  <Input
                    id="driver-cost"
                    type="number"
                    value={isNaN(parameters.driver.costPerHour) ? "" : parameters.driver.costPerHour}
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                      handleDriverCostChange(value)
                    }}
                    className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-amber-200 h-9 text-base transition-all focus:ring-2 focus:ring-amber-500 focus:border-transparent hover:border-amber-400"
                    placeholder="10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Maksimum Interlining Card */}
          <div className="mt-4 flex justify-center">
            <div className="rounded-lg bg-gradient-to-br from-gray-400/40 via-indigo-400/20 to-gray-400/40 p-[1px] shadow-lg max-w-md w-full">
              <div className="rounded-lg bg-white/95 dark:bg-black/95 backdrop-blur-md p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <RouteIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-medium">Maksimum Interlining</h3>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="max-interlining" className="text-sm flex items-center gap-1">
                    <RouteIcon className="h-3.5 w-3.5 text-indigo-600" />
                    Otobüs Başına Maksimum Hat Sayısı
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Input
                            id="max-interlining"
                            type="number"
                            min="1"
                            max="10"
                            value={isNaN(parameters.maxInterlining) ? "" : parameters.maxInterlining}
                            onChange={(e) => {
                              const value = e.target.value === "" ? 1 : Number.parseInt(e.target.value)
                              // Minimum 1 olmalı
                              const finalValue = Math.max(1, value)
                              setParameters({
                                ...parameters,
                                maxInterlining: finalValue,
                              })
                            }}
                            className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-indigo-200 h-9 text-base transition-all focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-indigo-400 pr-8"
                            placeholder="1"
                          />
                          <AlertCircle className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-500/70" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                        <p>
                          Bir otobüsün çalıştırılabileceği maksimum hat sayısı. <br />1 seçilirse, her otobüs sadece bir
                          hatta çalıştırılabilir.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 mt-5">
          <h2 className="text-xl font-semibold">Hat Verileri Yükleme</h2>

          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-blue-400/10 to-gray-400/20 p-[1px] shadow-md">
              <div className="rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 h-10 px-4 text-sm transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
                      variant="outline"
                      disabled={isUploading}
                    >
                      <Upload size={16} />
                      CSV Dosyası Yükle
                    </Button>
                    {isUploading && (
                      <div className="absolute -bottom-2 left-0 w-full px-1">
                        <Progress value={uploadProgress} className="h-1.5 w-full" />
                      </div>
                    )}
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm p-3">
                      <p className="text-sm">CSV dosyası şu sütunları içermelidir:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-0.5 text-sm">
                        <li>Hat No</li>
                        <li>Hat Adı</li>
                        <li>A→B Hat Uzunluğu (km)</li>
                        <li>B→A Hat Uzunluğu (km)</li>
                        <li>A→B Parkur Süresi (dk)</li>
                        <li>B→A Parkur Süresi (dk)</li>
                        <li>A→B Yolcu Sayısı</li>
                        <li>B→A Yolcu Sayısı</li>
                      </ul>
                      <p className="mt-1 text-sm">Dosya UTF-8 formatında olmalıdır.</p>
                    </TooltipContent>
                  </Tooltip>

                  <Button
                    onClick={handleStartOptimization}
                    disabled={routeData.length === 0}
                    className={`px-5 h-10 text-sm transition-all duration-300 shadow-md rounded-md ${
                      startButtonHover
                        ? "bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 scale-105 shadow-lg"
                        : "bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500"
                    }`}
                    onMouseEnter={() => setStartButtonHover(true)}
                    onMouseLeave={() => setStartButtonHover(false)}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Optimizasyonu Başlat
                  </Button>

                  <div className="w-full mt-1">
                    <p className="text-xs text-muted-foreground">
                      Hat No, Hat Adı, A→B/B→A Hat Uzunluğu (km), A→B/B→A Parkur Süresi (dk), A→B/B→A Yolcu Sayısı
                      bilgilerini içeren CSV dosyası yükleyin.
                    </p>
                    {isUploading && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 animate-pulse">
                        Dosya yükleniyor...
                      </p>
                    )}
                    {csvError && <p className="text-xs text-destructive mt-0.5">{csvError}</p>}
                  </div>
                </div>
              </div>
            </div>

            {routeData.length > 0 && (
              <Card className="shadow-md overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                <CardHeader className="py-2 px-4 bg-gray-50 dark:bg-gray-900">
                  <CardTitle className="text-base">Yüklenen Hat Verileri</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[200px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow className="border-b border-gray-200 dark:border-gray-800">
                          <TableHead className="font-medium text-sm py-2">Hat No</TableHead>
                          <TableHead className="font-medium text-sm py-2">Hat Adı</TableHead>
                          <TableHead className="font-medium text-sm py-2">A→B Uzunluk (km)</TableHead>
                          <TableHead className="font-medium text-sm py-2">B→A Uzunluk (km)</TableHead>
                          <TableHead className="font-medium text-sm py-2">A→B Süre (dk)</TableHead>
                          <TableHead className="font-medium text-sm py-2">B→A Süre (dk)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {routeData.map((route, index) => (
                          <TableRow
                            key={index}
                            className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-b border-gray-100 dark:border-gray-800"
                          >
                            <TableCell className="font-medium py-1.5">{route.routeNo}</TableCell>
                            <TableCell className="py-1.5">{route.routeName}</TableCell>
                            <TableCell className="py-1.5">{route.routeLengthAtoB}</TableCell>
                            <TableCell className="py-1.5">{route.routeLengthBtoA}</TableCell>
                            <TableCell className="py-1.5">{route.travelTimeAtoB}</TableCell>
                            <TableCell className="py-1.5">{route.travelTimeBtoA}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-5">
          <Button
            onClick={handleStartOptimization}
            disabled={routeData.length === 0}
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
    </TooltipProvider>
  )
}

function calculateKpis(
    strategicResult: StrategicResult,
    scheduleResult: ScheduleResult,
    routes: RouteData[],
    parameters: BusParameters
): KPIData {
    let totalPassengers = 0;
    routes.forEach(route => {
        route.hourlyDemand.forEach(demand => {
            totalPassengers += demand.passengersAtoB + demand.passengersBtoA;
        });
    });

    let totalDistance = 0;
    let totalFuelCost = 0;
    let totalMaintenanceCost = 0;
    let totalDepreciationCost = 0;
    let totalOperatingMinutes = 0;
    let totalCarbonEmission = 0;

    const routeMap = new Map(routes.map(r => [r.routeNo, r]));

    scheduleResult.schedule.forEach(trip => {
        const route = routeMap.get(trip.routeNo);
        if (!route) return;

        const distance = trip.direction === "AtoB" ? route.routeLengthAtoB : route.routeLengthBtoA;
        totalDistance += distance;
        
        const busParams = parameters[trip.busType];
        totalFuelCost += distance * busParams.fuelCost;
        totalMaintenanceCost += distance * busParams.maintenanceCost;
        totalDepreciationCost += distance * busParams.depreciationCost;
        totalCarbonEmission += distance * busParams.carbonEmission;
        totalOperatingMinutes += trip.endTime - trip.startTime;
    });

    const totalDriverCost = (totalOperatingMinutes / 60) * parameters.driver.costPerHour;
    const totalOperatingCost = totalFuelCost + totalMaintenanceCost + totalDepreciationCost + totalDriverCost;
    
    return {
        totalPassengers,
        totalDistance,
        totalOperatingCost,
        totalFuelCost,
        totalMaintenanceCost,
        totalDepreciationCost,
        totalDriverCost,
        costPerKm: totalDistance > 0 ? totalOperatingCost / totalDistance : 0,
        costPerPassenger: totalPassengers > 0 ? totalOperatingCost / totalPassengers : 0,
        totalCarbonEmission,
        carbonPerPassenger: totalPassengers > 0 ? totalCarbonEmission / totalPassengers : 0
    }
}
