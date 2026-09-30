import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        subtle: "hsl(var(--subtle))",
        ready: { DEFAULT: "hsl(var(--ready))", foreground: "hsl(var(--ready-foreground))" },
        partial: { DEFAULT: "hsl(var(--partial))", foreground: "hsl(var(--partial-foreground))" },
        missing: { DEFAULT: "hsl(var(--missing))", foreground: "hsl(var(--missing-foreground))" },
        brand: {
          DEFAULT: "hsl(var(--brand))",
          strong: "hsl(var(--brand-strong))",
          soft: "hsl(var(--brand-soft))",
          foreground: "hsl(var(--brand-foreground))",
        },
        jctu: {
          j: { DEFAULT: "hsl(var(--jctu-j))", foreground: "hsl(var(--jctu-j-foreground))" },
          c: { DEFAULT: "hsl(var(--jctu-c))", foreground: "hsl(var(--jctu-c-foreground))" },
          t: { DEFAULT: "hsl(var(--jctu-t))", foreground: "hsl(var(--jctu-t-foreground))" },
          u: { DEFAULT: "hsl(var(--jctu-u))", foreground: "hsl(var(--jctu-u-foreground))" },
        },
        subject: Object.fromEntries(
          [
            "cestina", "matematika", "prvouka", "anglictina",
            "hudebni", "vytvarna", "telesna", "informatika", "other",
          ].map((key) => [
            key,
            {
              DEFAULT: `hsl(var(--subject-${key}))`,
              foreground: `hsl(var(--subject-${key}-foreground))`,
            },
          ]),
        ),
        proof: {
          text: "hsl(var(--proof-text))",
          voice: "hsl(var(--proof-voice))",
          camera: "hsl(var(--proof-camera))",
          file: "hsl(var(--proof-file))",
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        "2xl": "calc(var(--radius) + 10px)",
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "field-shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "field-shimmer": "field-shimmer 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
