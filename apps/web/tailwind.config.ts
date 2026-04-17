import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef7ff",
          100: "#d9edff",
          200: "#bce0ff",
          300: "#8ecdff",
          400: "#58b0ff",
          500: "#2f90fb",
          600: "#1a73f0",
          700: "#155cd9",
          800: "#174bb0",
          900: "#19418b",
        },
        ink:   { 900: "#0b1220", 700: "#273142", 500: "#4b5669" },
        surface: { 0: "#ffffff", 50: "#f7f9fc", 100: "#eef2f7" },
      },
      fontFamily: {
        sans: ["var(--font-app)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
