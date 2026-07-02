import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { SESSION_ID } from '@/lib/phase'
import { Phase } from '@/types'

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', SESSION_ID)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const { phase } = await req.json() as { phase: Phase }
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('sessions')
    .update({ phase })
    .eq('id', SESSION_ID)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
