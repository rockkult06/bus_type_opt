"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

// Node class
class Node {
  x: number
  y: number
  size: number
  color: string
  pulsePhase: number
  pulseSpeed: number

  constructor(x: number, y: number, isDark: boolean) {
    this.x = x
    this.y = y
    this.size = 2 + Math.random() * 3
    this.color = isDark
      ? `rgba(${100 + Math.random() * 155}, ${150 + Math.random() * 105}, 255, 0.8)`
      : `rgba(${50 + Math.random() * 100}, ${100 + Math.random() * 155}, 255, 0.8)`
    this.pulsePhase = Math.random() * Math.PI * 2
    this.pulseSpeed = 0.03 + Math.random() * 0.02
  }

  update() {
    this.pulsePhase += this.pulseSpeed
    if (this.pulsePhase > Math.PI * 2) {
      this.pulsePhase -= Math.PI * 2
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const pulseSize = this.size * (1 + 0.3 * Math.sin(this.pulsePhase))

    // Glow effect
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, pulseSize * 3)
    gradient.addColorStop(0, this.color.replace("0.8", "0.3"))
    gradient.addColorStop(1, this.color.replace("0.8", "0"))

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(this.x, this.y, pulseSize * 3, 0, Math.PI * 2)
    ctx.fill()

    // Node
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2)
    ctx.fill()
  }
}

// Connection class
class Connection {
  nodeA: Node
  nodeB: Node
  width: number
  color: string
  dataPhase: number
  dataSpeed: number

  constructor(nodeA: Node, nodeB: Node, isDark: boolean) {
    this.nodeA = nodeA
    this.nodeB = nodeB
    this.width = 0.5 + Math.random() * 1
    this.color = isDark
      ? `rgba(${100 + Math.random() * 155}, ${150 + Math.random() * 105}, 255, 0.3)`
      : `rgba(${50 + Math.random() * 100}, ${100 + Math.random() * 155}, 255, 0.2)`
    this.dataPhase = Math.random() * Math.PI * 2
    this.dataSpeed = 0.02 + Math.random() * 0.03
  }

  update() {
    this.dataPhase += this.dataSpeed
    if (this.dataPhase > Math.PI * 2) {
      this.dataPhase -= Math.PI * 2
    }
  }

  draw(ctx: CanvasRenderingContext2D, isDark: boolean) {
    const dx = this.nodeB.x - this.nodeA.x
    const dy = this.nodeB.y - this.nodeA.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Line
    ctx.strokeStyle = this.color
    ctx.lineWidth = this.width
    ctx.beginPath()
    ctx.moveTo(this.nodeA.x, this.nodeA.y)
    ctx.lineTo(this.nodeB.x, this.nodeB.y)
    ctx.stroke()

    // Data packet
    const packetPosition = (Math.sin(this.dataPhase) + 1) / 2 // 0 to 1
    const packetX = this.nodeA.x + dx * packetPosition
    const packetY = this.nodeA.y + dy * packetPosition

    ctx.fillStyle = isDark ? "rgba(150, 220, 255, 0.8)" : "rgba(100, 180, 255, 0.8)"
    ctx.beginPath()
    ctx.arc(packetX, packetY, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function NetworkAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let nodes: Node[] = []
    let connections: Connection[] = []
    let isDark = theme === "dark"

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = Math.min(800, window.innerWidth * 0.8)
      canvas.height = Math.min(800, window.innerWidth * 0.8)
      initNetwork()
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()

    // Initialize network
    function initNetwork() {
      nodes = []
      connections = []

      // Create nodes in a circular pattern
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = Math.min(canvas.width, canvas.height) * 0.35

      // Central node
      nodes.push(new Node(centerX, centerY, isDark))

      // Outer nodes
      const nodeCount = 12
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        nodes.push(new Node(x, y, isDark))
      }

      // Middle layer nodes
      const middleNodeCount = 8
      const middleRadius = radius * 0.6
      for (let i = 0; i < middleNodeCount; i++) {
        const angle = (i / middleNodeCount) * Math.PI * 2 + Math.PI / middleNodeCount
        const x = centerX + Math.cos(angle) * middleRadius
        const y = centerY + Math.sin(angle) * middleRadius
        nodes.push(new Node(x, y, isDark))
      }

      // Create connections
      // Connect center to all middle nodes
      for (let i = nodeCount + 1; i < nodeCount + middleNodeCount + 1; i++) {
        connections.push(new Connection(nodes[0], nodes[i], isDark))
      }

      // Connect middle nodes to outer nodes
      for (let i = 0; i < middleNodeCount; i++) {
        const middleIndex = nodeCount + 1 + i
        const outerIndex1 = 1 + i
        const outerIndex2 = 1 + ((i + 1) % nodeCount)

        connections.push(new Connection(nodes[middleIndex], nodes[outerIndex1], isDark))
        connections.push(new Connection(nodes[middleIndex], nodes[outerIndex2], isDark))
      }

      // Add some random connections for complexity
      for (let i = 0; i < 5; i++) {
        const indexA = 1 + Math.floor(Math.random() * (nodes.length - 1))
        let indexB = 1 + Math.floor(Math.random() * (nodes.length - 1))
        while (indexB === indexA) {
          indexB = 1 + Math.floor(Math.random() * (nodes.length - 1))
        }

        connections.push(new Connection(nodes[indexA], nodes[indexB], isDark))
      }
    }

    // Animation loop
    function animate() {
      ctx!.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw connections
      connections.forEach((connection) => {
        connection.update()
        connection.draw(ctx!, isDark)
      })

      // Update and draw nodes
      nodes.forEach((node) => {
        node.update()
        node.draw(ctx!)
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    // Update colors when theme changes
    if (theme) {
      isDark = theme === "dark"

      nodes.forEach((node) => {
        node.color = isDark
          ? `rgba(${100 + Math.random() * 155}, ${150 + Math.random() * 105}, 255, 0.8)`
          : `rgba(${50 + Math.random() * 100}, ${100 + Math.random() * 155}, 255, 0.8)`
      })

      connections.forEach((connection) => {
        connection.color = isDark
          ? `rgba(${100 + Math.random() * 155}, ${150 + Math.random() * 105}, 255, 0.3)`
          : `rgba(${50 + Math.random() * 100}, ${100 + Math.random() * 155}, 255, 0.2)`
      })
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [theme])

  return <canvas ref={canvasRef} className="w-full max-w-[800px] h-auto" />
}
