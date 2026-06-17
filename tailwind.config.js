/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Driven by CSS variables (see index.css) so the theme switch cascades.
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          soft: "rgb(var(--primary-soft) / <alpha-value>)",
          dim: "rgb(var(--primary-dim) / <alpha-value>)",
        },
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        bg: {
          DEFAULT: "rgb(var(--bg) / <alpha-value>)",
          soft: "rgb(var(--bg-soft) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          soft: "rgb(var(--card-soft) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          mute: "rgb(var(--ink-mute) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
        },
      },
      fontFamily: {
        heading: ['"Satoshi"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      boxShadow: {
        glass: "0 12px 30px -10px rgba(120, 86, 46, 0.22)",
        glow: "0 8px 24px -6px rgba(237, 125, 28, 0.55)",
        "glow-sm": "0 6px 16px -6px rgba(237, 125, 28, 0.5)",
      },
      backdropBlur: {
        glass: "16px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};
