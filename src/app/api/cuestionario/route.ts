import { NextRequest, NextResponse } from 'next/server'
import { createAnonClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { cooperativa_id, ...rest } = body

  if (!cooperativa_id) {
    return NextResponse.json({ error: 'cooperativa_id requerido' }, { status: 400 })
  }

  const supabase = createAnonClient()

  const { data, error } = await supabase
    .from('cuestionarios')
    .upsert({ cooperativa_id, ...rest }, { onConflict: 'cooperativa_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
