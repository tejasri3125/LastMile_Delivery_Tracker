/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F2F7F4',
          100: '#E7F1EB',
          200: '#C5DEC9',
          500: '#176B4D',
          600: '#0F5138',
          700: '#0B3E2B',
          800: '#082E20',
          900: '#041B13',
        },
        sage: '#E7F1EB',
        offwhite: '#F8FAF7',
        charcoal: '#1F2933',
        muted: '#667085',
        success: '#2E7D5B',
        warning: '#F2B84B',
        failed: '#D9534F'
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'sans-serif'],
        heading: ['Manrope', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

