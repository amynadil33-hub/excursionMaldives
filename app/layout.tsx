import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Excursion Maldives — Book island tours, snorkeling & sea adventures',
    template: '%s | Excursion Maldives',
  },
  description:
    'The Maldives experiences marketplace. Book snorkeling, diving, sandbank picnics, dolphin cruises, island hopping and private trips from trusted local operators.',
  icons: { icon: '/images/logo.png', apple: '/images/logo.png' },
  openGraph: {
    title: 'Excursion Maldives',
    description: 'Book the best excursions across the Maldives atolls.',
    images: ['/images/hero.png'],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0089d2',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors position="top-center" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
