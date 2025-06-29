import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { BusOptimizationProvider } from "@/context/bus-optimization-context"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <title>Optimizasyon Platformu</title>
        <meta name="description" content="Modern ve inovatif optimizasyon platformu" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <BusOptimizationProvider>
            <Header />
            <div className="pt-24 pb-8">{children}</div>
          </BusOptimizationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
  generator: "v0.dev",
}

import "./globals.css"

import "./globals.css"

import "./globals.css"
