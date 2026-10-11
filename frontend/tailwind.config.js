/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#0B1120',
          sidebar: '#0F172A',
          card: '#111C30',
          elevated: '#162238',
        },
        accent: {
          blue: '#60A5FA',
          cyan: '#22D3EE',
        },
        content: {
          main: '#E5EDF7',
          muted: '#94A3B8',
        },
        border: {
          subtle: '#263449',
        },
        status: {
          success: '#34D399',
          warning: '#FBBF24',
          error: '#F87171',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
