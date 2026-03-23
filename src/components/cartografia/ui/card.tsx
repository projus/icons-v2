'use client'

export function Card({ title, children, className = '' }: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-md border border-black/[.12] bg-white p-5 shadow-[0_2px_24px_rgba(15,14,13,.08)] ${className}`}>
      <div className="mb-4 border-b border-black/[.12] pb-2 font-mono text-[9px] font-medium uppercase tracking-[.12em] text-stone">
        {title}
      </div>
      {children}
    </div>
  )
}

export function MetricCard({ label, value, sub }: {
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="relative overflow-hidden rounded-md bg-navy p-5 text-paper">
      <div className="absolute bottom-0 right-0 h-[60px] w-[60px] rounded-tl-full bg-gold opacity-[.08]" />
      <div className="font-mono text-[9px] uppercase tracking-widest text-paper/45 mb-1.5">{label}</div>
      <div className="font-serif text-[32px] font-black leading-none text-gold-light">{value}</div>
      <div className="mt-1 font-mono text-[10px] text-paper/40">{sub}</div>
    </div>
  )
}
