import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Routine Scrapper Max',
    short_name: 'Routine Max',
    description: 'CSE Batch 69 Class Routine',
    start_url: '/',
    id: '/',
    display: 'standalone',
    background_color: '#030712',
    theme_color: '#06b6d4',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
