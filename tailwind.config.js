/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./contexts/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}",
  ],

  presets: [
    require("nativewind/preset"),
  ],

  theme: {
    extend: {
      colors: {
        bronze: "#A8794A",
        "bronze-dark": "#8F633C",
        "charcoal-dark": "#1F2937",
      },
    },
  },

  plugins: [],
};