'use client'

import { cn } from '@/lib/utils'
import type { AiType } from '@/types'

const AI_TYPES: { value: AiType; label: string; icon: string; description: string }[] = [
  { value: 'rational', label: '分析的', icon: '🧠', description: '論理的・客観的' },
  { value: 'balanced', label: 'バランス', icon: '⚖️', description: '実用的・総合的' },
  { value: 'ethical', label: '倫理的', icon: '🌿', description: '多角的・慎重' },
]

interface AiTypeSelectorProps {
  value: AiType
  onChange: (value: AiType) => void
}

export function AiTypeSelector({ value, onChange }: AiTypeSelectorProps) {
  return (
    <div className="flex gap-1.5">
      {AI_TYPES.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => onChange(type.value)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors',
            value === type.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
          title={type.description}
        >
          <span>{type.icon}</span>
          {type.label}
        </button>
      ))}
    </div>
  )
}
