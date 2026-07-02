'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { RUBRO_COLORS, RUBRO_LABELS } from '@/lib/phase'
import type { CoopRow } from '@/app/api/admin/datos/route'

const SEMAFORO_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  critico:      { label: 'Crítico',      color: 'bg-red-900/40 text-red-300',    dot: 'bg-red-500' },
  dificultades: { label: 'Dificultades', color: 'bg-yellow-900/40 text-yellow-300', dot: 'bg-yellow-500' },
  estable:      { label: 'Estable',      color: 'bg-green-900/40 text-green-300', dot: 'bg-green-500' },
  crecimiento:  { label: 'Crecimiento',  color: 'bg-blue-900/40 text-blue-300',  dot: 'bg-blue-500' },
}

const RUBROS = ['trabajo', 'consumo', 'servicios', 'vivienda', 'produccion']
const SEMAFOROS = ['critico', 'dificultades', 'estable', 'crecimiento']

export default function AdminCooperativasPage() {
  const [rows, setRows] = useState<CoopRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterRubro, setFilterRubro] = useState('')
  const [filterSemaforo, setFilterSemaforo] = useState('')

  useEffect(() => {
    fetch('/api/admin/datos')
      .then(r => r.json())
      .then(setRows)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows.filter(r => {
      if (q && !r.nombre_cooperativa.toLowerCase().includes(q) && !r.nombre_contacto.toLowerCase().includes(q) && !r.ciudad.toLowerCase().includes(q)) return false
      if (filterRubro && r.rubro !== filterRubro) return false
      if (filterSemaforo && r.semaforo !== filterSemaforo) return false
      return true
    })
  }, [rows, search, filterRubro, filterSemaforo])

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id)

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-slate-400 hover:text-white transition-colors text-sm">
            ← Panel
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="font-bold text-lg">Cooperativas</h1>
          <span className="bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-full font-medium">
            {filtered.length} / {rows.length}
          </span>
        </div>
        <a
          href="/api/export"
          download
          className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
        >
          💾 Exportar JSON
        </a>
      </div>

      {/* Filtros */}
      <div className="px-6 py-4 flex flex-wrap gap-3 bg-slate-800/50 border-b border-slate-700">
        <input
          type="text"
          placeholder="Buscar por nombre, contacto o ciudad..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 w-72"
        />
        <select
          value={filterRubro}
          onChange={e => setFilterRubro(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todos los rubros</option>
          {RUBROS.map(r => <option key={r} value={r}>{RUBRO_LABELS[r]}</option>)}
        </select>
        <select
          value={filterSemaforo}
          onChange={e => setFilterSemaforo(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todos los semáforos</option>
          {SEMAFOROS.map(s => <option key={s} value={s}>{SEMAFORO_CONFIG[s].label}</option>)}
        </select>
        {(search || filterRubro || filterSemaforo) && (
          <button
            onClick={() => { setSearch(''); setFilterRubro(''); setFilterSemaforo('') }}
            className="text-xs text-slate-400 hover:text-white transition-colors px-2"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-500">
            <div className="w-6 h-6 border-2 border-slate-600 border-t-green-500 rounded-full animate-spin mr-3" />
            Cargando datos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            {rows.length === 0 ? 'Todavía no hay cooperativas registradas' : 'No hay resultados para los filtros aplicados'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700">
                <th className="px-6 py-3 w-8">#</th>
                <th className="px-4 py-3">Cooperativa</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Ciudad</th>
                <th className="px-4 py-3">Rubro</th>
                <th className="px-4 py-3">Semáforo</th>
                <th className="px-4 py-3 text-center">Ofertas</th>
                <th className="px-4 py-3 text-center">Necesidades</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((row, i) => {
                const isOpen = expanded === row.id
                const sem = row.semaforo ? SEMAFORO_CONFIG[row.semaforo] : null
                const rubroColor = RUBRO_COLORS[row.rubro]

                return (
                  <>
                    <tr
                      key={row.id}
                      onClick={() => toggle(row.id)}
                      className={`cursor-pointer transition-colors ${isOpen ? 'bg-slate-800' : 'hover:bg-slate-800/60'}`}
                    >
                      <td className="px-6 py-3 text-slate-500 tabular-nums">{i + 1}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {row.selfie_url ? (
                            <img src={row.selfie_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-1 ring-slate-600" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 text-xs text-slate-400">
                              {row.nombre_cooperativa[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-white leading-tight">{row.nombre_cooperativa}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-white">{row.nombre_contacto}</div>
                        <div className="text-slate-400 text-xs">{row.telefono}</div>
                      </td>

                      <td className="px-4 py-3 text-slate-300">{row.ciudad}</td>

                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full"
                          style={{ backgroundColor: rubroColor + '25', color: rubroColor }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rubroColor }} />
                          {RUBRO_LABELS[row.rubro]}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {sem ? (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${sem.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sem.dot}`} />
                            {sem.label}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-semibold ${row.ofertas.length > 0 ? 'text-green-400' : 'text-slate-600'}`}>
                          {row.ofertas.length}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-semibold ${row.necesidades.length > 0 ? 'text-blue-400' : 'text-slate-600'}`}>
                          {row.necesidades.length}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-400 text-center">
                        <span className={`text-xs transition-transform inline-block ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr key={row.id + '-detail'} className="bg-slate-800">
                        <td colSpan={9} className="px-6 py-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* Actividad */}
                            <Section title="Actividad específica">
                              <p className="text-slate-300 text-sm leading-relaxed">{row.actividad_especifica}</p>
                              <p className="text-slate-500 text-xs mt-1">{row.direccion} · {row.ciudad}</p>
                            </Section>

                            {/* Semáforo + desafíos */}
                            <Section title="Cuestionario Intercoop">
                              {row.semaforo ? (
                                <div className="space-y-2">
                                  <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mb-2 ${sem?.color}`}>
                                    <span className={`w-2 h-2 rounded-full ${sem?.dot}`} />
                                    {sem?.label}
                                  </div>
                                  {[
                                    ['🧩 Colectivos', row.desafios_colectivos],
                                    ['🤝 Interpersonales', row.desafios_interpersonales],
                                    ['⚙️ Trabajo', row.desafios_trabajo],
                                    ['💰 Precios', row.desafios_precios],
                                    ['💡 Otros', row.desafios_otros],
                                  ].filter(([, v]) => v).map(([label, value]) => (
                                    <div key={label as string}>
                                      <p className="text-xs text-slate-400 font-medium">{label as string}</p>
                                      <p className="text-slate-300 text-sm leading-relaxed">{value as string}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-slate-500 text-sm">Sin cuestionario completado</p>
                              )}
                            </Section>

                            {/* Ofertas */}
                            <Section title={`Ofrece (${row.ofertas.length})`}>
                              {row.ofertas.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {row.ofertas.map(o => (
                                    <span key={o} className="text-xs bg-green-900/50 text-green-300 border border-green-800 px-2.5 py-1 rounded-full">
                                      {o}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-slate-500 text-sm">Sin ofertas registradas</p>
                              )}
                            </Section>

                            {/* Necesidades */}
                            <Section title={`Necesita (${row.necesidades.length})`}>
                              {row.necesidades.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {row.necesidades.map(n => (
                                    <span key={n} className="text-xs bg-blue-900/50 text-blue-300 border border-blue-800 px-2.5 py-1 rounded-full">
                                      {n}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-slate-500 text-sm">Sin necesidades registradas</p>
                              )}
                            </Section>

                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  )
}
