import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#008542",
          dark: "#015217",
          lime: "#A9DD00",
          white: "#FFFFFF",
        },
      },
    },
  },
  plugins: [],
};

export default config;

