/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Bungee'", "system-ui", "sans-serif"],
        body: ["'Nunito'", "system-ui", "sans-serif"],
      },
      colors: {
        gold: {
          300: "#ffe08a",
          400: "#ffd35c",
          500: "#f5b82e",
          600: "#d99a18",
        },
        ocean: {
          400: "#38bdf8",
          600: "#0369a1",
          900: "#0c2d4d",
        },
        night: "#0a1024",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        shimmer: "shimmer 2.4s ease-in-out infinite",
        floaty: "floaty 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
