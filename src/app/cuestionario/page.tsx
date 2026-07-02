'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Semaforo as SemaforoType } from '@/types'
import Semaforo from '@/components/Semaforo'
import PhaseGate from '@/components/PhaseGate'
import WaitingScreen from '@/components/WaitingScreen'

const EJES = [
  {
    key: 'desafios_colectivos',
    icon: '🧩',
    label: 'Desafíos colectivos',
    placeholder: '¿Qué dificultades enfrentan como organización? (toma de decisiones, participación de socios/as, comunicación interna...)',
  },
  {
    key: 'desafios_interpersonales',
    icon: '🤝',
    label: 'Desafíos interpersonales',
    placeholder: '¿Cómo son las relaciones entre integrantes? (conflictos, liderazgo, confianza, compromiso...)',
  },
  {
    key: 'desafios_trabajo',
    icon: '⚙️',
    label: 'Desafíos de trabajo',
    placeholder: '¿Cuáles son los principales obstáculos operativos? (producción, infraestructura, tecnología, acceso a mercados...)',
  },
  {
    key: 'desafios_precios',
    icon: '💰',
    label: 'Desafíos económicos',
    placeholder: '¿Cómo impactan los costos, la inflación y los precios en la cooperativa?',
  },
  {
    key: 'desafios_otros',
    icon: '💡',
    label: 'Otros desafíos u oportunidades',
    placeholder: '¿Hay algo más que quieran compartir? (oportunidades, sueños, proyectos en mente...)',
  },
]

export default function CuestionarioPage() {
  const router = useRouter()
  const [semaforo, setSemaforo] = useState<SemaforoType | null>(null)
  const [respuestas, setRespuestas] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'semaforo' | 'desafios'>('semaforo')
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!semaforo) return
    const cooperativa_id = localStorage.getItem('cooperativa_id')
    if (!cooperativa_id) { router.push('/registro'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/cuestionario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cooperativa_id, semaforo, ...respuestas }),
      })
      if (!res.ok) throw new Error()
      setDone(true)
    } catch {
      setError('Error al guardar. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <PhaseGate expectedPhase="CUESTIONARIO">
        <WaitingScreen
          title="¡Gracias por compartir!"
          subtitle="Recibimos las respuestas de tu cooperativa. El facilitador habilitará el siguiente paso en breve."
        />
      </PhaseGate>
    )
  }

  return (
    <PhaseGate expectedPhase="CUESTIONARIO">
      <main className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-700 via-green-600 to-teal-600 px-5 pt-12 pb-8">
          <div className="flex items-center gap-2 mb-5">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= 2 ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">Paso 2 de 4</p>
          <h1 className="text-white text-2xl font-bold leading-tight">
            {step === 'semaforo' ? '¿Cómo está la cooperativa hoy?' : '¿Cuáles son sus desafíos?'}
          </h1>
          <p className="text-white/75 text-sm mt-1.5">
            {step === 'semaforo'
              ? 'Elegí el estado que mejor describe el momento actual'
              : 'Respondé lo que quieran. Todo es anónimo y colectivo'}
          </p>
        </div>

        <div className="px-4 py-6 pb-10 max-w-lg mx-auto">
          {step === 'semaforo' && (
            <div className="space-y-4">
              <Semaforo value={semaforo} onChange={setSemaforo} />
              <button
                onClick={() => setStep('desafios')}
                disabled={!semaforo}
                className="w-full bg-gradient-to-r from-green-700 to-teal-600 text-white font-bold py-4 rounded-2xl text-base shadow-lg shadow-green-900/20 disabled:opacity-40 transition-all active:scale-[0.99] mt-2"
              >
                Continuar →
              </button>
            </div>
          )}

          {step === 'desafios' && (
            <div className="space-y-4">
              {EJES.map(eje => (
                <div key={eje.key} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{eje.icon}</span>
                    <h3 className="text-sm font-semibold text-gray-700">{eje.label}</h3>
                  </div>
                  <textarea
                    rows={3}
                    placeholder={eje.placeholder}
                    value={respuestas[eje.key] ?? ''}
                    onChange={e => setRespuestas(prev => ({ ...prev, [eje.key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 resize-none transition-colors"
                  />
                </div>
              ))}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('semaforo')}
                  className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-3.5 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  ← Volver
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] bg-gradient-to-r from-green-700 to-teal-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-green-900/20 disabled:opacity-50 transition-all active:scale-[0.99]"
                >
                  {loading ? 'Guardando...' : 'Guardar →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </PhaseGate>
  )
}
