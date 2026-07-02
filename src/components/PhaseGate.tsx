'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Phase } from '@/types'
import { PHASE_USER_ROUTE, SESSION_ID } from '@/lib/phase'
import { createClient } from '@/lib/supabase-client'

interface PhaseGateProps {
  expectedPhase: Phase | Phase[]
  children: React.ReactNode
}

export default function PhaseGate({ expectedPhase, children }: PhaseGateProps) {
  const router = useRouter()

  const handlePhaseChange = useCallback((phase: Phase) => {
    const expected = Array.isArray(expectedPhase) ? expectedPhase : [expectedPhase]
    if (!expected.includes(phase)) {
      router.push(PHASE_USER_ROUTE[phase])
    }
  }, [expectedPhase, router])

  useEffect(() => {
    const supabase = createClient()

    fetch('/api/session')
      .then(r => r.json())
      .then(session => session?.phase && handlePhaseChange(session.phase))
      .catch(() => {})

    const channel = supabase
      .channel('phase-gate')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${SESSION_ID}` },
        (payload) => {
          const newPhase = (payload.new as { phase: Phase }).phase
          handlePhaseChange(newPhase)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [handlePhaseChange])

  return <>{children}</>
}
