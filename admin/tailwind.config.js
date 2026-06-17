/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        brand: {
          50: "#faf5f0",
          100: "#f3e8d8",
          200: "#e8d0b0",
          300: "#d9b07a",
          400: "#c8904a",
          500: "#b87333",
          600: "#9a5c25",
          700: "#7d4820",
          800: "#653a1e",
          900: "#52301c",
        },
      },
    },
  },
  plugins: [],
};
