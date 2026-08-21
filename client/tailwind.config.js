/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // English glyphs use the Latin font; Telugu glyphs fall back to Anek Telugu.
        sans: ['Plus Jakarta Sans', 'Anek Telugu', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Anek Telugu', 'Plus Jakarta Sans', 'sans-serif'],
        telugu: ['Anek Telugu', 'Noto Sans Telugu', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        kl: {
          red: '#C8102E',
          gold: '#F4B400',
        },
      },
      boxShadow: {
        glow: '0 20px 60px -15px rgba(99, 102, 241, 0.45)',
        card: '0 10px 40px -12px rgba(30, 27, 75, 0.25)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-22px)' },
        },
        aurora: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-40px) scale(1.1)' },
          '66%': { transform: 'translate(-20px,20px) scale(0.95)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
};
