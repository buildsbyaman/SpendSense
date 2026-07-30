const { hairlineWidth } = require("nativewind/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",

        primary: "var(--primary)",
        secondary: "var(--secondary)",
        muted: "var(--muted)",

        border: "var(--border)",
        divider: "var(--divider)",

        accent: "var(--accent)",
        "accent-dark": "var(--accent-dark)",

        success: "var(--success)",
        danger: "var(--danger)",
        warning: "var(--warning)",

        gray: {
          50: "var(--gray-50)",
          100: "var(--gray-100)",
          200: "var(--gray-200)",
          300: "var(--gray-300)",
          400: "var(--gray-400)",
        },
      },

      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-pill)",
      },

      borderWidth: {
        hairline: hairlineWidth(),
      },

      fontFamily: {
        sans: ["Poppins", "Inter", "system-ui", "sans-serif"],
      },

      boxShadow: {
        xs: "0 2px 6px rgba(0,0,0,0.03)",
        sm: "0 4px 12px rgba(0,0,0,0.04)",
        md: "0 8px 24px rgba(0,0,0,0.05)",
        lg: "0 14px 34px rgba(0,0,0,0.07)",
      },
    },
  },

  future: {
    hoverOnlyWhenSupported: true,
  },

  plugins: [require("tailwindcss-animate")],
};