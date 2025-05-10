import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "#E2E8F0",
        input: "#AAA",
        ring: "#CBD5E1",
        background: "#FFFFFF",
        foreground: "#1A202C",
        primary: {
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#64748B",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        accent: {
          DEFAULT: "#F8FAFC",
          foreground: "#0F172A",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#1A202C",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1A202C",
        },
        sidebar: {
          DEFAULT: "#F8FAFC",
          foreground: "#1A202C",
          primary: "#2563EB",
          "primary-foreground": "#FFFFFF",
          accent: "#F1F5F9",
          "accent-foreground": "#1A202C",
          border: "#E2E8F0",
          ring: "#CBD5E1",
        },
        theme: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
          950: "#172554",
        },
        glow: {
          weak: "rgba(74,222,128,0.1)",
          medium: "rgba(74,222,128,0.2)",
          strong: "rgba(74,222,128,0.3)",
          neon: "rgba(57,255,20,0.5)",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "#1A202C",
            a: {
              color: "#2563EB",
              "&:hover": { color: "#1D4ED8" },
            },
            '[class~="lead"]': { color: "#1A202C" },
            strong: { color: "#1A202C" },
            "ol > li::marker": { color: "#64748B" },
            "ul > li::marker": { color: "#64748B" },
            hr: { borderColor: "#E2E8F0" },
            blockquote: {
              borderLeftColor: "#E2E8F0",
              color: "#1A202C",
            },
            h1: { color: "#1A202C" },
            h2: { color: "#1A202C" },
            h3: { color: "#1A202C" },
            h4: { color: "#1A202C" },
            "figure figcaption": { color: "#64748B" },
            code: {
              color: "#1A202C",
              backgroundColor: "#F1F5F9",
              padding: "0.25rem",
              borderRadius: "0.25rem",
              fontWeight: "400",
            },
            "a code": { color: "#2563EB" },
            pre: {
              backgroundColor: "#F1F5F9",
              color: "#1A202C",
            },
            thead: {
              color: "#1A202C",
              borderBottomColor: "#E2E8F0",
            },
            "tbody tr": { borderBottomColor: "#E2E8F0" },
          },
        },
      },
      fontFamily: { sans: ["var(--font-sans)", ...fontFamily.sans] },
      keyframes: {
        tilt: {
          "0%, 50%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(0.5deg)" },
          "75%": { transform: "rotate(-0.5deg)" },
        },
      },
      animation: { tilt: "tilt 10s infinite linear" },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
