export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#6C4BFF',
          pink: '#FF6BCE',
          'purple-light': '#9B7BFF',
          'pink-light': '#FF8FDC',
        },
        dark: {
          bg: '#0F1724',
          card: '#1A2332',
          text: '#8B93A6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'],
      },
      boxShadow: {
        'premium': '0 8px 32px rgba(108, 75, 255, 0.12)',
        'premium-hover': '0 16px 48px rgba(108, 75, 255, 0.20)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        'glow': '0 0 30px rgba(108, 75, 255, 0.4)',
        'glow-pink': '0 0 30px rgba(255, 107, 206, 0.4)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      animation: {
        'gradient-x': 'gradientX 8s ease infinite',
        'gradient-shimmer': 'gradientShimmer 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'ripple': 'ripple 0.6s ease-out',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
      },
      keyframes: {
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        gradientShimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(108, 75, 255, 0.4), 0 0 40px rgba(255, 107, 206, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(108, 75, 255, 0.6), 0 0 60px rgba(255, 107, 206, 0.4)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
