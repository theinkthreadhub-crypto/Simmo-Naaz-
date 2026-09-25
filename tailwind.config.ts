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
        background: '#090B0F',
        foreground: '#F5F7FA',
        mentra: {
          'bg-deep': '#090B0F',
          'bg-dark': '#10131A',
          'surface-warm': '#161A22',
          surface: '#161A22',
          elevated: '#1C212B',
          border: '#292F3B',
          orange: '#B7FF3C',
          'orange-glow': 'rgba(183, 255, 60, 0.18)',
          amber: '#B7FF3C',
          'amber-soft': '#D4FF88',
          ai: '#7C8CFF',
          text: '#F5F7FA',
          'text-secondary': '#A1A8B5',
          muted: '#697181',
          hairline: '#292F3B',
          glass: '#161A22',
          'glass-strong': '#1C212B',
          'hairline-orange': 'rgba(183, 255, 60, 0.30)',
          emerald: '#4DDB8A',
          rose: '#FF5C5C',
          warning: '#FFB020',
        },
      },
      fontFamily: {
        display: ['Archivo Black', 'Arial Black', 'sans-serif'],
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'float-slow': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
