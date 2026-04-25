/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          page: '#FBFBF8',
          card: '#FFFFFF',
          tag: '#F4F4F3',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#888888',
          hint: '#AAAAAA',
          tag: '#A4A297',
        },
        income: {
          DEFAULT: '#2E7D32',
          icon: '#43A047',
        },
        expense: {
          DEFAULT: '#D32F2F',
          icon: '#D32F2F',
        },
        send: '#E8403A',
        divider: '#E3E3DE',
        border: '#E5E5E5',
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
