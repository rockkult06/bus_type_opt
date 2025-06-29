"use client"

import { useState } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import ParametersTab from "@/components/parameters-tab"
import BusOptimizationTab from "@/components/bus-optimization-tab"
import ResultsTab from "@/components/results-tab"
import HelpTab from "@/components/help-tab"
import { BusOptimizationProvider, useBusOptimization } from "@/context/bus-optimization-context"

function MainContent() {
  const { activeTab, setActiveTab } = useBusOptimization()
  const [helpTabOpen, setHelpTabOpen] = useState(false)

  const handleTabChange = (value: string) => {
    if (value === "help") {
      setHelpTabOpen(true)
    } else {
      setHelpTabOpen(false)
      setActiveTab(value)
    }
  }

  return (
    <main className="container mx-auto px-4">
      <Card className="rounded-lg shadow-md">
        <CardContent className="pt-5">
          <Tabs value={helpTabOpen ? "help" : activeTab} onValueChange={handleTabChange}>
            <TabsContent value="parameters">
              <ParametersTab />
            </TabsContent>

            <TabsContent value="busOptimization">
              <BusOptimizationTab />
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
