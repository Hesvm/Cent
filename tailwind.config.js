/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          page: 'var(--color-bg-page)',
          card: 'var(--color-bg-card)',
          elevated: 'var(--color-bg-elevated)',
          secondary: 'var(--color-bg-secondary)',
          tag: 'var(--color-bg-tertiary)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          hint: 'var(--color-text-hint)',
          tag: '#A4A297',
        },
        income: {
          DEFAULT: 'var(--color-income)',
          icon: '#43A047',
        },
        expense: {
          DEFAULT: 'var(--color-expense)',
          icon: 'var(--color-expense)',
        },
        send: 'var(--color-send-btn)',
        divider: '#E3E3DE',
        border: 'var(--color-border)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
        rounded: ["'SF Pro Rounded'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
      },
      borderRadius: {
        pill: '100px',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.35s cubic-bezier(0.32,0.72,0,1)',
      },
    },
  },
  plugins: [],
}
