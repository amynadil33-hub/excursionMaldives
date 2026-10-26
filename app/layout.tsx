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
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'Excursion Maldives',
  title: {
    default: 'Excursion Maldives — Book island tours, snorkeling & sea adventures',
    template: '%s | Excursion Maldives',
  },
  description:
    'The Maldives experiences marketplace. Book snorkeling, diving, sandbank picnics, dolphin cruises, island hopping and private trips from trusted local operators.',
  keywords: [
    'Maldives excursions',
    'Maldives tours',
    'snorkeling Maldives',
    'island hopping Maldives',
    'dolphin cruise Maldives',
    'private trips Maldives',
  ],
  creator: 'Excursion Maldives',
  publisher: 'Excursion Maldives',
  category: 'travel',
  icons: {
    icon: [{ url: '/images/logo.png', type: 'image/png' }],
    shortcut: ['/images/logo.png'],
    apple: [{ url: '/images/logo.png', type: 'image/png' }],
  },
  openGraph: {
    title: 'Excursion Maldives',
    description: 'Book the best excursions across the Maldives atolls.',
    siteName: 'Excursion Maldives',
    locale: 'en_US',
    type: 'website',
    images: ['/images/hero.png'],
  },
  twitter: {
    card: 'summary_large_image',
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
