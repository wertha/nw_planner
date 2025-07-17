/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,svelte}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'nw-gold': '#c8aa6e',
        'nw-blue': '#4d79a4',
        'nw-red': '#b91c1c',
        'marauder': '#dc2626',
        'covenant': '#eab308',
        'syndicate': '#7c3aed'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} 