/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        bg: '#0a0a0c',
        surface: '#131316',
        hairline: 'rgba(255,255,255,0.08)',
        line: 'rgba(255,255,255,0.14)',
        text: '#f5f5f7',
        muted: 'rgba(245,245,247,0.60)',
        dim: 'rgba(245,245,247,0.40)',
        tron: '#7dd3fc',
        grid: '#0ea5e9',
        accent: '#0a84ff',
      },
      fontFamily: {
        display: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
};
