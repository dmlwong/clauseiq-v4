import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

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
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      // --- Orbit type scale (Figma tokens) -----------------------------------
      // Font size and line height stay independent (no [size, leading] tuples)
      // so `text-orbit-*` and `leading-orbit-*` compose the way the call sites
      // already use them.
      fontSize: {
        "orbit-xs": "var(--orbit-text-xs)",
        "orbit-sm": "var(--orbit-text-sm)",
        "orbit-base": "var(--orbit-text-base)",
        "orbit-lg": "var(--orbit-text-lg)",
        "orbit-xl": "var(--orbit-text-xl)",
        "orbit-2xl": "var(--orbit-text-2xl)",
        "orbit-3xl": "var(--orbit-text-3xl)",
      },
      fontWeight: {
        "orbit-regular": "var(--orbit-font-weight-regular)",
        "orbit-medium": "var(--orbit-font-weight-medium)",
        "orbit-semibold": "var(--orbit-font-weight-semibold)",
        "orbit-bold": "var(--orbit-font-weight-bold)",
      },
      lineHeight: {
        "orbit-tight": "var(--orbit-leading-tight)",
        "orbit-snug": "var(--orbit-leading-snug)",
        "orbit-normal": "var(--orbit-leading-normal)",
        "orbit-relaxed": "var(--orbit-leading-relaxed)",
      },
      boxShadow: {
        "orbit-none": "var(--orbit-shadow-none)",
        "orbit-sm": "var(--orbit-shadow-sm)",
        "orbit-md": "var(--orbit-shadow-md)",
        "orbit-lg": "var(--orbit-shadow-lg)",
      },
      zIndex: {
        "orbit-sticky": "var(--orbit-z-sticky)",
        "orbit-dropdown": "var(--orbit-z-dropdown)",
        "orbit-tooltip": "var(--orbit-z-tooltip)",
        "orbit-overlay": "var(--orbit-z-overlay)",
        "orbit-toast": "var(--orbit-z-toast)",
      },
      spacing: {
        "orbit-none": "var(--orbit-space-none)",
        "orbit-micro": "var(--orbit-space-micro)",
        "orbit-xxs": "var(--orbit-space-xxs)",
        "orbit-xs": "var(--orbit-space-xs)",
        "orbit-s": "var(--orbit-space-s)",
        "orbit-base": "var(--orbit-space-base)",
        "orbit-m": "var(--orbit-space-m)",
        "orbit-l": "var(--orbit-space-l)",
        "orbit-xxl": "var(--orbit-space-xxl)",
        "orbit-mega": "var(--orbit-space-mega)",
      },
      colors: {
        // Orbit-token-backed utilities (clauseiq-v6a migration).
        // These reference the LIVE @efficio/orbit design tokens via CSS
        // relative-color so Tailwind opacity modifiers (e.g. bg-orbit-primary/10)
        // still work. Scoped by class name — no effect on other prototypes.
        "orbit-fg": "rgb(from var(--orbit-color-text-primary) r g b / <alpha-value>)",
        "orbit-fg-secondary": "rgb(from var(--orbit-color-text-secondary) r g b / <alpha-value>)",
        "orbit-canvas": "rgb(from var(--orbit-color-bg-canvas) r g b / <alpha-value>)",
        "orbit-card": "rgb(from var(--orbit-color-card-bg-default) r g b / <alpha-value>)",
        "orbit-surface": "rgb(from var(--orbit-color-card-bg-accent) r g b / <alpha-value>)",
        "orbit-border": "rgb(from var(--orbit-color-card-border-default) r g b / <alpha-value>)",
        "orbit-primary": {
          DEFAULT: "rgb(from var(--orbit-color-btn-primary-bg) r g b / <alpha-value>)",
          foreground: "rgb(from var(--orbit-color-btn-primary-fg) r g b / <alpha-value>)",
          soft: "rgb(from color-mix(in srgb, var(--orbit-color-btn-primary-bg) 6%, white) r g b / <alpha-value>)",
        },
        "orbit-destructive": "rgb(from var(--orbit-color-text-error) r g b / <alpha-value>)",
        // Orbit status families (P1) — strong DEFAULT + surface/border tints.
        "orbit-error": {
          DEFAULT: "rgb(from var(--orbit-color-text-error) r g b / <alpha-value>)",
          surface: "rgb(from var(--orbit-color-card-bg-error) r g b / <alpha-value>)",
          border: "rgb(from var(--orbit-color-card-border-error) r g b / <alpha-value>)",
        },
        "orbit-warning": {
          DEFAULT: "rgb(from var(--orbit-color-text-warning) r g b / <alpha-value>)",
          surface: "rgb(from var(--orbit-color-card-bg-warning) r g b / <alpha-value>)",
          border: "rgb(from var(--orbit-color-card-border-warning) r g b / <alpha-value>)",
        },
        "orbit-success": {
          DEFAULT: "rgb(from var(--orbit-color-text-success) r g b / <alpha-value>)",
          surface: "rgb(from var(--orbit-color-card-bg-success) r g b / <alpha-value>)",
          border: "rgb(from var(--orbit-color-card-border-success) r g b / <alpha-value>)",
        },
        "orbit-info": {
          DEFAULT: "rgb(from var(--orbit-color-text-info) r g b / <alpha-value>)",
          surface: "rgb(from var(--orbit-color-card-bg-information) r g b / <alpha-value>)",
          border: "rgb(from var(--orbit-color-card-border-information) r g b / <alpha-value>)",
        },
        "orbit-teal": {
          DEFAULT: "rgb(from var(--orbit-color-chip-style-2-border) r g b / <alpha-value>)",
          surface: "rgb(from var(--orbit-color-chip-style-2-bg) r g b / <alpha-value>)",
        },
        "orbit-heading": "rgb(from var(--orbit-color-text-heading) r g b / <alpha-value>)",
        "orbit-inverse": "rgb(from var(--orbit-color-text-inverse) r g b / <alpha-value>)",
        // Orbit primitive accents for decorative category indicators (nav dots).
        "orbit-accent-blue": "rgb(from var(--orbit-color-science-blue) r g b / <alpha-value>)",
        "orbit-accent-teal": "rgb(from var(--orbit-color-cerulean) r g b / <alpha-value>)",
        "orbit-accent-amber": "rgb(from var(--orbit-color-web-orange) r g b / <alpha-value>)",
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        wizard: {
          active: "hsl(var(--wizard-active))",
          completed: "hsl(var(--wizard-completed))",
          inactive: "hsl(var(--wizard-inactive))",
          line: "hsl(var(--wizard-line))",
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
        ciq: {
          DEFAULT: "hsl(var(--ciq-purple))",
          foreground: "hsl(var(--ciq-purple-foreground))",
          soft: "hsl(var(--ciq-purple-soft))",
          border: "hsl(var(--ciq-purple-border))",
        },
      },
      borderRadius: {
        // shadcn scale — still used by the non-v6a prototypes. Do not remove.
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Orbit radius scale (Figma tokens). `rounded-full` is deliberately not
        // mirrored here: Figma defines no "full" radius — it is a shape
        // primitive (pills, avatars), not a design token.
        "orbit-none": "var(--orbit-radius-none)",
        "orbit-sm": "var(--orbit-radius-sm)",
        "orbit-md": "var(--orbit-radius-md)",
        "orbit-lg": "var(--orbit-radius-lg)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
