'use client'

import { useMemo } from 'react'
import { WordFrequency } from '@/types'

interface WordCloudProps {
  words: WordFrequency[]
  selectable?: boolean
  selected?: string[]
  onToggle?: (word: string) => void
  maxSelectable?: number
  className?: string
}

// Font sizes adaptados a mobile (más conservadores)
const FONT_SIZES = [13, 16, 19, 23, 28, 34, 42, 52]

const COLORS = [
  '#15803d', // green-700
  '#0f766e', // teal-700
  '#0369a1', // sky-700
  '#6d28d9', // violet-700
  '#b45309', // amber-700
  '#0e7490', // cyan-700
  '#1d4ed8', // blue-700
  '#047857', // emerald-700
]

export default function WordCloud({
  words,
  selectable = false,
  selected = [],
  onToggle,
  maxSelectable = 10,
  className = '',
}: WordCloudProps) {
  const sized = useMemo(() => {
    if (words.length === 0) return []
    const max = Math.max(...words.map(w => w.count))
    const min = Math.min(...words.map(w => w.count))
    const range = max - min || 1

    // Mezclar el orden para que no sea siempre el mismo
    const shuffled = [...words].sort((a, b) => {
      const diff = b.count - a.count
      return diff !== 0 ? diff : a.word.localeCompare(b.word)
    })

    return shuffled.map((w, i) => {
      const normalized = (w.count - min) / range
      const sizeIdx = Math.round(normalized * (FONT_SIZES.length - 1))
      const color = COLORS[i % COLORS.length]
      // Rotaciones suaves
      const rotations = [0, 0, 0, -3, 3, -2, 2, 0]
      const rotate = rotations[i % rotations.length]
      return { ...w, fontSize: FONT_SIZES[sizeIdx], color, rotate }
    })
  }, [words])

  if (words.length === 0) {
    return (
      <div className={`flex items-center justify-center text-gray-400 text-base py-12 ${className}`}>
        Esperando palabras...
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap gap-x-3 gap-y-3 items-center justify-center content-center ${className}`}>
      {sized.map(({ word, fontSize, color, rotate, count }) => {
        const isSelected = selected.includes(word)
        const canSelect = isSelected || selected.length < maxSelectable

        if (selectable) {
          return (
            <button
              key={word}
              onClick={() => canSelect && onToggle?.(word)}
              title={`${count} cooperativa${count !== 1 ? 's' : ''}`}
              // Mínimo 44px de alto para touch target iOS/Android
              className={`
                inline-flex items-center justify-center font-bold leading-none
                rounded-full px-3 py-2 min-h-[44px] transition-all duration-150
                select-none touch-manipulation
                ${isSelected
                  ? 'bg-green-600 text-white shadow-lg shadow-green-900/25 scale-105'
                  : canSelect
                    ? 'bg-white border-2 border-transparent hover:border-current active:scale-95'
                    : 'opacity-30 cursor-not-allowed bg-white'
                }
              `}
              style={{
                fontSize,
                color: isSelected ? undefined : color,
                transform: `rotate(${rotate}deg) ${isSelected ? 'scale(1.05)' : ''}`,
              }}
            >
              {isSelected && <span className="text-xs mr-1 opacity-80">✓</span>}
              {word}
            </button>
          )
        }

        return (
          <span
            key={word}
            title={`${count}`}
            className="inline-block font-bold leading-none"
            style={{
              fontSize,
              color,
              transform: `rotate(${rotate}deg)`,
            }}
          >
            {word}
          </span>
        )
      })}
    </div>
  )
}
