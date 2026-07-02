import { NextRequest, NextResponse } from 'next/server'
import { createAnonClient, createServiceClient } from '@/lib/supabase-server'
import { SESSION_ID } from '@/lib/phase'

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('cooperativas')
    .select('*')
    .eq('session_id', SESSION_ID)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = createAnonClient()

  const { data, error } = await supabase
    .from('cooperativas')
    .insert({ ...body, session_id: SESSION_ID })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
