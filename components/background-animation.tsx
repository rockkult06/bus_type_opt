"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

// Particle class
class Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  color: string

  constructor(canvasWidth: number, canvasHeight: number, isDark: boolean) {
    this.x = Math.random() * canvasWidth
    this.y = Math.random() * canvasHeight
    this.size = Math.random() * 2 + 0.5
    this.speedX = (Math.random() - 0.5) * 0.5
    this.speedY = (Math.random() - 0.5) * 0.5
    this.color = isDark
      ? `rgba(${100 + Math.random() * 155}, ${100 + Math.random() * 155}, ${200 + Math.random() * 55}, ${0.1 + Math.random() * 0.2})`
      : `rgba(${100 + Math.random() * 155}, ${100 + Math.random() * 155}, ${200 + Math.random() * 55}, ${0.05 + Math.random() * 0.1})`
  }

  update(mouseX: number, mouseY: number, canvasWidth: number, canvasHeight: number) {
    // Move particles
    this.x += this.speedX
    this.y += this.speedY

    // Wrap around edges
    if (this.x < 0) this.x = canvasWidth
    if (this.x > canvasWidth) this.x = 0
    if (this.y < 0) this.y = canvasHeight
    if (this.y > canvasHeight) this.y = 0

    // React to mouse (subtle attraction)
    const dx = this.x - mouseX
    const dy = this.y - mouseY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < 200) {
      const angle = Math.atan2(dy, dx)
      const force = 0.1
      this.speedX -= Math.cos(angle) * force
      this.speedY -= Math.sin(angle) * force
    }

    // Limit speed
    const maxSpeed = 1
    const currentSpeed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY)
    if (currentSpeed > maxSpeed) {
      this.speedX = (this.speedX / currentSpeed) * maxSpeed
      this.speedY = (this.speedY / currentSpeed) * maxSpeed
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let particles: Particle[] = []
    let mouseX = 0
    let mouseY = 0
    let isDark = theme === "dark"

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()

    // Track mouse position
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    window.addEventListener("mousemove", handleMouseMove)

    // Initialize particles
    function initParticles() {
      particles = []
      const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 10000), 150)

      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(canvas.width, canvas.height, isDark))
      }
    }

    // Draw connections between particles
    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx!.beginPath()
            ctx!.strokeStyle = isDark
              ? `rgba(100, 150, 255, ${0.1 * (1 - distance / 100)})`
              : `rgba(100, 150, 255, ${0.05 * (1 - distance / 100)})`
            ctx!.lineWidth = 0.5
            ctx!.moveTo(particles[i].x, particles[i].y)
            ctx!.lineTo(particles[j].x, particles[j].y)
            ctx!.stroke()
          }
        }
      }
    }

    // Animation loop
    function animate() {
      ctx!.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particles.forEach((particle) => {
        particle.update(mouseX, mouseY, canvas.width, canvas.height)
        particle.draw(ctx!)
      })

      drawConnections()

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    // Update colors when theme changes
    if (theme) {
      isDark = theme === "dark"
      particles.forEach((particle) => {
        particle.color = isDark
          ? `rgba(${100 + Math.random() * 155}, ${100 + Math.random() * 155}, ${200 + Math.random() * 55}, ${0.1 + Math.random() * 0.2})`
          : `rgba(${100 + Math.random() * 155}, ${100 + Math.random() * 155}, ${200 + Math.random() * 55}, ${0.05 + Math.random() * 0.1})`
      })
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [theme])

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />
}
