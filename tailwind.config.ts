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
        surface: "#f7f2ea",
        ink: "#211f1c",
        muted: "#6f665c",
        line: "#ded5c9",
        ember: "#c95f3f",
        moss: "#63705a",
      },
      boxShadow: {
        soft: "0 24px 80px rgb(33 31 28 / 0.10)",
      },
    },
  },
  plugins: [],
} satisfies Config;
