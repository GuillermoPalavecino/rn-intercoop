export type Rubro = 'trabajo' | 'consumo' | 'servicios' | 'vivienda' | 'produccion'

export type Semaforo = 'critico' | 'dificultades' | 'estable' | 'crecimiento'

export type Phase =
  | 'REGISTRO'
  | 'CUESTIONARIO'
  | 'JUEGO_OFERTA'
  | 'NUBE_DISPLAY'
  | 'SELECCION_NECESIDADES'
  | 'MAPA_RELACIONES'
  | 'RESUMEN_IA'
  | 'FINALIZADO'

export interface Session {
  id: string
  phase: Phase
  created_at: string
  updated_at: string
}

export interface Cooperativa {
  id: string
  session_id: string
  nombre_contacto: string
  telefono: string
  nombre_cooperativa: string
  ciudad: string
  direccion: string
  rubro: Rubro
  actividad_especifica: string
  selfie_url: string | null
  created_at: string
}

export interface Cuestionario {
  id: string
  cooperativa_id: string
  semaforo: Semaforo
  desafios_colectivos: string | null
  desafios_interpersonales: string | null
  desafios_trabajo: string | null
  desafios_precios: string | null
  desafios_otros: string | null
  created_at: string
}

export interface Oferta {
  id: string
  cooperativa_id: string
  palabra: string
  created_at: string
}

export interface Necesidad {
  id: string
  cooperativa_id: string
  palabra: string
  created_at: string
}

export interface Resumen {
  id: string
  session_id: string
  contenido: string
  created_at: string
}

// For word cloud display
export interface WordFrequency {
  word: string
  count: number
}

// For force graph
export interface GraphNode {
  id: string
  name: string
  rubro: Rubro
  offerCount: number
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

export interface GraphEdge {
  source: string | GraphNode
  target: string | GraphNode
  weight: number
  sharedWords: string[]
}

// Full export structure
export interface ExportData {
  evento: string
  fecha: string
  cooperativas: Array<{
    cooperativa: Cooperativa
    cuestionario: Cuestionario | null
    ofertas: string[]
    necesidades: string[]
  }>
  resumen_ia: string | null
  estadisticas: {
    total_cooperativas: number
    por_rubro: Record<Rubro, number>
    total_palabras_ofrecidas: number
    total_palabras_necesitadas: number
  }
}
