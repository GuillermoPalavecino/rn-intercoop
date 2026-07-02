'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Phase, Session } from '@/types'
import { PHASES, PHASE_LABELS, getNextPhase, getPrevPhase, SESSION_ID } from '@/lib/phase'
import { createClient } from '@/lib/supabase-client'
import LoadingSpinner from '@/components/LoadingSpinner'
import { QRCodeSVG as QRCode } from 'qrcode.react'

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [coopCount, setCoopCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [transitioning, setTransitioning] = useState(false)
  const [appUrl, setAppUrl] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    setAppUrl(process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const load = async () => {
      const [sessionRes, coopsRes] = await Promise.all([
        fetch('/api/session').then(r => r.json()),
        fetch('/api/cooperativas').then(r => r.json()),
      ])
      setSession(sessionRes)
      setCoopCount(Array.isArray(coopsRes) ? coopsRes.length : 0)
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('admin-session')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${SESSION_ID}`
      }, payload => setSession(payload.new as Session))
      .subscribe()

    const interval = setInterval(() => {
      fetch('/api/cooperativas').then(r => r.json()).then(d => setCoopCount(Array.isArray(d) ? d.length : 0))
    }, 15000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  const changePhase = async (phase: Phase) => {
    setTransitioning(true)
    await fetch('/api/session', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase }),
    })
    setTransitioning(false)
  }

  const closeResetModal = () => {
    setShowResetModal(false)
    setResetPassword('')
    setResetError('')
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetting(true)
    setResetError('')

    const res = await fetch('/api/admin/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: resetPassword }),
    })

    if (res.ok) {
      closeResetModal()
      setCoopCount(0)
      const sessionRes = await fetch('/api/session').then(r => r.json())
      setSession(sessionRes)
    } else {
      const data = await res.json().catch(() => ({}))
      setResetError(data.error === 'Contraseña incorrecta' ? data.error : 'No se pudo resetear la base de datos')
    }
    setResetting(false)
  }

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner /></div>

  const currentPhase = session?.phase ?? 'REGISTRO'
  const nextPhase = getNextPhase(currentPhase)
  const prevPhase = getPrevPhase(currentPhase)

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Panel Intercoop</h1>
            <p className="text-slate-400 text-sm">FECORN · Río Negro</p>
          </div>
          <div className="bg-green-900 border border-green-700 rounded-xl px-4 py-2 text-center">
            <div className="text-2xl font-bold text-green-300">{coopCount}</div>
            <div className="text-xs text-green-400">cooperativas</div>
          </div>
        </div>

        {/* Fase actual */}
        <div className="bg-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Fase actual</p>
          <h2 className="text-xl font-bold text-white mb-1">{PHASE_LABELS[currentPhase]}</h2>
          <div className="flex gap-1 mt-3">
            {PHASES.map((p, i) => (
              <div
                key={p}
                className={`h-2 flex-1 rounded-full ${
                  PHASES.indexOf(currentPhase) >= i ? 'bg-green-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Controles de fase */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => prevPhase && changePhase(prevPhase)}
            disabled={!prevPhase || transitioning}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-30 font-medium py-4 rounded-xl transition-colors"
          >
            ← Fase anterior
          </button>
          <button
            onClick={() => nextPhase && changePhase(nextPhase)}
            disabled={!nextPhase || transitioning}
            className="bg-green-700 hover:bg-green-600 disabled:opacity-30 font-semibold py-4 rounded-xl transition-colors"
          >
            {transitioning ? 'Cambiando...' : 'Siguiente fase →'}
          </button>
        </div>

        {/* Ir a fase directa */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-3">Ir directamente a una fase</p>
          <div className="grid grid-cols-2 gap-2">
            {PHASES.map(p => (
              <button
                key={p}
                onClick={() => changePhase(p)}
                disabled={transitioning}
                className={`text-xs py-2 px-3 rounded-lg text-left transition-colors ${
                  p === currentPhase
                    ? 'bg-green-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {PHASE_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Accesos rápidos a pantallas */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/admin/cooperativas"
            className="bg-slate-700 border border-slate-600 hover:bg-slate-600 rounded-xl p-4 text-center transition-colors col-span-2"
          >
            <div className="text-2xl mb-1">📋</div>
            <div className="text-sm font-medium">Ver cooperativas y respuestas</div>
            <div className="text-xs text-slate-400 mt-0.5">Tabla con detalle completo</div>
          </Link>
          <Link
            href="/admin/nube"
            target="_blank"
            className="bg-blue-900 border border-blue-700 hover:bg-blue-800 rounded-xl p-4 text-center transition-colors"
          >
            <div className="text-2xl mb-1">☁️</div>
            <div className="text-sm font-medium">Nube de palabras</div>
            <div className="text-xs text-blue-300 mt-0.5">Pantalla grande</div>
          </Link>
          <Link
            href="/admin/mapa"
            target="_blank"
            className="bg-purple-900 border border-purple-700 hover:bg-purple-800 rounded-xl p-4 text-center transition-colors"
          >
            <div className="text-2xl mb-1">🕸️</div>
            <div className="text-sm font-medium">Mapa de relaciones</div>
            <div className="text-xs text-purple-300 mt-0.5">Pantalla grande</div>
          </Link>
          <Link
            href="/admin/resumen"
            className="bg-amber-900 border border-amber-700 hover:bg-amber-800 rounded-xl p-4 text-center transition-colors"
          >
            <div className="text-2xl mb-1">✨</div>
            <div className="text-sm font-medium">Síntesis IA</div>
            <div className="text-xs text-amber-300 mt-0.5">Generar y ver</div>
          </Link>
          <a
            href="/api/export"
            download
            className="bg-slate-700 border border-slate-600 hover:bg-slate-600 rounded-xl p-4 text-center transition-colors"
          >
            <div className="text-2xl mb-1">💾</div>
            <div className="text-sm font-medium">Exportar datos</div>
            <div className="text-xs text-slate-400 mt-0.5">Descargar JSON</div>
          </a>
        </div>

        {/* QR */}
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3">
          <p className="text-slate-700 text-sm font-medium">QR para participantes</p>
          <QRCode value={appUrl} size={180} />
          <p className="text-slate-500 text-xs break-all text-center">{appUrl}</p>
        </div>

        {/* Zona de peligro */}
        <div className="bg-red-950 border border-red-900 rounded-2xl p-4">
          <p className="text-red-300 text-xs uppercase tracking-wider mb-2">Zona de peligro</p>
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full bg-red-800 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            🗑️ Resetear base de datos
          </button>
          <p className="text-red-400 text-xs mt-2">
            Borra cooperativas, respuestas, ofertas, necesidades y resúmenes. Vuelve la fase a &quot;Registro&quot;.
          </p>
        </div>
      </div>

      {/* Modal de confirmación de reset */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">⚠️</div>
              <h2 className="text-lg font-bold text-gray-800">¿Resetear la base de datos?</h2>
              <p className="text-gray-500 text-sm mt-1">
                Esta acción no se puede deshacer. Se van a borrar todos los datos cargados en el evento.
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-3">
              <input
                type="password"
                value={resetPassword}
                onChange={e => setResetPassword(e.target.value)}
                placeholder="Confirmá la contraseña de admin"
                autoFocus
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />

              {resetError && <p className="text-red-500 text-sm text-center">{resetError}</p>}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={closeResetModal}
                  disabled={resetting}
                  className="w-full bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetting || !resetPassword}
                  className="w-full bg-red-700 text-white font-semibold py-3 rounded-xl hover:bg-red-800 disabled:opacity-50 transition-colors"
                >
                  {resetting ? 'Borrando...' : 'Sí, resetear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
