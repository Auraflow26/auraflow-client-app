import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#030305',
          secondary: '#0a0a0f',
          card: '#0c0a12',
          elevated: '#141220',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          light: '#a78bfa',
          bright: '#c4b5fd',
          glow: 'rgba(139,92,246,0.15)',
        },
        gold: '#d4af37',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        text: {
          primary: '#faf5ff',
          secondary: '#c4b5fd',
          muted: '#7c7291',
          dim: '#4a4458',
        },
        border: {
          DEFAULT: 'rgba(139,92,246,0.12)',
          active: 'rgba(139,92,246,0.35)',
        },
      },
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        input: '12px',
        pill: '100px',
      },
      boxShadow: {
        glow: '0 0 40px rgba(139,92,246,0.15)',
      },
    },
  },
  plugins: [],
}

export default config
