import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Routine Scrapper Max',
  description: 'A live class routine for CSE Batch 69 and MAT211 retake sessions.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Routine Scrapper Max',
  },
  icons: {
    icon: '/Gemini_Generated_Image_koho2skoho2skoho.jpg',
    apple: '/Gemini_Generated_Image_koho2skoho2skoho.jpg',
  },
}

export const viewport: Viewport = {
  themeColor: '#06b6d4',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
