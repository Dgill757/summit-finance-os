import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        canvas: '#080c14',
        surface: '#0e1520',
        panel: '#131c2e',
        border: '#1e2d42',
        teal: '#14b8a6',
        'teal-dim': '#0d6b62',
        'teal-glow': 'rgba(20,184,166,0.25)',
        'teal-bg': 'rgba(20,184,166,0.08)',
        primary: '#e8edf5',
        secondary: '#6b82a0',
        muted: '#3a4f68',
        up: '#22c55e',
        'up-bg': 'rgba(34,197,94,0.10)',
        down: '#ef4444',
        'down-bg': 'rgba(239,68,68,0.10)',
        warn: '#f59e0b',
        'warn-bg': 'rgba(245,158,11,0.10)',
        blue: '#3b82f6',
        'blue-bg': 'rgba(59,130,246,0.10)',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(30,45,66,0.6)',
        'glow-teal': '0 0 20px rgba(20,184,166,0.15)',
        elevated: '0 8px 32px rgba(0,0,0,0.5)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
