import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, DM_Mono } from 'next/font/google'
import { Header } from '@/components/header'
import './globals.css'

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

export const metadata: Metadata = {
  title: 'PROJUS · Projeto Justiça Aberta · ICONS',
  description:
    'Cartografia do contencioso constitucional brasileiro. Mapeamento jurisprudencial das decisões do STF desde 1988. Instituto Constituição Aberta – ICONS.',
  openGraph: {
    title: 'PROJUS · Cartografia do Contencioso Constitucional',
    description: '9.014 decisões do STF mapeadas. Padrões de decidibilidade, oscilação jurisprudencial e linhas decisórias por artigo.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable} antialiased`}
    >
      <body className="min-h-full font-sans">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}
