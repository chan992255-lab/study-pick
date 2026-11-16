/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: { xs: '400px' },
      fontFamily: {
        sans: [
          'Pretendard',
          'Pretendard Variable',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Apple SD Gothic Neo',
          'Malgun Gothic',
          'sans-serif',
        ],
      },
      colors: {
        night: {
          950: '#05070d',
          900: '#080d18',
          850: '#0b1220',
          800: '#101a2c',
          750: '#152136',
          700: '#1b2a44',
        },
        mint: {
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
        },
        sky: {
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
        },
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 18px 40px -24px rgba(0,0,0,0.9)',
        glow: '0 0 40px -8px rgba(34,211,238,0.45)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.86)' },
          '60%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(16px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out',
        'slide-up': 'slide-up 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        pop: 'pop 260ms ease-out',
        'toast-in': 'toast-in 220ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
