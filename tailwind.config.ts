import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1b1f2a",
        slatewash: "#f4f7f8",
        basil: "#2d6a4f",
        tomato: "#d1493f",
        marigold: "#f5b841",
        plum: "#6d597a"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(20, 31, 38, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
