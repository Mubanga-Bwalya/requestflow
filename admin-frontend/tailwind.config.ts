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
          magenta: "#E73189",
          white: "#FFFFFF",
        },
        zamtel: {
          bg: "var(--zamtel-bg)",
          surface: "var(--zamtel-surface)",
          border: "var(--zamtel-border)",
          text: "var(--zamtel-text)",
          muted: "var(--zamtel-muted)",
        },
        surface: {
          DEFAULT: "var(--zamtel-surface)",
          subtle: "var(--zamtel-bg)",
        },
        muted: "var(--zamtel-muted)",
      },
      borderRadius: {
        control: "8px",
        card: "16px",
        panel: "20px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        overlay: "var(--shadow-overlay)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      keyframes: {
        "rf-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "rf-fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "rf-scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "rf-pop-in": {
          from: { opacity: "0", transform: "translateY(-4px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "rf-fade-in": "rf-fade-in 0.3s ease-out both",
        "rf-fade-in-up": "rf-fade-in-up 0.4s ease-out both",
        "rf-scale-in": "rf-scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
        "rf-pop-in": "rf-pop-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
      transitionTimingFunction: {
        rf: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
