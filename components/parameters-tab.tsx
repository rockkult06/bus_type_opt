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
} from "lucide-react"
import { useBusOptimization } from "@/context/bus-optimization-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"

export default function ParametersTab() {
  const { routes, setRoutes, parameters, setParameters, setActiveStep } = useBusOptimization()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [startButtonHover, setStartButtonHover] = useState(false)

  // CSV dosyası yükleme fonksiyonunu güncelle
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvError(null)
    setIsUploading(true)
    setUploadProgress(0)
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string

        // Check for BOM (Byte Order Mark) and remove if present
        const cleanData = csvData.replace(/^\uFEFF/, "")

        // Split by newlines, handling both Windows and Unix line endings
        const lines = cleanData.split(/\r?\n/)

        // Check if we have data
        if (lines.length <= 1) {
          throw new Error("CSV dosyası boş veya geçersiz.")
        }

        // Parse the header to determine if we're using semicolons or commas
        const firstLine = lines[0]
        const separator = firstLine.includes(";") ? ";" : ","

        // Skip header row
        const parsedRoutes = lines
          .slice(1)
          .filter((line) => line.trim())
          .map((line) => {
            const values = line.split(separator).map((item) => item.trim())

            if (values.length < 8) {
              throw new Error("CSV formatı geçersiz. Tüm alanlar doldurulmalıdır.")
            }

            const [
              routeNo,
              routeName,
              routeLengthAtoB,
              routeLengthBtoA,
              travelTimeAtoB,
              travelTimeBtoA,
              peakPassengersAtoB,
              peakPassengersBtoA,
            ] = values

            if (
              !routeNo ||
              !routeName ||
              !routeLengthAtoB ||
              !routeLengthBtoA ||
              !travelTimeAtoB ||
              !travelTimeBtoA ||
              !peakPassengersAtoB ||
              !peakPassengersBtoA
            ) {
              throw new Error("CSV formatı geçersiz. Tüm alanlar doldurulmalıdır.")
            }

            return {
              routeNo,
              routeName,
              routeLengthAtoB: Number.parseFloat(routeLengthAtoB),
              routeLengthBtoA: Number.parseFloat(routeLengthBtoA),
              travelTimeAtoB: Number.parseInt(travelTimeAtoB),
              travelTimeBtoA: Number.parseInt(travelTimeBtoA),
              peakPassengersAtoB: Number.parseInt(peakPassengersAtoB),
              peakPassengersBtoA: Number.parseInt(peakPassengersBtoA),
            }
          })

        // Simulate a delay for the progress bar
        setTimeout(() => {
          setRoutes(parsedRoutes)
          setUploadProgress(100)
          setTimeout(() => {
            setIsUploading(false)
            setUploadProgress(0)
          }, 500)
        }, 1000)
      } catch (error) {
        setCsvError("CSV dosyası işlenirken bir hata oluştu. Lütfen formatı kontrol edin.")
        console.error(error)
        setIsUploading(false)
        setUploadProgress(0)
      }
    }

    // Use readAsText with UTF-8 encoding explicitly
    reader.readAsText(file, "UTF-8")
  }

  const handleParameterChange = (
    busType: "minibus" | "solo" | "articulated",
    field: "capacity" | "fuelCost" | "fleetCount" | "maintenanceCost" | "depreciationCost" | "carbonEmission",
    value: number,
  ) => {
    // Prevent NaN values
    if (isNaN(value)) {
      value = 0
    }

    setParameters({
      ...parameters,
      [busType]: {
        ...parameters[busType],
        [field]: value,
      },
    })
  }

  const handleDriverCostChange = (value: number) => {
    // Prevent NaN values
    if (isNaN(value)) {
      value = 0
    }

    setParameters({
      ...parameters,
      driverCost: value,
    })
  }

  const handleContinue = () => {
    if (routes.length === 0) {
      setCsvError("Lütfen önce CSV dosyası yükleyin.")
      return
    }

    // Move to the next step
    setActiveStep("busOptimization")
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
                    value={isNaN(parameters.driverCost) ? "" : parameters.driverCost}
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
                    onClick={handleContinue}
                    disabled={routes.length === 0}
                    className={`px-5 h-10 text-sm transition-all duration-300 shadow-md rounded-md ${
                      startButtonHover
                        ? "bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 scale-105 shadow-lg"
                        : "bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500"
                    }`}
                    onMouseEnter={() => setStartButtonHover(true)}
                    onMouseLeave={() => setStartButtonHover(false)}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Devam Et
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

            {routes.length > 0 && (
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
                          <TableHead className="font-medium text-sm py-2">A→B Yolcu</TableHead>
                          <TableHead className="font-medium text-sm py-2">B→A Yolcu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {routes.map((route, index) => (
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
                            <TableCell className="py-1.5">{route.peakPassengersAtoB}</TableCell>
                            <TableCell className="py-1.5">{route.peakPassengersBtoA}</TableCell>
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
            onClick={handleContinue}
            disabled={routes.length === 0}
            className={`px-6 py-2 text-base transition-all duration-300 shadow-md hover:shadow-lg rounded-md ${
              startButtonHover
                ? "bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 scale-105"
                : "bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500"
            }`}
            onMouseEnter={() => setStartButtonHover(true)}
            onMouseLeave={() => setStartButtonHover(false)}
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            Devam Et
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
