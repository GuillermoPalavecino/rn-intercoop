'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Rubro } from '@/types'
import { RUBRO_LABELS } from '@/lib/phase'
import PhaseGate from '@/components/PhaseGate'
import WaitingScreen from '@/components/WaitingScreen'

const schema = z.object({
  nombre_contacto: z.string().min(2, 'Ingresá tu nombre completo'),
  telefono: z.string().min(6, 'Ingresá un teléfono válido'),
  nombre_cooperativa: z.string().min(2, 'Ingresá el nombre de la cooperativa'),
  ciudad: z.string().min(2, 'Ingresá la ciudad'),
  direccion: z.string().min(4, 'Ingresá la dirección'),
  rubro: z.enum(['trabajo', 'consumo', 'servicios', 'vivienda', 'produccion'] as [Rubro, ...Rubro[]]),
  actividad_especifica: z.string().min(5, 'Describí brevemente a qué se dedican'),
})

type FormData = z.infer<typeof schema>

const RUBROS: { value: Rubro; label: string; icon: string }[] = [
  { value: 'trabajo', label: 'Trabajo', icon: '🔧' },
  { value: 'consumo', label: 'Consumo', icon: '🛒' },
  { value: 'servicios', label: 'Servicios', icon: '⚡' },
  { value: 'vivienda', label: 'Vivienda', icon: '🏠' },
  { value: 'produccion', label: 'Producción', icon: '🌱' },
]

export default function RegistroPage() {
  const [selfie, setSelfie] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const rubroActual = watch('rubro')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    try {
      let selfie_url: string | undefined

      if (selfie) {
        const fd = new FormData()
        fd.append('file', selfie)
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        if (upRes.ok) {
          const { url } = await upRes.json()
          selfie_url = url
        }
      }

      const res = await fetch('/api/cooperativas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, selfie_url }),
      })

      if (!res.ok) throw new Error('Error al registrar')

      const cooperativa = await res.json()
      localStorage.setItem('cooperativa_id', cooperativa.id)
      setDone(true)
    } catch {
      setError('Hubo un problema al registrar. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <PhaseGate expectedPhase="REGISTRO">
        <WaitingScreen
          title="¡Registro completado!"
          subtitle="Tu cooperativa fue registrada. El facilitador habilitará el siguiente paso en breve."
        />
      </PhaseGate>
    )
  }

  return (
    <PhaseGate expectedPhase="REGISTRO">
      <main className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-700 via-green-600 to-teal-600 px-5 pt-12 pb-8">
          <div className="flex items-center gap-2 mb-5">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i === 1 ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">Paso 1 de 4</p>
          <h1 className="text-white text-2xl font-bold leading-tight">Registrá tu cooperativa</h1>
          <p className="text-white/75 text-sm mt-1.5">Completá los datos para participar de la actividad</p>
        </div>

        <div className="px-4 py-6 pb-10 max-w-lg mx-auto space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <Section title="Datos de contacto">
              <Field label="Tu nombre completo" error={errors.nombre_contacto?.message}>
                <Input {...register('nombre_contacto')} placeholder="Ej: María González" />
              </Field>
              <Field label="Teléfono" error={errors.telefono?.message}>
                <Input {...register('telefono')} type="tel" placeholder="Ej: 2984 123456" />
              </Field>
            </Section>

            <Section title="Datos de la cooperativa">
              <Field label="Nombre de la cooperativa" error={errors.nombre_cooperativa?.message}>
                <Input {...register('nombre_cooperativa')} placeholder="Ej: Cooperativa La Esperanza" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ciudad" error={errors.ciudad?.message}>
                  <Input {...register('ciudad')} placeholder="Ej: Bariloche" />
                </Field>
                <Field label="Dirección" error={errors.direccion?.message}>
                  <Input {...register('direccion')} placeholder="Ej: San Martín 450" />
                </Field>
              </div>
            </Section>

            <Section title="Rubro principal" error={errors.rubro?.message}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {RUBROS.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setValue('rubro', r.value, { shouldValidate: true })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      rubroActual === r.value
                        ? 'border-green-600 bg-green-50 text-green-800'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Actividad específica">
              <Field error={errors.actividad_especifica?.message}>
                <textarea
                  {...register('actividad_especifica')}
                  rows={3}
                  placeholder="¿A qué se dedican puntualmente? Ej: Producción y venta de frutas finas de la región..."
                  className={inputClass}
                />
              </Field>
            </Section>

            <Section title="Foto del equipo">
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-300 bg-white cursor-pointer hover:border-green-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => setSelfie(e.target.files?.[0] ?? null)}
                />
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📷</span>
                </div>
                <div>
                  {selfie ? (
                    <p className="text-green-700 text-sm font-medium">✓ {selfie.name}</p>
                  ) : (
                    <>
                      <p className="text-gray-700 text-sm font-medium">Selfie del equipo</p>
                      <p className="text-gray-400 text-xs">Opcional · Tocá para elegir una foto</p>
                    </>
                  )}
                </div>
              </label>
            </Section>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-700 to-teal-600 text-white font-bold py-4 rounded-2xl text-base shadow-lg shadow-green-900/20 hover:shadow-green-900/30 disabled:opacity-60 transition-all active:scale-[0.99]"
            >
              {loading ? 'Registrando...' : 'Registrar mi cooperativa →'}
            </button>
          </form>
        </div>
      </main>
    </PhaseGate>
  )
}

function Section({ title, error, children }: { title?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
      {title && <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</h3>}
      {children}
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )
}

function Field({ label, error, children }: { label?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-medium text-gray-500">{label}</label>}
      {children}
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputClass} />
}

const inputClass = 'w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 transition-colors'
