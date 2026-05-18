import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Paleta medieval obsoleta eliminada: el styling vive 100% en
      // app/globals.css (sin @tailwind, sin clases utilitarias).
      fontFamily: {
        title: ["Cinzel", "Georgia", "serif"],
        body: ["'Crimson Text'", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
