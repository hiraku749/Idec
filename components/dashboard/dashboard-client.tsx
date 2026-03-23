'use client'

import { useState, useEffect } from 'react'

// ---- Live Clock ----
export function LiveClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    function update() {
      const now = new Date()
      const h = String(now.getHours()).padStart(2, '0')
      const m = String(now.getMinutes()).padStart(2, '0')
      setTime(`${h}:${m}`)
    }
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [])

  if (!time) return null
  return <span className="text-lg font-mono text-muted-foreground">{time}</span>
}

// ---- Activity Bar Chart (7-day) ----
interface ActivityChartProps {
  data: { label: string; count: number }[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="flex items-end gap-2 h-32 px-2">
      {data.map((d, i) => {
        const heightPercent = Math.max((d.count / max) * 100, 4)
        const isToday = i === data.length - 1
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
              {d.count > 0 ? d.count : ''}
            </span>
            <div
              className={`w-full rounded-t-md transition-all duration-700 ease-out ${
                isToday
                  ? 'bg-gradient-to-t from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300'
                  : 'bg-gradient-to-t from-blue-400/60 to-blue-300/40 dark:from-blue-600/50 dark:to-blue-400/30'
              }`}
              style={{
                height: `${heightPercent}%`,
                animationDelay: `${i * 80}ms`,
              }}
            />
            <span
              className={`text-[10px] ${
                isToday ? 'font-bold text-foreground' : 'text-muted-foreground'
              }`}
            >
              {d.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---- Animated Counter ----
export function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) {
      setDisplay(0)
      return
    }
    const duration = 600
    const steps = 20
    const increment = value / steps
    let current = 0
    let step = 0
    const id = setInterval(() => {
      step++
      current += increment
      if (step >= steps) {
        setDisplay(value)
        clearInterval(id)
      } else {
        setDisplay(Math.round(current))
      }
    }, duration / steps)
    return () => clearInterval(id)
  }, [value])

  return <span>{display.toLocaleString()}</span>
}
