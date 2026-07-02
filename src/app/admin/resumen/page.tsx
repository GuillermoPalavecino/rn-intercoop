'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'

export default function AdminResumenPage() {
  const [resumen, setResumen] = useState<string | null>(null)
  const [promptExtra, setPromptExtra] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [fetching, setFetching] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    fetch('/api/resumen')
      .then(r => r.json())
      .then(data => { if (data?.contenido) setResumen(data.contenido) })
      .finally(() => setFetching(false))
  }, [])

  const generate = async () => {
    // Cancelar stream previo si existe
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStreaming(true)
    setResumen('')

    try {
      const res = await fetch('/api/resumen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_extra: promptExtra }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) throw new Error('Error al iniciar la generación')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let content = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
        setResumen(content)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setResumen(prev => (prev ?? '') + '\n\n[Error al generar el resumen]')
      }
    } finally {
      setStreaming(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Síntesis Colectiva</h1>
          <p className="text-slate-400 text-sm mt-1">Resumen anónimo generado por IA a partir de todas las respuestas</p>
        </div>

        {/* Prompt adicional */}
        <div className="bg-slate-800 rounded-2xl p-5 space-y-3">
          <label className="block text-sm font-medium text-slate-300">
            Instrucciones adicionales (opcional)
          </label>
          <textarea
            value={promptExtra}
            onChange={e => setPromptExtra(e.target.value)}
            rows={3}
            disabled={streaming}
            placeholder="Ej: Enfocá el resumen en los desafíos laborales. Destacá si hay cooperativas de producción con problemas comunes..."
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-white placeholder-slate-500 disabled:opacity-50"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={generate}
              disabled={streaming}
              className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              {streaming ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generando...
                </>
              ) : resumen ? '🔄 Regenerar síntesis' : '✨ Generar síntesis'}
            </button>
            {streaming && (
              <button
                onClick={() => abortRef.current?.abort()}
                className="text-sm text-slate-400 hover:text-red-400 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Resultado */}
        {fetching && (
          <div className="bg-slate-800 rounded-2xl p-6 text-slate-400 text-center">
            Verificando síntesis previa...
          </div>
        )}

        {!fetching && resumen !== null && (
          <div className="bg-white text-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✨</span>
              <h2 className="font-bold text-lg">Síntesis colectiva</h2>
              {streaming && (
                <span className="ml-auto text-xs text-green-600 font-medium animate-pulse">
                  ● escribiendo...
                </span>
              )}
            </div>
            <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
              {resumen}
              {streaming && <span className="inline-block w-1 h-4 bg-green-500 animate-pulse ml-0.5 align-middle" />}
            </div>
          </div>
        )}

        {!fetching && resumen === null && !streaming && (
          <div className="bg-slate-800 rounded-2xl p-8 text-center text-slate-400">
            <div className="text-4xl mb-3">📝</div>
            <p>Todavía no hay síntesis generada. Hacé clic en "Generar síntesis" para crear una.</p>
          </div>
        )}
      </div>
    </main>
  )
}
