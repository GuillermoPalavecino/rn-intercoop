'use client'

interface WaitingScreenProps {
  title: string
  subtitle?: string
}

export default function WaitingScreen({ title, subtitle = 'Quedate conectado para los próximos pasos.' }: WaitingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-700 to-teal-600 flex flex-col items-center justify-center px-6 text-center text-white">
      <div className="w-24 h-24 bg-white/15 backdrop-blur rounded-full flex items-center justify-center mb-8 ring-4 ring-white/20">
        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold mb-3 leading-tight">{title}</h2>
      <p className="text-white/75 text-base max-w-xs leading-relaxed">{subtitle}</p>

      <div className="mt-12 flex gap-2.5">
        <div className="w-2.5 h-2.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2.5 h-2.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '160ms' }} />
        <div className="w-2.5 h-2.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '320ms' }} />
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-white/30 text-xs">Intercoop FECORN · Río Negro</p>
      </div>
    </div>
  )
}
