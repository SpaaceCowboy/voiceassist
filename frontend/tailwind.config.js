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
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease both",
      },
    },
  },
  plugins: [],
};
