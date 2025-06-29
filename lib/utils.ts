import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to convert time string (HH:MM) to minutes from midnight.
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  if (isNaN(hours) || isNaN(minutes)) {
    return 0
  }
  return hours * 60 + minutes
}

// Helper function to convert minutes from midnight to time string (HH:MM).
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const displayHours = hours % 24
  return `${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}
