"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

// Data flow class
class DataFlow {
  points: { x: number; y: number; size: number; speed: number; color: string }[]
  lines: { startIndex: number; endIndex: number; progress: number; speed: number; color: string }[]

  constructor(canvasWidth: number, canvasHeight: number, isDark: boolean) {
    this.points = []
    this.lines = []

    // Create points (nodes)
    const pointCount = 8
    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * Math.PI * 2
      const radius = 70
      const x = canvasWidth / 2 + Math.cos(angle) * radius
      const y = canvasHeight / 2 + Math.sin(angle) * radius

      this.points.push({
        x,
        y,
        size: 3 + Math.random() * 2,
        speed: 0.01 + Math.random() * 0.02,
        color: isDark
          ? `rgba(${100 + Math.random() * 155}, ${150 + Math.random() * 105}, 255, 0.8)`
          : `rgba(${50 + Math.random() * 100}, ${100 + Math.random() * 155}, 255, 0.8)`,
      })
    }

    // Add center point
    this.points.push({
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      size: 5,
      speed: 0.02,
      color: isDark ? "rgba(150, 200, 255, 0.9)" : "rgba(100, 150, 255, 0.9)",
    })

    // Create lines (connections)
    // Connect center to all other points
    const centerIndex = this.points.length - 1
    for (let i = 0; i < pointCount; i++) {
      this.lines.push({
        startIndex: centerIndex,
        endIndex: i,
        progress: Math.random(),
        speed: 0.005 + Math.random() * 0.01,
        color: isDark ? "rgba(150, 200, 255, 0.5)" : "rgba(100, 150, 255, 0.5)",
      })
    }

    // Connect points in a circle
    for (let i = 0; i < pointCount; i++) {
      this.lines.push({
        startIndex: i,
        endIndex: (i + 1) % pointCount,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.008,
        color: isDark ? "rgba(150, 200, 255, 0.3)" : "rgba(100, 150, 255, 0.3)",
      })
    }
  }

  update() {
    // Update lines
    this.lines.forEach((line) => {
      line.progress += line.speed
      if (line.progress > 1) {
        line.progress = 0
      }
    })
  }

  draw(ctx: CanvasRenderingContext2D, isDark: boolean) {
    // Draw lines
    this.lines.forEach((line) => {
      const startPoint = this.points[line.startIndex]
      const endPoint = this.points[line.endIndex]

      // Draw line
      ctx.strokeStyle = line.color
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(startPoint.x, startPoint.y)
      ctx.lineTo(endPoint.x, endPoint.y)
      ctx.stroke()

      // Draw data packet
      const x = startPoint.x + (endPoint.x - startPoint.x) * line.progress
      const y = startPoint.y + (endPoint.y - startPoint.y) * line.progress

      ctx.fillStyle = isDark ? "rgba(150, 220, 255, 0.8)" : "rgba(100, 180, 255, 0.8)"
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw points
    this.points.forEach((point) => {
      // Glow effect
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, point.size * 3)
      gradient.addColorStop(0, point.color.replace("0.8", "0.3"))
      gradient.addColorStop(1, point.color.replace("0.8", "0"))

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(point.x, point.y, point.size * 3, 0, Math.PI * 2)
      ctx.fill()

      // Point
      ctx.fillStyle = point.color
      ctx.beginPath()
      ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2)
      ctx.fill()
    })
  }
}

export function DataFlowAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let isDark = theme === "dark"

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = 300
      canvas.height = 200
    }

    resizeCanvas()

    const dataFlow = new DataFlow(canvas.width, canvas.height, isDark)

    // Animation loop
    function animate() {
      ctx!.clearRect(0, 0, canvas.width, canvas.height)

      dataFlow.update()
      dataFlow.draw(ctx!, isDark)

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    // Update colors when theme changes
    if (theme) {
      isDark = theme === "dark"
    }

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [theme])

  return <canvas ref={canvasRef} className="w-[300px] h-[200px]" />
}
