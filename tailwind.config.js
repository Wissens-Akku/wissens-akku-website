/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./episode/**/*.html",
    "./kategorie/**/*.html"
  ],
  theme: {
    extend: {
        fontFamily: {
            'sans': ['Roboto', 'sans-serif'],
            'heading': ['Montserrat', 'sans-serif'],
        },
        
    },
  },
  plugins: [],
}