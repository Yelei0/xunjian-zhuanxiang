/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,ts,tsx}',
    './skills/**/*.{vue,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#F8FAFC',
          50: '#F1F5F9',
          100: '#E2E8F0',
          200: '#CBD5E1',
          300: '#94A3B8',
        },
        ink: {
          DEFAULT: '#0F172A',
          900: '#020617',
          800: '#0F172A',
          700: '#1E293B',
          600: '#334155',
          500: '#475569',
          400: '#64748B',
        },
        brand: {
          DEFAULT: '#2563EB',
          50: 'rgba(37, 99, 235, 0.05)',
          100: 'rgba(37, 99, 235, 0.1)',
          200: 'rgba(37, 99, 235, 0.2)',
          400: '#3B82F6',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        status: {
          success: '#10B981',
          warn: '#F59E0B',
          danger: '#EF4444',
          info: '#3B82F6',
          neutral: '#6B7280',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.3)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.06)',
        'topbar': '0 1px 0 rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.02)',
      },
    },
  },
  plugins: [],
}
