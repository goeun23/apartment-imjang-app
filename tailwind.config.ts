import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3B82F6",
          50: "#EBF2FE",
          100: "#D7E6FD",
          200: "#AFCCFB",
          300: "#87B3F9",
          400: "#5F99F7",
          500: "#3B82F6",
          600: "#0B61EE",
          700: "#084BB8",
          800: "#063682",
          900: "#03204C",
        },
      },
    },
  },
  plugins: [],
}

export default config
