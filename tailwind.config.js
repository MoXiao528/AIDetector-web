/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef5ff',
          100: '#dae8ff',
          200: '#b6d0ff',
          300: '#84afff',
          400: '#4c8bff',
          500: '#2563eb',
          600: '#1d4fd7',
          700: '#1b3eb1',
          800: '#1b358c',
          900: '#1a2f70'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glow: '0 20px 60px -15px rgba(37, 99, 235, 0.35)'
      }
    }
  },
  plugins: [],
};
