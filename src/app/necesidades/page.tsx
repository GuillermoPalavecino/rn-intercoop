'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { WordFrequency } from '@/types'
import WordCloud from '@/components/WordCloud'
import PhaseGate from '@/components/PhaseGate'
import LoadingSpinner from '@/components/LoadingSpinner'
import { MAX_NECESIDADES } from '@/lib/phase'

export default function NecesidadesPage() {
  const router = useRouter()
  const [words, setWords] = useState<WordFrequency[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/ofertas')
      .then(r => r.json())
      .then(setWords)
      .finally(() => setLoading(false))
  }, [])

  const toggleWord = (word: string) => {
    setSelected(prev =>
      prev.includes(word)
        ? prev.filter(w => w !== word)
        : prev.length < MAX_NECESIDADES ? [...prev, word] : prev
    )
  }

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError('Elegí al menos una cosa que te interese o necesites')
      return
    }
    const cooperativa_id = localStorage.getItem('cooperativa_id')
    if (!cooperativa_id) { router.push('/registro'); return }

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/necesidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cooperativa_id, palabras: selected }),
      })
      if (!res.ok) throw new Error()
      setDone(true)
    } catch {
      setError('Error al guardar. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-green-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">¡Listo!</h1>
        <p className="text-gray-500 text-sm max-w-xs">Registramos tus {selected.length} elecciones. Mirá la pantalla del facilitador para ver los resultados.</p>
      </main>
    )
  }

  return (
    <PhaseGate expectedPhase="SELECCION_NECESIDADES">
      <main className="min-h-screen bg-white pb-32">
        <div className="bg-green-700 text-white py-5 px-4 text-center">
          <h1 className="font-bold text-lg">¿Qué necesitamos?</h1>
          <p className="text-green-200 text-sm">Elegí hasta {MAX_NECESIDADES} cosas que te interesen o necesites</p>
        </div>

        {/* Contador */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {selected.length === 0
              ? 'Tocá las palabras que querés'
              : `${selected.length} / ${MAX_NECESIDADES} elegidas`}
          </span>
          {selected.length > 0 && (
            <button
              onClick={() => setSelected([])}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="px-4 py-6 min-h-[60vh]">
          {loading ? (
            <LoadingSpinner message="Cargando nube de palabras..." />
          ) : (
            <WordCloud
              words={words}
              selectable
              selected={selected}
              onToggle={toggleWord}
              maxSelectable={MAX_NECESIDADES}
              className="min-h-64"
            />
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          {error && <p className="text-red-500 text-xs mb-2 text-center">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting || selected.length === 0}
            className="w-full max-w-md mx-auto block bg-green-700 text-white font-semibold py-4 rounded-xl hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Enviando...' : `Confirmar ${selected.length > 0 ? selected.length + ' elecciones' : 'selección'} →`}
          </button>
        </div>
      </main>
    </PhaseGate>
  )
}
