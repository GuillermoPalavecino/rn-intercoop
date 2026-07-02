import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { SESSION_ID } from '@/lib/phase'
import { ExportData, Rubro } from '@/types'

export async function GET() {
  const supabase = createServiceClient()

  const [
    { data: coops },
    { data: cuestionarios },
    { data: ofertas },
    { data: necesidades },
    { data: resumen },
  ] = await Promise.all([
    supabase.from('cooperativas').select('*').eq('session_id', SESSION_ID).order('created_at'),
    supabase.from('cuestionarios').select('*'),
    supabase.from('ofertas').select('*'),
    supabase.from('necesidades').select('*'),
    supabase.from('resumenes').select('*').eq('session_id', SESSION_ID).order('created_at', { ascending: false }).limit(1),
  ])

  const porRubro: Record<Rubro, number> = {
    trabajo: 0, consumo: 0, servicios: 0, vivienda: 0, produccion: 0,
  }

  const cooperativasData = (coops ?? []).map(coop => {
    porRubro[coop.rubro as Rubro] = (porRubro[coop.rubro as Rubro] ?? 0) + 1
    return {
      cooperativa: coop,
      cuestionario: cuestionarios?.find(c => c.cooperativa_id === coop.id) ?? null,
      ofertas: ofertas?.filter(o => o.cooperativa_id === coop.id).map(o => o.palabra) ?? [],
      necesidades: necesidades?.filter(n => n.cooperativa_id === coop.id).map(n => n.palabra) ?? [],
    }
  })

  const exportData: ExportData = {
    evento: 'Congreso FECORN - Río Negro',
    fecha: new Date().toISOString(),
    cooperativas: cooperativasData,
    resumen_ia: resumen?.[0]?.contenido ?? null,
    estadisticas: {
      total_cooperativas: coops?.length ?? 0,
      por_rubro: porRubro,
      total_palabras_ofrecidas: ofertas?.length ?? 0,
      total_palabras_necesitadas: necesidades?.length ?? 0,
    },
  }

  const json = JSON.stringify(exportData, null, 2)

  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="intercoop-fecorn-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
