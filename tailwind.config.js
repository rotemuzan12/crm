/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/src/**/*.{js,ts,jsx,tsx}',
    './src/renderer/index.html'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Rubik', 'Arial', 'sans-serif']
      },
      colors: {
        sidebar: '#0f172a'
      }
    }
  },
  plugins: []
}
