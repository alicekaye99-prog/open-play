/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        night: {
          950: '#070b14',
          900: '#0b1220',
          800: '#111c30',
          700: '#1e2e4a',
        },
        court: {
          surface: '#0c2e1b',
          border: '#1b4d2e',
        },
        stadium: {
          amber: '#fbbf24',
          glow: '#f59e0b',
        },
        win: '#2dd4bf',
        ball: '#f97316',
      },
      fontFamily: {
        scoreboard: ['var(--font-scoreboard)', 'Oswald', 'Impact', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
