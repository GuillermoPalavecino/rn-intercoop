'use client'

import { Semaforo as SemaforoType } from '@/types'

const OPTIONS: {
  value: SemaforoType
  label: string
  description: string
  colors: { border: string; bg: string; text: string; dot: string }
  emoji: string
}[] = [
  {
    value: 'critico',
    label: 'Situación crítica',
    description: 'Enfrentamos problemas serios que ponen en riesgo la continuidad',
    colors: { border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-800', dot: 'bg-red-500' },
    emoji: '🔴',
  },
  {
    value: 'dificultades',
    label: 'Con dificultades',
    description: 'Hay obstáculos importantes pero seguimos funcionando',
    colors: { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-800', dot: 'bg-yellow-500' },
    emoji: '🟡',
  },
  {
    value: 'estable',
    label: 'Estable',
    description: 'La cooperativa funciona bien, con desafíos manejables',
    colors: { border: 'border-green-400', bg: 'bg-green-50', text: 'text-green-800', dot: 'bg-green-500' },
    emoji: '🟢',
  },
  {
    value: 'crecimiento',
    label: 'En crecimiento',
    description: 'Estamos creciendo y expandiéndonos',
    colors: { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-800', dot: 'bg-blue-500' },
    emoji: '🔵',
  },
]

interface SemaforoProps {
  value: SemaforoType | null
  onChange: (value: SemaforoType) => void
}

export default function Semaforo({ value, onChange }: SemaforoProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {OPTIONS.map(opt => {
        const isSelected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`
              relative flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150
              active:scale-[0.99]
              ${isSelected
                ? `${opt.colors.border} ${opt.colors.bg} shadow-sm`
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xl mt-0.5 ${isSelected ? '' : 'opacity-70'}`}>
              {opt.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${isSelected ? opt.colors.text : 'text-gray-700'}`}>
                {opt.label}
              </p>
              <p className={`text-xs mt-0.5 leading-relaxed ${isSelected ? opt.colors.text + ' opacity-80' : 'text-gray-400'}`}>
                {opt.description}
              </p>
            </div>
            {isSelected && (
              <div className={`w-5 h-5 rounded-full ${opt.colors.dot} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
