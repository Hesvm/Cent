/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          page: '#F0EEE8',
          card: '#FFFFFF',
          tag: '#EBEBEB',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#888888',
          hint: '#AAAAAA',
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
        divider: '#E0E0E0',
        border: '#E5E5E5',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
        rounded: ["'SF Pro Rounded'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
      },
      borderRadius: {
        pill: '100px',
      },
    },
  },
  plugins: [],
}
