import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2328",
        muted: "#6b7280",
        line: "#d4d4d8",
        surface: "#ffffff",
        canvas: "#f4f4f5",
        accent: "#3f5b8b",
      },
      borderRadius: { md: "6px" },
    },
  },
  plugins: [],
} satisfies Config;
