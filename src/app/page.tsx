'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Phase } from '@/types'
import { PHASE_USER_ROUTE } from '@/lib/phase'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    fetch('/api/session')
      .then(r => r.json())
      .then((session: { phase: Phase }) => {
        const cooperativaId = localStorage.getItem('cooperativa_id')

        if (!cooperativaId && session.phase !== 'REGISTRO') {
          router.push('/registro')
          return
        }

        router.push(PHASE_USER_ROUTE[session.phase])
      })
      .catch(() => router.push('/registro'))
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center bg-green-50">
      <LoadingSpinner message="Iniciando actividad..." />
    </main>
  )
}
