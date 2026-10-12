/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand
        navy: {
          950: 'hsl(228 45% 5%)',
          900: 'hsl(228 40% 8%)',
          800: 'hsl(228 35% 12%)',
          700: 'hsl(228 30% 18%)',
          600: 'hsl(228 25% 25%)',
        },
        // Model accents
        model: {
          rf:  '#10b981', // emerald - Random Forest
          ada: '#f59e0b', // amber   - AdaBoost
          gb:  '#8b5cf6', // violet  - Gradient Boosting
          bag: '#38bdf8', // sky     - Bagging
          mlp: '#f43f5e', // rose    - MLP
        },
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
        'fade-up':    'fadeUp 0.6s ease forwards',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
