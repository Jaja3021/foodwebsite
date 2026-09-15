/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17120E',
        brown: '#241811',
        warm: '#4A2D1C',
        cream: '#F7F0E5',
        offwhite: '#FFFDF8',
        gold: '#FFB51B',
        golddark: '#E89A12',
        body: '#211A16',
      },
      fontFamily: {
        display: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(23,18,14,0.25)',
        lift: '0 20px 45px -20px rgba(23,18,14,0.45)',
        gold: '0 12px 28px -12px rgba(232,154,18,0.65)',
      },
      borderRadius: {
        xl2: '1.25rem',
        '4xl': '2rem',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.5s ease-out both',
        fadeIn: 'fadeIn 0.35s ease-out both',
        slideIn: 'slideIn 0.3s cubic-bezier(0.22,1,0.36,1) both',
        pop: 'pop 0.25s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
}
