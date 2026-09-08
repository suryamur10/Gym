/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0F1115',
        surface: '#181B21',
        'surface-2': '#20242D',
        'surface-3': '#272C37',
        border: '#2C323E',
        'border-soft': '#232833',
        text: '#EEF1F6',
        muted: '#8B94A5',
        'muted-2': '#616A79',
        accent: {
          DEFAULT: '#FF5A1F',
          hover: '#E64C14',
        },
        win: '#31C06B',
        loss: '#FF5261',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Barlow', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '14px',
      },
      backgroundImage: {
        'tier-bronze': 'linear-gradient(135deg, #E8B98A 0%, #B07636 100%)',
        'tier-gold': 'linear-gradient(135deg, #F7D268 0%, #C8933A 100%)',
        'tier-silver': 'linear-gradient(135deg, #E4E9F0 0%, #9AA4B4 100%)',
        'tier-platinum': 'linear-gradient(135deg, #8FE3D6 0%, #3FA0C4 100%)',
      },
      boxShadow: {
        glow: '0 0 120px 40px rgba(255, 90, 31, 0.18)',
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.5)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
