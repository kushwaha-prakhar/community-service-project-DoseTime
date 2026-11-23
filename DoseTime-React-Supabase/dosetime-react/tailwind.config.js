/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a1414',
        card: '#122222',
        input: '#0d1a1a',
        border: '#1e3333',
        teal: {
          DEFAULT: '#14b8a6',
          light: '#2dd4bf',
          dark: '#0d9488',
        }
      }
    },
  },
  plugins: [],
}
