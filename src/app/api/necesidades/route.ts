import { NextRequest, NextResponse } from 'next/server'
import { createAnonClient, createServiceClient } from '@/lib/supabase-server'
import { SESSION_ID } from '@/lib/phase'

export async function GET(req: NextRequest) {
  const raw = new URL(req.url).searchParams.get('raw') === 'true'
  if (!raw) return NextResponse.json({ error: 'Use ?raw=true' }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('necesidades')
    .select('*, cooperativas!inner(session_id)')
    .eq('cooperativas.session_id', SESSION_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { cooperativa_id, palabras } = await req.json() as {
    cooperativa_id: string
    palabras: string[]
  }

  if (!cooperativa_id || !Array.isArray(palabras)) {
    return NextResponse.json({ error: 'cooperativa_id y palabras requeridos' }, { status: 400 })
  }

  const supabase = createAnonClient()

  await supabase.from('necesidades').delete().eq('cooperativa_id', cooperativa_id)

  if (palabras.length > 0) {
    const rows = palabras.map(p => ({ cooperativa_id, palabra: p }))
    const { error } = await supabase.from('necesidades').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
