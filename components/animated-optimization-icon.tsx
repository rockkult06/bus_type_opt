"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export function AnimatedOptimizationIcon({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()
  const [animationStep, setAnimationStep] = useState(0)

  // Ensure theme switch works properly with SSR
  useEffect(() => {
    setMounted(true)

    // Set up animation loop
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 4)
    }, 800)

    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    )
  }

  const isDark = theme === "dark"
  const primaryColor = isDark ? "#3b82f6" : "#2563eb" // blue-500 or blue-600
  const secondaryColor = isDark ? "#8b5cf6" : "#7c3aed" // purple-500 or purple-600
  const tertiaryColor = isDark ? "#14b8a6" : "#0d9488" // teal-500 or teal-600
  const backgroundColor = isDark ? "#1e293b" : "#f1f5f9" // slate-800 or slate-100

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Background circle */}
      <circle cx="12" cy="12" r="10" stroke="none" fill={backgroundColor} opacity="0.3" />

      {/* Optimization paths */}
      <path
        d={`M6 ${animationStep === 0 ? 10 : 12} L10 ${animationStep === 1 ? 8 : 10} L14 ${animationStep === 2 ? 12 : 14} L18 ${animationStep === 3 ? 10 : 12}`}
        stroke={primaryColor}
        strokeWidth="1.5"
        strokeDasharray={animationStep === 0 ? "1 1" : "0 0"}
      />

      {/* Data points */}
      <circle cx="6" cy={animationStep === 0 ? 10 : 12} r="1.5" fill={tertiaryColor} />
      <circle cx="10" cy={animationStep === 1 ? 8 : 10} r="1.5" fill={primaryColor} />
      <circle cx="14" cy={animationStep === 2 ? 12 : 14} r="1.5" fill={secondaryColor} />
      <circle cx="18" cy={animationStep === 3 ? 10 : 12} r="1.5" fill={tertiaryColor} />

      {/* Optimization indicator */}
      <path
        d="M7 19L12 16L17 19"
        stroke={secondaryColor}
        strokeWidth="1.5"
        strokeDasharray={animationStep % 2 === 0 ? "1 1" : "0 0"}
      />

      {/* Central node */}
      <circle cx="12" cy="12" r={2 + animationStep * 0.2} fill="none" stroke={primaryColor} strokeWidth="1.5" />
    </svg>
  )
}
