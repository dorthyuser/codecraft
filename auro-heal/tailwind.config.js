/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'Helvetica Neue', 'Helvetica', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        canvas:      '#f6f4ef',
        raised:      '#fffdf8',
        sunken:      '#ece9e1',
        line:        '#e3ddd0',
        lines:       '#ecead9',
        ink:         '#161614',
        'ink-soft':  '#4a4944',
        'ink-mute':  '#8a877e',
        'ink-faint': '#b8b4a8',
        teal: {
          DEFAULT: '#5eb9ae',
          soft:    '#e8f5f3',
          deep:    '#1d8f8c',
        },
        coral: {
          DEFAULT: '#d9745a',
          soft:    '#fceee9',
          deep:    '#a03a20',
        },
        amber: {
          DEFAULT: '#c9a84c',
          soft:    '#fdf6e3',
          deep:    '#7a5c10',
        },
      },
      borderRadius: {
        sm:  '6px',
        DEFAULT: '10px',
        lg:  '14px',
        xl:  '18px',
      },
      boxShadow: {
        card:  '0 1px 0 rgba(20,18,12,.04), 0 8px 28px -16px rgba(20,18,12,.10)',
        modal: '0 30px 80px -20px rgba(20,18,12,.30), 0 4px 12px -4px rgba(20,18,12,.15)',
      },
      keyframes: {
        pulse2: {
          '0%':   { boxShadow: '0 0 0 0 rgba(94,185,174,0.4)' },
          '70%':  { boxShadow: '0 0 0 8px rgba(94,185,174,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(94,185,174,0)' },
        },
        ring: {
          '0%':   { transform: 'scale(0.85)', opacity: '0.9' },
          '100%': { transform: 'scale(1.25)', opacity: '0' },
        },
        slidein: {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.985)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        fadein: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        pulse2:  'pulse2 2.4s infinite',
        ring:    'ring 1.6s ease-out infinite',
        slidein: 'slidein 0.24s cubic-bezier(0.16,1,0.3,1)',
        fadein:  'fadein 0.18s ease',
        spin:    'spin 0.8s linear infinite',
      },
    },
  },
  plugins: [],
};
