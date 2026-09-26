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
        src: '/Gemini_Generated_Image_koho2skoho2skoho.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/Gemini_Generated_Image_koho2skoho2skoho.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  }
}
