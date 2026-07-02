'use client'

export const dynamic = 'force-dynamic'

export default function GraciasPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-700 to-teal-600 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center text-white py-16">
        <div className="w-28 h-28 bg-white/15 backdrop-blur rounded-full flex items-center justify-center mb-8 ring-4 ring-white/20">
          <span className="text-5xl">🌱</span>
        </div>

        <h1 className="text-3xl font-bold mb-4 leading-tight">
          ¡Gracias por<br />participar!
        </h1>
        <p className="text-white/80 text-base max-w-xs leading-relaxed mb-10">
          Tu cooperativa ya forma parte de la red de intercooperación de Río Negro.
          Juntos construimos un movimiento más fuerte.
        </p>

        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-6 w-full max-w-xs text-left space-y-1">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Organizado por</p>
          <p className="text-white font-bold text-xl">FECORN</p>
          <p className="text-white/70 text-sm">Federación de Cooperativas de Río Negro</p>
        </div>
      </div>

      <div className="pb-8 text-center">
        <p className="text-white/30 text-xs">Intercoop FECORN · Río Negro</p>
      </div>
    </main>
  )
}
