import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { SESSION_ID } from '@/lib/phase'

export async function POST(req: NextRequest) {
  const isAuthenticated = req.cookies.get('admin_auth')?.value === 'true'
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { password } = await req.json()
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // cooperativas en cascada borra cuestionarios, ofertas y necesidades
  const { error: coopError } = await supabase
    .from('cooperativas')
    .delete()
    .eq('session_id', SESSION_ID)
  if (coopError) {
    return NextResponse.json({ error: coopError.message }, { status: 500 })
  }

  const { error: resumenError } = await supabase
    .from('resumenes')
    .delete()
    .eq('session_id', SESSION_ID)
  if (resumenError) {
    return NextResponse.json({ error: resumenError.message }, { status: 500 })
  }

  const { error: sessionError } = await supabase
    .from('sessions')
    .update({ phase: 'REGISTRO' })
    .eq('id', SESSION_ID)
  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
