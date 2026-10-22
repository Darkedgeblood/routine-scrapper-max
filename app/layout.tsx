import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

// Inter is the fallback font for non-Apple devices (Android/Windows).
// Apple devices use the real SF Pro via the system font stack in globals.css.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Routine Scrapper Max',
  description: 'A live class routine for CSE Batch 69 and MAT211 retake sessions.',
  generator: 'v0.app',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Routine Scrapper Max',
  },
  icons: {
    icon: '/app-icon.png',
    apple: '/app-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark light',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`antialiased ${inter.variable}`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(function(error) {
                console.error('Service worker registration failed', error);
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
