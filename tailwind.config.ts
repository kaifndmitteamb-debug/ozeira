import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        zblack: {
          DEFAULT: "#000000",
          pure: "#000000",
          surface: "#050505",
          card: "#0a0a0a",
          elevated: "#111111",
          border: "#1a1a1a",
          subtle: "#222222",
        },
        brand: {
          50: "#fdf8f4",
          100: "#faeee4",
          200: "#f4dbca",
          300: "#ecc1a4",
          400: "#df9c6e",
          500: "#d37b3f",
          600: "#c46331",
          700: "#a34c28",
          800: "#833e26",
          900: "#6a3422",
          950: "#3a190f",
        },
        gold: {
          100: "#FDF4DB",
          300: "#F5D480",
          400: "#E9B949",
          500: "#D49B24",
          600: "#B27814",
        },
        emerald: {
          50: "#ecfdf5",
          600: "#059669",
          700: "#047857",
          900: "#064e3b",
        },
        "brand-emerald": "#059669",
        "brand-amber": "#c46331",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      boxShadow: {
        luxury: "0 10px 30px -10px rgba(0, 0, 0, 0.08)",
        "luxury-lg": "0 20px 40px -15px rgba(0, 0, 0, 0.12)",
        "luxury-xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        "luxury-dark": "0 10px 30px -10px rgba(0, 0, 0, 0.8)",
        "luxury-dark-card": "0 10px 25px -5px rgba(0, 0, 0, 0.9), 0 0 1px 1px rgba(255, 255, 255, 0.05)",
        "luxury-glow": "0 0 25px -5px rgba(196, 99, 49, 0.4)",
        "gold-glow": "0 0 25px -5px rgba(245, 212, 128, 0.4)",
        "zblack-elevated": "0 20px 50px -10px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.08)",
      },
      transitionTimingFunction: {
        luxury: "cubic-bezier(0.16, 1, 0.3, 1)",
        "luxury-smooth": "cubic-bezier(0.22, 1, 0.36, 1)",
        "luxury-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
        "luxury-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "luxury-reveal": "luxuryReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "luxury-fade-up": "luxuryFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "float-slow": "floatSlow 6s ease-in-out infinite",
        "pulse-subtle": "pulseSubtle 3s ease-in-out infinite",
        "glow-breathe": "glowBreathe 4s ease-in-out infinite",
        "shimmer-sweep": "shimmerSweep 2.5s infinite linear",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.94)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        luxuryReveal: {
          "0%": { opacity: "0", transform: "translateY(28px) scale(0.98)", filter: "blur(4px)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)", filter: "blur(0px)" },
        },
        luxuryFadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.88", transform: "scale(1.02)" },
        },
        glowBreathe: {
          "0%, 100%": { filter: "drop-shadow(0 0 8px rgba(196, 99, 49, 0.3))" },
          "50%": { filter: "drop-shadow(0 0 20px rgba(196, 99, 49, 0.7))" },
        },
        shimmerSweep: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
