/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Unbounded Variable"', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        pink: { DEFAULT: '#ff2d87' },
        violet: { DEFAULT: '#7c3aed' },
        cyan: { DEFAULT: '#06b6d4' },
        gold: { DEFAULT: '#fbbf24', light: '#d4a017' },
      },
    },
  },
  plugins: [],
};
