import { NextRequest, NextResponse } from 'next/server'
import { createAnonClient, createServiceClient } from '@/lib/supabase-server'
import { SESSION_ID } from '@/lib/phase'

// Devuelve frecuencia de palabras o datos crudos (?raw=true para el mapa)
export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const raw = new URL(req.url).searchParams.get('raw') === 'true'

  const { data, error } = await supabase
    .from('ofertas')
    .select('*, cooperativas!inner(session_id)')
    .eq('cooperativas.session_id', SESSION_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (raw) return NextResponse.json(data ?? [])

  const freq: Record<string, number> = {}
  for (const row of data ?? []) {
    freq[row.palabra] = (freq[row.palabra] ?? 0) + 1
  }

  const words = Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json(words)
}

// Guarda las ofertas de una cooperativa (reemplaza las anteriores)
export async function POST(req: NextRequest) {
  const { cooperativa_id, palabras } = await req.json() as {
    cooperativa_id: string
    palabras: string[]
  }

  if (!cooperativa_id || !Array.isArray(palabras)) {
    return NextResponse.json({ error: 'cooperativa_id y palabras requeridos' }, { status: 400 })
  }

  const supabase = createAnonClient()

  // Borra las anteriores y vuelve a insertar
  await supabase.from('ofertas').delete().eq('cooperativa_id', cooperativa_id)

  if (palabras.length > 0) {
    const rows = palabras.map(p => ({ cooperativa_id, palabra: p }))
    const { error } = await supabase.from('ofertas').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
