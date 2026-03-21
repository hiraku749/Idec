'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

interface CalendarEvent {
  date: string  // 'YYYY-MM-DD'
  title: string
  noteId: string
}

interface Props {
  events: CalendarEvent[]
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay() // 0=日曜
}

export function TodoCalendar({ events }: Props) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  // イベントをdate→events のマップに変換
  const eventMap = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    const [y, m] = ev.date.split('-').map(Number)
    if (y === viewYear && m - 1 === viewMonth) {
      const list = eventMap.get(ev.date) ?? []
      list.push(ev)
      eventMap.set(ev.date, list)
    }
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
    setSelectedDate(null)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
    setSelectedDate(null)
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  })

  const todayStr = today.toISOString().slice(0, 10)
  const selectedEvents = selectedDate ? (eventMap.get(selectedDate) ?? []) : []

  // カレンダーのセルを作成（最初の空白 + 日付）
  const cells: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // 6行分になるように末尾をpadding
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="border rounded-xl p-4 space-y-3">
      <h2 className="text-sm font-medium flex items-center gap-1.5">
        <CalendarDays className="w-4 h-4 text-primary" />
        ToDoカレンダー
      </h2>

      {/* ナビゲーション */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 rounded hover:bg-accent transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium">{monthLabel}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 rounded hover:bg-accent transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 text-center">
        {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
          <div
            key={d}
            className={`text-[10px] font-medium pb-1 ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted-foreground'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />
          }
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const hasEvents = eventMap.has(dateStr)
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate
          const col = idx % 7

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`relative flex flex-col items-center py-1 rounded-md text-xs transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : isToday
                  ? 'bg-primary/10 font-bold'
                  : 'hover:bg-accent'
              } ${col === 0 ? 'text-red-500' : col === 6 ? 'text-blue-500' : ''} ${
                isSelected ? 'text-primary-foreground' : ''
              }`}
            >
              <span>{day}</span>
              {hasEvents && (
                <span
                  className={`mt-0.5 w-1 h-1 rounded-full ${
                    isSelected ? 'bg-primary-foreground' : 'bg-primary'
                  }`}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* 選択日のイベント */}
      {selectedDate && (
        <div className="border-t pt-2 space-y-1.5">
          <p className="text-xs text-muted-foreground">
            {new Date(selectedDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })} の ToDo
          </p>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">この日にToDoはありません</p>
          ) : (
            selectedEvents.map((ev) => (
              <Link
                key={ev.noteId}
                href={`/notes/${ev.noteId}`}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline truncate"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {ev.title}
              </Link>
            ))
          )}
        </div>
      )}

      {events.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          期日付きのToDoノートがありません
        </p>
      )}
    </div>
  )
}
