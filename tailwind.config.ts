import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0202",
          900: "#1a0505",
          800: "#2a0a0a",
          700: "#3a1010",
        },
        crimson: {
          DEFAULT: "#c8302a",
          dark: "#6a1010",
          glow: "#8a2020",
        },
        gold: {
          DEFAULT: "#d4a070",
          dim: "#8a6040",
          bright: "#f0d090",
        },
      },
      fontFamily: {
        title: ["Cinzel", "Georgia", "serif"],
        body: ["'Crimson Text'", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
