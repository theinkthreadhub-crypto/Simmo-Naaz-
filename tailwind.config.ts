import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#070a12',
        foreground: '#f8fafc',
        amber: {
          200: '#c7d2fe',
        },
        mentra: {
          'bg-deep': '#070a12',
          'bg-dark': '#0a0f1c',
          'surface-warm': '#101728',
          orange: '#5b6cff',
          'orange-glow': 'rgba(91, 108, 255, 0.38)',
          amber: '#67e8f9',
          'amber-soft': '#a5b4fc',
          text: '#f8fafc',
          'text-secondary': 'rgba(248, 250, 252, 0.72)',
          muted: 'rgba(248, 250, 252, 0.46)',
          hairline: 'rgba(255, 255, 255, 0.10)',
          glass: 'rgba(10, 15, 28, 0.58)',
          'glass-strong': 'rgba(8, 12, 22, 0.84)',
          'hairline-orange': 'rgba(91, 108, 255, 0.30)',
          emerald: '#10b981',
          rose: '#f43f5e'
        }
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        rise: 'rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        sweep: 'sweep 1.8s ease-in-out infinite',
        'node-ping': 'node-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(14px)', filter: 'blur(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'node-ping': {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(3)', opacity: '0' },
        },
      }
    },
  },
  plugins: [],
};

export default config;
