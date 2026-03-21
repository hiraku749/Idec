'use client'

import { cn } from '@/lib/utils'
import { BrainCircuit, Scale, Shield } from 'lucide-react'
import type { AiType } from '@/types'
import type { LucideIcon } from 'lucide-react'

const AI_TYPES: { value: AiType; label: string; icon: LucideIcon; description: string }[] = [
  { value: 'rational', label: '分析的', icon: BrainCircuit, description: '論理的・客観的' },
  { value: 'balanced', label: 'バランス', icon: Scale, description: '実用的・総合的' },
  { value: 'ethical', label: '倫理的', icon: Shield, description: '多角的・慎重' },
]

interface AiTypeSelectorProps {
  value: AiType
  onChange: (value: AiType) => void
}

export function AiTypeSelector({ value, onChange }: AiTypeSelectorProps) {
  return (
    <div className="flex gap-1.5">
      {AI_TYPES.map((type) => {
        const Icon = type.icon
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-all duration-150 active:scale-95',
              value === type.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
            title={type.description}
          >
            <Icon className="w-3.5 h-3.5" />
            {type.label}
          </button>
        )
      })}
    </div>
  )
}
