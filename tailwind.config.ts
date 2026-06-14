import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          primary: "#64C832",
          dark: "#146E37",
          light: "#E8F8DC",
          muted: "#A8E07A",
          hover: "#52A828",
        },
        bg: {
          page: "#F4F7F2",
          card: "#FFFFFF",
        },
        text: {
          primary: "#1A1F16",
          secondary: "#4A5568",
          muted: "#9CA3AF",
        },
        border: {
          DEFAULT: "#E5EDE0",
          hover: "#B8D9A0",
        },
      },
      fontFamily: {
        title: ['"Exo 2"', "sans-serif"],
        body: ["Nunito", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        xl: "12px",
        lg: "10px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(100, 200, 50, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 4px 12px rgba(100, 200, 50, 0.15), 0 2px 4px rgba(0, 0, 0, 0.06)",
        "green-glow": "0 0 20px rgba(100, 200, 50, 0.25)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
