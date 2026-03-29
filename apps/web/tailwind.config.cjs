/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /* Typography - Wes Anderson Inspired */
      fontFamily: {
        display: ['Jost', 'Futura PT', 'Century Gothic', 'sans-serif'],
        body: ['Libre Baskerville', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },

      /* Color Palette - Organic Warmth */
      colors: {
        /* Primary Backgrounds */
        cream: '#FAF7F2',
        parchment: '#F5F0E6',

        /* Primary Accent */
        terracotta: {
          DEFAULT: '#C4785C',
          hover: '#B56A4E',
          light: '#D4917A',
        },

        /* Secondary Accents */
        forest: {
          DEFAULT: '#4A6741',
          light: '#5C7A53',
        },
        ink: {
          DEFAULT: '#2C2416',
          light: '#4A3D2E',
        },

        /* Supporting Colors */
        'dusty-rose': '#C9A9A6',
        mustard: {
          DEFAULT: '#D4A84B',
          light: '#E0BC6A',
        },
        'slate-blue': '#6B7B8C',
        rust: '#8B4D3B',
        sage: '#A3B18A',

        /* Divider (resolves 93 border-divider references) */
        divider: 'var(--divider, rgba(44, 36, 22, 0.12))',

        /* Pathway Card Backgrounds */
        'pathway-warm': '#F3EBE2',
        'pathway-teal': '#C3DED8',
        'pathway-slate': '#C4CFDE',
        'pathway-sage': '#D5DCBA',

        /* Sub-Persona Mode Colors */
        mode: {
          inquisitive: '#D4A84B',
          advocate: '#8B4D3B',
          encouraging: '#C9A9A6',
          realistic: '#6B7B8C',
        },

        /* shadcn/ui Compatibility */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },

      /* Border Radius - Organic, slightly rounded */
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },

      /* Box Shadow - Warm, soft */
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        inner: 'var(--shadow-inner)',
      },

      /* Spacing - 8px grid */
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },

      /* Typography Scale */
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', fontWeight: '500' }],
      },

      /* Line Height */
      lineHeight: {
        'relaxed': '1.65',
      },

      /* Transitions */
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms',
      },

      /* Animation */
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'board-pulse': 'board-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
