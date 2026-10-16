/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b'
        }
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 1.2s ease-out both',
        'fade-in-up': 'fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down': 'slideDown 1.0s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      borderColor: {
        slate: {
          50: 'rgb(58 61 67 / <alpha-value>)',
          100: 'rgb(58 61 67 / <alpha-value>)',
          200: 'rgb(58 61 67 / <alpha-value>)',
          300: 'rgb(58 61 67 / <alpha-value>)',
          400: 'rgb(58 61 67 / <alpha-value>)',
          500: 'rgb(58 61 67 / <alpha-value>)',
          600: 'rgb(58 61 67 / <alpha-value>)',
          700: 'rgb(58 61 67 / <alpha-value>)',
          800: 'rgb(58 61 67 / <alpha-value>)',
          900: 'rgb(58 61 67 / <alpha-value>)',
          950: 'rgb(58 61 67 / <alpha-value>)',
          DEFAULT: 'rgb(58 61 67 / <alpha-value>)',
        }
      }
    }
  },
  plugins: [],
};
