import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { chatCompletionStream } from '@/lib/llm'
import { createServiceClient } from '@/lib/supabase-server'
import { SESSION_ID } from '@/lib/phase'

function loadPrompts(): { system: string; instruction: string } {
  const file = readFileSync(join(process.cwd(), 'docs/prompt-resumen.md'), 'utf-8')
  const rolMatch = file.match(/## Rol del modelo\n+([\s\S]*?)(?=\n---|\n##|$)/)
  const instrMatch = file.match(/## Instrucción final\n+([\s\S]*?)(?=\n---|\n##|$)/)
  return {
    system: rolMatch?.[1]?.trim() ?? '',
    instruction: instrMatch?.[1]?.trim() ?? '',
  }
}

export async function GET() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('resumenes')
    .select('*')
    .eq('session_id', SESSION_ID)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json(data ?? null)
}

export async function POST(req: NextRequest) {
  const { prompt_extra } = await req.json().catch(() => ({})) as { prompt_extra?: string }

  const supabase = createServiceClient()

  const [{ data: coops }, { data: cuest }, { data: ofertas }, { data: necesidades }] = await Promise.all([
    supabase.from('cooperativas').select('*').eq('session_id', SESSION_ID),
    supabase.from('cuestionarios').select('*, cooperativas!inner(session_id, nombre_cooperativa, rubro)').eq('cooperativas.session_id', SESSION_ID),
    supabase.from('ofertas').select('*, cooperativas!inner(session_id)').eq('cooperativas.session_id', SESSION_ID),
    supabase.from('necesidades').select('*, cooperativas!inner(session_id)').eq('cooperativas.session_id', SESSION_ID),
  ])

  const totalCoops = coops?.length ?? 0
  const semaforoCount = { critico: 0, dificultades: 0, estable: 0, crecimiento: 0 }
  const desafiosColectivos: string[] = []
  const desafiosInterpersonales: string[] = []
  const desafiosTrabajo: string[] = []
  const desafiosPrecios: string[] = []
  const desafiosOtros: string[] = []

  for (const c of cuest ?? []) {
    semaforoCount[c.semaforo as keyof typeof semaforoCount]++
    if (c.desafios_colectivos) desafiosColectivos.push(c.desafios_colectivos)
    if (c.desafios_interpersonales) desafiosInterpersonales.push(c.desafios_interpersonales)
    if (c.desafios_trabajo) desafiosTrabajo.push(c.desafios_trabajo)
    if (c.desafios_precios) desafiosPrecios.push(c.desafios_precios)
    if (c.desafios_otros) desafiosOtros.push(c.desafios_otros)
  }

  const topOfertas = (ofertas ?? []).reduce<Record<string, number>>((acc, o) => {
    acc[o.palabra] = (acc[o.palabra] ?? 0) + 1; return acc
  }, {})

  const topNecesidades = (necesidades ?? []).reduce<Record<string, number>>((acc, n) => {
    acc[n.palabra] = (acc[n.palabra] ?? 0) + 1; return acc
  }, {})

  const { system: systemPrompt, instruction } = loadPrompts()

  const userPrompt = `Tenés los datos de ${totalCoops} cooperativas participantes del Congreso FECORN - Río Negro.

**Estado general (semáforo):**
- En situación crítica: ${semaforoCount.critico}
- Con dificultades: ${semaforoCount.dificultades}
- Estables: ${semaforoCount.estable}
- En crecimiento: ${semaforoCount.crecimiento}

**Desafíos colectivos mencionados:**
${desafiosColectivos.map(d => `- "${d}"`).join('\n') || '(sin respuestas)'}

**Desafíos interpersonales mencionados:**
${desafiosInterpersonales.map(d => `- "${d}"`).join('\n') || '(sin respuestas)'}

**Desafíos de trabajo mencionados:**
${desafiosTrabajo.map(d => `- "${d}"`).join('\n') || '(sin respuestas)'}

**Desafíos de precios mencionados:**
${desafiosPrecios.map(d => `- "${d}"`).join('\n') || '(sin respuestas)'}

**Otros desafíos:**
${desafiosOtros.map(d => `- "${d}"`).join('\n') || '(sin respuestas)'}

**Top ofertas colectivas:**
${Object.entries(topOfertas).sort(([,a],[,b]) => b-a).slice(0,15).map(([p,c]) => `- ${p}: ${c} cooperativas`).join('\n')}

**Top necesidades colectivas:**
${Object.entries(topNecesidades).sort(([,a],[,b]) => b-a).slice(0,15).map(([p,c]) => `- ${p}: ${c} cooperativas`).join('\n')}

${prompt_extra ? `\n**Instrucciones adicionales del facilitador:**\n${prompt_extra}\n` : ''}
${instruction}`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ]

  const encoder = new TextEncoder()
  let fullContent = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const token of chatCompletionStream(messages, { max_tokens: 1024, temperature: 0.7 })) {
          fullContent += token
          controller.enqueue(encoder.encode(token))
        }
        // Guardar en Supabase al terminar
        await supabase
          .from('resumenes')
          .insert({ session_id: SESSION_ID, contenido: fullContent })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido'
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
