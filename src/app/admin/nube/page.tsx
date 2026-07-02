'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { WordFrequency } from '@/types'
import WordCloud from '@/components/WordCloud'
import { createClient } from '@/lib/supabase-client'

export default function AdminNubePage() {
  const [words, setWords] = useState<WordFrequency[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWords = useCallback(() => {
    fetch('/api/ofertas').then(r => r.json()).then(data => {
      setWords(data)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const supabase = createClient()
    fetchWords()

    const channel = supabase
      .channel('admin-ofertas')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'ofertas'
      }, () => fetchWords())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchWords])

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col">
      <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">Nube de Palabras</h1>
          <p className="text-slate-400 text-sm">Lo que ofrecen las cooperativas</p>
        </div>
        <div className="text-right">
          <div className="text-green-400 font-bold text-2xl">{words.length}</div>
          <div className="text-slate-400 text-xs">palabras únicas</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        {loading ? (
          <p className="text-slate-500 text-lg animate-pulse">Cargando...</p>
        ) : words.length === 0 ? (
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-slate-400 text-xl">Esperando que las cooperativas completen sus ofertas...</p>
          </div>
        ) : (
          <WordCloud words={words} className="w-full max-w-5xl" />
        )}
      </div>

      <div className="text-center pb-4 text-slate-600 text-xs">
        Intercoop FECORN · Se actualiza en tiempo real
      </div>
    </main>
  )
}
