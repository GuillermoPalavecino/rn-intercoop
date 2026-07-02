import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { SESSION_ID } from '@/lib/phase'

export interface CoopRow {
  id: string
  nombre_cooperativa: string
  nombre_contacto: string
  telefono: string
  ciudad: string
  direccion: string
  rubro: string
  actividad_especifica: string
  selfie_url: string | null
  created_at: string
  semaforo: string | null
  desafios_colectivos: string | null
  desafios_interpersonales: string | null
  desafios_trabajo: string | null
  desafios_precios: string | null
  desafios_otros: string | null
  ofertas: string[]
  necesidades: string[]
}

export async function GET() {
  const supabase = createServiceClient()

  const [
    { data: coops },
    { data: cuestionarios },
    { data: ofertas },
    { data: necesidades },
  ] = await Promise.all([
    supabase.from('cooperativas').select('*').eq('session_id', SESSION_ID).order('created_at'),
    supabase.from('cuestionarios').select('*'),
    supabase.from('ofertas').select('cooperativa_id, palabra'),
    supabase.from('necesidades').select('cooperativa_id, palabra'),
  ])

  const rows: CoopRow[] = (coops ?? []).map(c => {
    const cuest = cuestionarios?.find(q => q.cooperativa_id === c.id)
    return {
      id: c.id,
      nombre_cooperativa: c.nombre_cooperativa,
      nombre_contacto: c.nombre_contacto,
      telefono: c.telefono,
      ciudad: c.ciudad,
      direccion: c.direccion,
      rubro: c.rubro,
      actividad_especifica: c.actividad_especifica,
      selfie_url: c.selfie_url ?? null,
      created_at: c.created_at,
      semaforo: cuest?.semaforo ?? null,
      desafios_colectivos: cuest?.desafios_colectivos ?? null,
      desafios_interpersonales: cuest?.desafios_interpersonales ?? null,
      desafios_trabajo: cuest?.desafios_trabajo ?? null,
      desafios_precios: cuest?.desafios_precios ?? null,
      desafios_otros: cuest?.desafios_otros ?? null,
      ofertas: ofertas?.filter(o => o.cooperativa_id === c.id).map(o => o.palabra) ?? [],
      necesidades: necesidades?.filter(n => n.cooperativa_id === c.id).map(n => n.palabra) ?? [],
    }
  })

  return NextResponse.json(rows)
}
