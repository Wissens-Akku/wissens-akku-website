/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./episoden.html",
    "./datenschutz.html",
    "./impressum.html",
    "./success.html"
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