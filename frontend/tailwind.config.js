/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A0B10',
          900: '#0F1117',
          800: '#161923',
          700: '#1E2230',
          600: '#2A2F42',
        },
        violet: {
          400: '#8B7FFF',
          500: '#6D5EF8',
          600: '#5647E0',
          700: '#4636C4',
        },
        mint: {
          400: '#4ADE9C',
          500: '#22C58C',
        },
        amber: {
          400: '#FFB547',
          500: '#F59E0B',
        },
        coral: {
          400: '#FF6B6B',
          500: '#F5484D',
        },
      },
      fontFamily: {
        display: ['"Clash Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(109,94,248,0.15), 0 8px 30px -8px rgba(109,94,248,0.35)',
        card: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.12)',
      },
      backgroundImage: {
        'grid-glow': 'radial-gradient(circle at 50% 0%, rgba(109,94,248,0.18), transparent 60%)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.4)', opacity: '0' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        flip: {
          '0%': { transform: 'rotateX(0deg)' },
          '100%': { transform: 'rotateX(360deg)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'slide-up': 'slide-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
