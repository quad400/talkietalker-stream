import { useEffect, useState } from "react"

export type GridBreakpoint = "sm" | "md" | "xl"

export function getGridMaxVisible(total: number, breakpoint: GridBreakpoint): number {
  if (total <= 0) return 0
  if (breakpoint === "xl") return total > 9 ? 9 : total
  if (breakpoint === "md") return total >= 5 ? 3 : Math.min(total, 4)
  return Math.min(total, 4)
}

export function getGridColumnClass(visibleCount: number): string {
  if (visibleCount <= 1) return "sf-grid-cols-1"
  if (visibleCount === 2) return "sf-grid-cols-2"
  if (visibleCount <= 4) return "sf-grid-cols-2"
  return "sf-grid-cols-3"
}

export function useParticipantGridBreakpoint(): GridBreakpoint {
  const [breakpoint, setBreakpoint] = useState<GridBreakpoint>("sm")

  useEffect(() => {
    const xl = window.matchMedia("(min-width: 1280px)")
    const md = window.matchMedia("(min-width: 768px)")

    function sync() {
      if (xl.matches) setBreakpoint("xl")
      else if (md.matches) setBreakpoint("md")
      else setBreakpoint("sm")
    }

    sync()
    xl.addEventListener("change", sync)
    md.addEventListener("change", sync)
    return () => {
      xl.removeEventListener("change", sync)
      md.removeEventListener("change", sync)
    }
  }, [])

  return breakpoint
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
}

export { initials }
