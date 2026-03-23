import Link from 'next/link'

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gold/20 bg-[rgba(26,39,68,.97)] backdrop-blur-md">
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center gap-8 px-8">
        <Link href="/" className="flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="shrink-0 rounded-lg">
            <rect width="200" height="200" rx="28" fill="#1a2744"/>
            <rect x="36" y="36" width="18" height="128" rx="4" fill="#d4a017"/>
            <rect x="146" y="36" width="18" height="128" rx="4" fill="#d4a017"/>
            <rect x="36" y="91" width="128" height="18" rx="4" fill="#d4a017" opacity="0.35"/>
            <rect x="82" y="82" width="36" height="36" rx="6" fill="#d4a017"/>
          </svg>
          <div>
            <div className="font-mono text-xs font-medium tracking-wider text-gold-light">ICONS</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-paper/40">Instituto Constituição Aberta</div>
          </div>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 sm:flex">
          <Link href="#ferramentas" className="font-mono text-[10px] tracking-wider text-paper/50 transition-colors hover:text-gold-light">
            Ferramentas
          </Link>
          <Link href="#metodologia" className="font-mono text-[10px] tracking-wider text-paper/50 transition-colors hover:text-gold-light">
            Metodologia
          </Link>
          <Link href="#sobre" className="font-mono text-[10px] tracking-wider text-paper/50 transition-colors hover:text-gold-light">
            Sobre
          </Link>
          <Link
            href="/constituicao"
            className="rounded-[3px] border border-gold/40 px-3 py-1 font-mono text-[10px] tracking-wider text-gold-light transition-colors hover:bg-gold/10"
          >
            Acessar →
          </Link>
        </nav>
      </div>
    </header>
  )
}
