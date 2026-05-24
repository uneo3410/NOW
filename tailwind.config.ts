import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        surface: "#f7f9fb",
        ink: "#191c1e",
        muted: "#58606f",
        line: "#c2c6d8",
        ember: "#c95f3f",
        moss: "#0056c6",
        canvas: "#f4f9ff",
        primary: "#0056c6",
        "primary-soft": "#d9e2ff",
        cyan: "#00e3fd",
      },
      boxShadow: {
        soft: "0 24px 80px rgb(0 88 203 / 0.10)",
        glass: "0 16px 56px rgb(0 104 117 / 0.08), inset 0 0 0 1px rgb(255 255 255 / 0.45)",
      },
    },
  },
  plugins: [],
} satisfies Config;
