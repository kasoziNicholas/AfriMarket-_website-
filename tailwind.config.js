const plugin = require('tailwindcss/plugin');
module.exports = {
  darkMode: 'class',
  content: ['./public/**/*.{html,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      },
      colors: { brand: { navy: '#0b132b' } }
    }
  },
  plugins: [
    // `light:` variant, active when <html class="light">
    plugin(({ addVariant }) => addVariant('light', '.light &'))
  ]
};
