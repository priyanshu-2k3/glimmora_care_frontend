import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Palette - Foundation
        ivory: {
          cream: '#FAF8F5',
          warm: '#F5F1EA',
        },
        parchment: '#EDE8DF',
        sand: {
          light: '#E5DFD3',
          DEFAULT: '#D4CBBF',
        },
        taupe: '#B8AEA0',
        greige: '#9A8F82',
        stone: '#7A7068',
        charcoal: {
          warm: '#4A453D',
          deep: '#2D2A26',
        },
        noir: '#1A1816',
        'dark-espresso': '#1E120D',

        // Accent Palette - Intelligence Signal
        gold: {
          soft: '#C9A962',
          muted: '#B89B4A',
          deep: '#9A7F35',
          primary: '#C89B3C',
          hover: '#B8862E',
        },
        champagne: '#E8DCC4',
        bronze: {
          whisper: '#A8927A',
        },
        sapphire: {
          mist: '#4A5568',
          subtle: '#5C6B7A',
          deep: '#2C3E50',
        },
        azure: {
          whisper: '#E8ECF0',
        },

        // Premium accent colors for stat cards / charts
        ocean:   { DEFAULT: '#2563EB', soft: '#DBEAFE', muted: '#1D4ED8' },
        teal:    { DEFAULT: '#0D9488', soft: '#CCFBF1', muted: '#0F766E' },
        coral:   { DEFAULT: '#DC2626', soft: '#FEE2E2', muted: '#B91C1C' },
        emerald: { DEFAULT: '#059669', soft: '#D1FAE5', muted: '#047857' },
        violet:  { DEFAULT: '#7C3AED', soft: '#EDE9FE', muted: '#6D28D9' },
        amber:   { DEFAULT: '#D97706', soft: '#FEF3C7', muted: '#B45309' },

        // Semantic Palette
        success: {
          soft: '#6B8068',
          DEFAULT: '#4A6347',
          vivid: '#52A87A',
        },
        warning: {
          soft: '#C4A35A',
          DEFAULT: '#A68B3D',
        },
        error: {
          soft: '#A67272',
          DEFAULT: '#8B5252',
          vivid: '#B07278',
        },
        info: {
          soft: '#6B7A8A',
          DEFAULT: '#4A5A6A',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'md': '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
        'lg': '0 12px 32px rgba(0, 0, 0, 0.10), 0 4px 12px rgba(0, 0, 0, 0.06)',
        'xl': '0 24px 64px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)',
      },
      backgroundImage: {
        'ivory-flow': 'linear-gradient(135deg, #FAF8F5 0%, #EDE8DF 100%)',
        'gold-whisper': 'linear-gradient(135deg, #E8DCC4 0%, #C9A962 100%)',
        'intelligence-depth': 'linear-gradient(180deg, #2C3E50 0%, #4A5568 100%)',
        'noir-editorial': 'linear-gradient(135deg, #1A1816 0%, #2D2A26 50%, #4A453D 100%)',
        'dawn-luxury': 'linear-gradient(135deg, #E8ECF0 0%, #FAF8F5 50%, #E8DCC4 100%)',
        'gold-aura': 'linear-gradient(180deg, rgba(201, 169, 98, 0.1) 0%, rgba(250, 248, 245, 0) 100%)',
        'hero-dark': 'linear-gradient(135deg, #1E1A16 0%, #2D2A26 60%, #3D3830 100%)',
        'ocean-card': 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
        'teal-card':  'linear-gradient(135deg, #134E4A 0%, #0D9488 100%)',
        'violet-card':'linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)',
        'coral-card': 'linear-gradient(135deg, #7F1D1D 0%, #DC2626 100%)',
        'emerald-card':'linear-gradient(135deg, #064E3B 0%, #059669 100%)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.5s ease forwards',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
