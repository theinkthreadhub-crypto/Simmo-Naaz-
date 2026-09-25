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
        background: '#100402',
        foreground: '#ffffff',
        mentra: {
          'bg-deep': '#100402',
          'bg-dark': '#1a0803',
          'surface-warm': '#271007',
          orange: '#ff4a00',
          'orange-glow': 'rgba(255, 74, 0, 0.45)',
          amber: '#ff8a1f',
          'amber-soft': '#ffb15a',
          text: '#ffffff',
          'text-secondary': 'rgba(255, 255, 255, 0.72)',
          muted: 'rgba(255, 255, 255, 0.46)',
          hairline: 'rgba(255, 255, 255, 0.12)',
          glass: 'rgba(56, 20, 6, 0.42)',
          'glass-strong': 'rgba(34, 11, 3, 0.68)',
          'hairline-orange': 'rgba(255, 74, 0, 0.3)',
          emerald: '#10b981',
          rose: '#f43f5e'
        }
      },
      fontFamily: {
        display: ['Inter Tight', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'float-slow': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
