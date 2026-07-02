'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Phase } from '@/types'
import { PHASE_LABELS, SESSION_ID } from '@/lib/phase'
import { createClient } from '@/lib/supabase-client'
import PhaseGate from '@/components/PhaseGate'

const MESSAGES: Record<string, { title: string; subtitle: string; emoji: string; bg: string }> = {
  NUBE_DISPLAY: {
    emoji: '☁️',
    title: 'Mirá la pantalla grande',
    subtitle: 'El facilitador está mostrando la nube de palabras con todo lo que ofrecen las cooperativas.',
    bg: 'from-blue-700 to-indigo-700',
  },
  MAPA_RELACIONES: {
    emoji: '🕸️',
    title: 'Mirá la pantalla grande',
    subtitle: '¡Están apareciendo las conexiones! Buscá tu cooperativa en el mapa.',
    bg: 'from-purple-700 to-violet-700',
  },
  RESUMEN_IA: {
    emoji: '✨',
    title: 'Generando síntesis colectiva',
    subtitle: 'La inteligencia artificial está procesando todas las respuestas para crear un resumen compartido.',
    bg: 'from-amber-600 to-orange-600',
  },
}

export default function EsperaPage() {
  const [phase, setPhase] = useState<Phase>('NUBE_DISPLAY')

  useEffect(() => {
    const supabase = createClient()

    fetch('/api/session').then(r => r.json()).then(s => s?.phase && setPhase(s.phase)).catch(() => {})

    const channel = supabase
      .channel('espera-phase')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${SESSION_ID}`
      }, payload => {
        const newPhase = (payload.new as { phase: Phase }).phase
        setPhase(newPhase)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const msg = MESSAGES[phase] ?? {
    emoji: '⏳',
    title: 'Un momento...',
    subtitle: PHASE_LABELS[phase] ?? 'Esperá la indicación del facilitador.',
    bg: 'from-green-700 to-teal-600',
  }

  return (
    <PhaseGate expectedPhase={['NUBE_DISPLAY', 'MAPA_RELACIONES', 'RESUMEN_IA']}>
      <main className={`min-h-screen bg-gradient-to-b ${msg.bg} flex flex-col items-center justify-center px-6 text-center text-white`}>
        <div className="w-28 h-28 bg-white/15 backdrop-blur rounded-full flex items-center justify-center mb-8 ring-4 ring-white/20">
          <span className="text-5xl">{msg.emoji}</span>
        </div>

        <h1 className="text-2xl font-bold mb-3 leading-tight max-w-xs">{msg.title}</h1>
        <p className="text-white/75 text-base max-w-xs leading-relaxed">{msg.subtitle}</p>

        <div className="mt-12 flex gap-2.5">
          <div className="w-2.5 h-2.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '160ms' }} />
          <div className="w-2.5 h-2.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '320ms' }} />
        </div>

        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-white/30 text-xs">Intercoop FECORN · Río Negro</p>
        </div>
      </main>
    </PhaseGate>
  )
}
