import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        deep: '#2d1b4e',
        gold: '#c9a84c',
        cream: '#fdf8f0',
        rose: '#e8627a',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        sinhala: ['var(--font-sinhala)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #2d1b4e 0%, #5a2d6b 40%, #c9a84c 100%)',
        'gold-gradient': 'linear-gradient(135deg, #c9a84c, #e8b860)',
      },
      boxShadow: {
        'gold': '0 8px 20px rgba(201, 168, 76, 0.35)',
        'deep': '0 8px 20px rgba(45, 27, 78, 0.2)',
        'card': '0 4px 20px rgba(45, 27, 78, 0.08)',
        'card-hover': '0 16px 40px rgba(45, 27, 78, 0.14)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
