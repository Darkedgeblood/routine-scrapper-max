import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Routine Scrapper Max',
  description: 'A live class routine for CSE Batch 69.',
  generator: 'v0.app',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Routine Scrapper Max',
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
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
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
