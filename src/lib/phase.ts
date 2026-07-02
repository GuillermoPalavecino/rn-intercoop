import { Phase } from '@/types'

export const SESSION_ID = process.env.NEXT_PUBLIC_SESSION_ID ?? 'aaaaaaaa-0000-0000-0000-000000000001'

export const PHASES: Phase[] = [
  'REGISTRO',
  'CUESTIONARIO',
  'JUEGO_OFERTA',
  'NUBE_DISPLAY',
  'SELECCION_NECESIDADES',
  'MAPA_RELACIONES',
  'RESUMEN_IA',
  'FINALIZADO',
]

export const PHASE_LABELS: Record<Phase, string> = {
  REGISTRO: 'Registro de cooperativas',
  CUESTIONARIO: 'Cuestionario Intercoop',
  JUEGO_OFERTA: '¿Qué ofrecemos?',
  NUBE_DISPLAY: 'Nube de palabras (pantalla)',
  SELECCION_NECESIDADES: '¿Qué necesitamos?',
  MAPA_RELACIONES: 'Mapa de relaciones (pantalla)',
  RESUMEN_IA: 'Síntesis colectiva',
  FINALIZADO: 'Actividad finalizada',
}

// Ruta a la que va el usuario en cada fase
export const PHASE_USER_ROUTE: Record<Phase, string> = {
  REGISTRO: '/registro',
  CUESTIONARIO: '/cuestionario',
  JUEGO_OFERTA: '/oferta',
  NUBE_DISPLAY: '/espera',
  SELECCION_NECESIDADES: '/necesidades',
  MAPA_RELACIONES: '/espera',
  RESUMEN_IA: '/espera',
  FINALIZADO: '/gracias',
}

export function getNextPhase(current: Phase): Phase | null {
  const idx = PHASES.indexOf(current)
  return idx < PHASES.length - 1 ? PHASES[idx + 1] : null
}

export function getPrevPhase(current: Phase): Phase | null {
  const idx = PHASES.indexOf(current)
  return idx > 0 ? PHASES[idx - 1] : null
}

// Palabras predefinidas para el juego de oferta, agrupadas por categoría
export const PALABRAS_PREDEFINIDAS: Record<string, string[]> = {
  'Productos agrícolas': [
    'Frutas', 'Verduras', 'Miel', 'Lácteos', 'Carne', 'Aceite de oliva',
    'Nueces', 'Semillas', 'Vino', 'Frutas secas', 'Hierbas aromáticas', 'Hongos',
  ],
  'Alimentos elaborados': [
    'Panificados', 'Conservas', 'Dulces y mermeladas', 'Embutidos',
    'Quesos artesanales', 'Cerveza artesanal',
  ],
  'Materiales y construcción': [
    'Materiales de construcción', 'Madera', 'Herramientas', 'Maquinaria agrícola',
    'Equipamiento industrial', 'Insumos agrícolas',
  ],
  'Servicios profesionales': [
    'Asesoramiento legal', 'Asesoramiento contable', 'Capacitación',
    'Comunicación y diseño', 'Tecnología', 'Gestión de proyectos',
  ],
  'Servicios operativos': [
    'Transporte', 'Logística', 'Almacenamiento', 'Distribución',
    'Mantenimiento', 'Limpieza', 'Seguridad',
  ],
  'Espacio físico': [
    'Salón de eventos', 'Galpón / depósito', 'Terreno', 'Oficinas',
    'Espacio de trabajo compartido', 'Cocina industrial',
  ],
  'Trabajo': [
    'Mano de obra', 'Albañilería', 'Electricidad', 'Plomería',
    'Carpintería', 'Pintura', 'Costura y textil', 'Jardinería',
  ],
  'Comunidad y red': [
    'Redes de contacto', 'Acceso a mercados', 'Formación cooperativa',
    'Turismo social', 'Salud comunitaria', 'Educación popular',
    'Cultura y arte', 'Deporte',
  ],
}

export const MAX_NECESIDADES = 10

export const RUBRO_LABELS: Record<string, string> = {
  trabajo: 'Trabajo',
  consumo: 'Consumo',
  servicios: 'Servicios',
  vivienda: 'Vivienda',
  produccion: 'Producción',
}

export const RUBRO_COLORS: Record<string, string> = {
  trabajo: '#ef4444',
  consumo: '#3b82f6',
  servicios: '#8b5cf6',
  vivienda: '#f59e0b',
  produccion: '#10b981',
}
