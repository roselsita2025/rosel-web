/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'cinzel': ['Cinzel Decorative', 'serif'],
        'nexa': ['Nexa Script', 'cursive'],
        'magnolia': ['Magnolia Script', 'cursive'],
        'alice': ['Alice', 'serif'],
        'libre': ['Libre Baskerville', 'serif'],
      },
    },
  },
  plugins: [],
}