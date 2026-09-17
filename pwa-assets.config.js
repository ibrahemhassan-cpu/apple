import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

/* app icons for the home screen, made from public/icon.svg: npx pwa-assets-generator */
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: '#5BB3E6' } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: '#5BB3E6' } },
  },
  images: ['public/icon.svg'],
});
