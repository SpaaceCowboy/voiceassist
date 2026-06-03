/** @type {import('tailwindcss').Config} */
const withOpacity = (varName) => `rgb(var(${varName}) / <alpha-value>)`;

module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: withOpacity("--bg"),
        surface: withOpacity("--surface"),
        surface2: withOpacity("--surface2"),
        border: withOpacity("--border"),
        text: withOpacity("--text"),
        muted: withOpacity("--muted"),
        accent: withOpacity("--accent"),
        accent2: withOpacity("--accent2"),
        // claymorphism surfaces (landing)
        "clay-bg": withOpacity("--clay-bg"),
        "clay-surface": withOpacity("--clay-surface"),
      },
      borderColor: {
        DEFAULT: withOpacity("--border"),
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
        "clay-sm": "var(--clay-radius-sm)",
        clay: "var(--clay-radius)",
        "clay-lg": "var(--clay-radius-lg)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        clay: "var(--clay-shadow)",
        "clay-hover": "var(--clay-shadow-hover)",
        "clay-pressed": "var(--clay-shadow-pressed)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        equalize: {
          "0%, 100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease both",
        equalize: "equalize 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
