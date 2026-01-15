import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AdBuddy',
    short_name: 'AdBuddy',
    description: 'AdBuddy - Turning Diagnosis Into Direction',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/assets/images/adbuddy_logo_small_192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/assets/images/adbuddy_logo_small_512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/assets/images/adbuddy_logo_small_512x512.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
