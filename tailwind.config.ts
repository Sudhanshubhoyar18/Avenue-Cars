import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Inter",
          "sans-serif",
        ],
      },
      colors: {
        stitch: {
          bg: "#06070B",
          dark: "#090A10",
          card: "rgba(16, 18, 27, 0.75)",
          cardHover: "rgba(22, 25, 38, 0.85)",
          border: "rgba(255, 255, 255, 0.08)",
          borderHighlight: "rgba(255, 255, 255, 0.16)",
          cyan: "#00F2FE",
          teal: "#06B6D4",
          indigo: "#6366F1",
          purple: "#7C3AED",
          violet: "#A855F7",
        },
        ios: {
          bg: {
            light: "#F5F6F9",
            dark: "#06070B",
          },
          card: {
            light: "rgba(255, 255, 255, 0.82)",
            dark: "rgba(16, 18, 27, 0.75)",
          },
          border: {
            light: "rgba(255, 255, 255, 0.7)",
            dark: "rgba(255, 255, 255, 0.08)",
          },
          accent: {
            purple: "#6366F1",
            purpleHover: "#4F46E5",
          },
        },
      },
      borderRadius: {
        "ios-sm": "14px",
        "ios-md": "20px",
        "ios-lg": "28px",
        "ios-xl": "32px",
        "stitch-pill": "9999px",
      },
      backdropBlur: {
        ios: "28px",
        stitch: "36px",
      },
      boxShadow: {
        "stitch-card": "0 20px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
        "stitch-hover": "0 24px 60px -10px rgba(99, 102, 241, 0.22), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)",
        "stitch-pill": "0 8px 24px -4px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)",
        "stitch-glow-cyan": "0 0 35px -5px rgba(6, 182, 212, 0.45)",
        "stitch-glow-purple": "0 0 35px -5px rgba(124, 58, 237, 0.5)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "aurora-float": "auroraFloat 12s ease-in-out infinite alternate",
      },
      keyframes: {
        auroraFloat: {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(30px, -20px) scale(1.08)" },
          "100%": { transform: "translate(-20px, 30px) scale(0.96)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
