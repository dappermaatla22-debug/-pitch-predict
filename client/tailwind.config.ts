import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        midnight: "#0A0E17",
        carbon: {
          DEFAULT: "#12161F",
          elevated: "#1A1F2A",
        },
        cyan: {
          pulse: "#22D3EE",
          hover: "#0891B2",
        },
        prime: "#FBBF24",
      },
      fontFamily: {
        heading: ['"Space Grotesk"', "sans-serif"],
        body: ['"Inter"', "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
