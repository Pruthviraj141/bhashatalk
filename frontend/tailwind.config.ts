import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', ...fontFamily.sans],
        body: ['DM Sans', ...fontFamily.sans],
        mono: ['JetBrains Mono', ...fontFamily.mono],
      },
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        surface: {
          0: '#ffffff',
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        dark: {
          50: '#18181b',
          100: '#1e1e24',
          200: '#27272a',
          300: '#3f3f46',
          400: '#52525b',
          500: '#71717a',
        },
      },
      boxShadow: {
        chat: '0 1px 2px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        panel: '0 4px 24px rgba(0,0,0,0.08)',
        elevated: '0 8px 40px rgba(0,0,0,0.12)',
        'message-out': '0 1px 3px rgba(22,163,74,0.25)',
        'message-in': '0 1px 3px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        message: '18px',
        'message-tail-out': '18px 18px 4px 18px',
        'message-tail-in': '18px 18px 18px 4px',
      },
      animation: {
        typing: 'typing 1.4s ease-in-out infinite',
        'slide-up': 'slideUp 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'message-in-anim': 'messageIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        typing: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-6px)' },
        },
        slideUp: {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        messageIn: {
          from: { transform: 'scale(0.88) translateY(6px)', opacity: '0' },
          to: { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [typography, forms],
} satisfies Config;
