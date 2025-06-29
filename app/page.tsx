"use client"

import { useState } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import ParametersTab from "@/components/parameters-tab"
import BusOptimizationTab from "@/components/bus-optimization-tab"
import ScheduleOptimizationTab from "@/components/schedule-optimization-tab"
import ResultsTab from "@/components/results-tab"
import HelpTab from "@/components/help-tab"
import { BusOptimizationProvider, useBusOptimization } from "@/context/bus-optimization-context"

function MainContent() {
  const { activeStep, setActiveStep } = useBusOptimization()
  const [helpTabOpen, setHelpTabOpen] = useState(false)

  return (
    <main className="container mx-auto px-4">
      <Card className="rounded-lg shadow-md">
        <CardContent className="pt-5">
          <Tabs
            value={helpTabOpen ? "help" : activeStep}
            onValueChange={(value) => {
              if (value === "help") {
                setHelpTabOpen(true)
              } else {
                setHelpTabOpen(false)
                setActiveStep(value as any)
              }
            }}
          >
            <TabsContent value="parameters">
              <ParametersTab />
            </TabsContent>

            <TabsContent value="busOptimization">
              <BusOptimizationTab />
            </TabsContent>

            <TabsContent value="scheduleOptimization">
              <ScheduleOptimizationTab />
            </TabsContent>

            <TabsContent value="results">
              <ResultsTab />
            </TabsContent>

            <TabsContent value="help">
              <HelpTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  )
}

export default function Home() {
  return (
    <BusOptimizationProvider>
      <MainContent />
    </BusOptimizationProvider>
  )
}
