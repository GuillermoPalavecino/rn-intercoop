'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PALABRAS_PREDEFINIDAS } from '@/lib/phase'
import PhaseGate from '@/components/PhaseGate'
import WaitingScreen from '@/components/WaitingScreen'

export default function OfertaPage() {
  const router = useRouter()
  const [seleccionadas, setSeleccionadas] = useState<string[]>([])
  const [custom, setCustom] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categoriaAbierta, setCategoriaAbierta] = useState<string | null>(Object.keys(PALABRAS_PREDEFINIDAS)[0])
  const [done, setDone] = useState(false)

  const toggle = (palabra: string) => {
    setSeleccionadas(prev =>
      prev.includes(palabra) ? prev.filter(p => p !== palabra) : [...prev, palabra]
    )
  }

  const addCustom = () => {
    const trimmed = custom.trim()
    if (!trimmed || seleccionadas.includes(trimmed)) return
    setSeleccionadas(prev => [...prev, trimmed])
    setCustom('')
  }

  const handleSubmit = async () => {
    if (seleccionadas.length === 0) {
      setError('Agregá al menos una cosa que tu cooperativa pueda ofrecer')
      return
    }
    const cooperativa_id = localStorage.getItem('cooperativa_id')
    if (!cooperativa_id) { router.push('/registro'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ofertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cooperativa_id, palabras: seleccionadas }),
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
      <PhaseGate expectedPhase="JUEGO_OFERTA">
        <WaitingScreen
          title="¡Ofertas enviadas!"
          subtitle={`Registramos ${seleccionadas.length} cosa${seleccionadas.length !== 1 ? 's' : ''} que tu cooperativa puede ofrecer. Mirá la pantalla del facilitador.`}
        />
      </PhaseGate>
    )
  }

  return (
    <PhaseGate expectedPhase="JUEGO_OFERTA">
      <main className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-700 via-green-600 to-teal-600 px-5 pt-12 pb-6">
          <div className="flex items-center gap-2 mb-5">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">Paso 3 de 4</p>
          <h1 className="text-white text-2xl font-bold leading-tight">¿Qué puede ofrecer tu cooperativa?</h1>
          <p className="text-white/75 text-sm mt-1.5">Elegí de la lista o escribí lo tuyo propio</p>
        </div>

        {/* Seleccionadas sticky */}
        {seleccionadas.length > 0 && (
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                {seleccionadas.length} seleccionada{seleccionadas.length !== 1 ? 's' : ''}
              </span>
              <button onClick={() => setSeleccionadas([])} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                Limpiar todo
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {seleccionadas.map(p => (
                <button
                  key={p}
                  onClick={() => toggle(p)}
                  className="inline-flex items-center gap-1 bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-full"
                >
                  {p} <span className="opacity-70 text-sm leading-none">×</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 py-5 pb-36 max-w-lg mx-auto space-y-4">
          {/* Input personalizado */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2.5">✏️ Agregá algo propio</p>
            <div className="flex gap-2">
              <input
                value={custom}
                onChange={e => setCustom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustom()}
                placeholder="Ej: Cría de conejos, Serigrafía..."
                className="flex-1 border border-amber-300 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white placeholder:text-amber-400"
              />
              <button
                onClick={addCustom}
                disabled={!custom.trim()}
                className="bg-amber-500 text-white px-5 rounded-xl text-base font-bold hover:bg-amber-600 disabled:opacity-40 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Lista predefinida */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">O elegí de la lista</p>

          {Object.entries(PALABRAS_PREDEFINIDAS).map(([categoria, palabras]) => (
            <div key={categoria} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => setCategoriaAbierta(prev => prev === categoria ? null : categoria)}
                className="w-full flex items-center justify-between px-4 py-4 text-sm font-semibold text-gray-700"
              >
                <span>{categoria}</span>
                <div className="flex items-center gap-2">
                  {palabras.some(p => seleccionadas.includes(p)) && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                      {palabras.filter(p => seleccionadas.includes(p)).length}
                    </span>
                  )}
                  <span className="text-gray-300 text-xs">{categoriaAbierta === categoria ? '▲' : '▼'}</span>
                </div>
              </button>

              {categoriaAbierta === categoria && (
                <div className="flex flex-wrap gap-2 px-4 pb-4 border-t border-gray-50">
                  {palabras.map(p => (
                    <button
                      key={p}
                      onClick={() => toggle(p)}
                      className={`text-sm px-3.5 py-2 rounded-full border transition-all font-medium ${
                        seleccionadas.includes(p)
                          ? 'bg-green-600 text-white border-green-600 shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700'
                      }`}
                    >
                      {seleccionadas.includes(p) ? '✓ ' : ''}{p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer fijo */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 p-4 shadow-xl">
          <div className="max-w-lg mx-auto">
            {error && <p className="text-red-500 text-xs mb-2 text-center">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={loading || seleccionadas.length === 0}
              className="w-full bg-gradient-to-r from-green-700 to-teal-600 text-white font-bold py-4 rounded-2xl text-base shadow-lg shadow-green-900/20 disabled:opacity-50 transition-all active:scale-[0.99]"
            >
              {loading ? 'Enviando...' : seleccionadas.length > 0
                ? `Enviar ${seleccionadas.length} oferta${seleccionadas.length !== 1 ? 's' : ''} →`
                : 'Seleccioná al menos una'}
            </button>
          </div>
        </div>
      </main>
    </PhaseGate>
  )
}
