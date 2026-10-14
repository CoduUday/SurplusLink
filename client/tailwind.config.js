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
