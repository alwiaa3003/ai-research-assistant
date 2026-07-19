/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", "sans-serif"],
      },
      colors: {
        sage: {
          50: "#f4f7f4",
          100: "#e6ede8",
          200: "#cddcd1",
          300: "#a9c2b0",
          400: "#7fa38a",
          500: "#5d8768",
          600: "#476b52",
          700: "#3a5643",
          800: "#304538",
          900: "#293a30",
        },
        cream: "#faf8f3",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(41, 58, 48, 0.06)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};