import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: '#111827',
        panelSoft: '#1f2937',
        borderSoft: '#374151',
        accent: '#2563eb'
      }
    }
  },
  plugins: [typography]
};
