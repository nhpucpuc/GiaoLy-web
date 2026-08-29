/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#006878",
          dark: "#004e5b",
          light: "#84d2e5",
          container: "#87d5e8",
          "on-container": "#005d6c",
          fixed: "#a8edff"
        },
        secondary: {
          DEFAULT: "#835400",
          container: "#fcab29",
          "on-container": "#694300",
          fixed: "#ffddb5",
          "fixed-dim": "#ffb957"
        },
        surface: {
          DEFAULT: "#f9f9ff",
          bright: "#f9f9ff",
          dim: "#cfdaf1",
          variant: "#d8e3fa",
          "container-lowest": "#ffffff",
          "container-low": "#f0f3ff",
          container: "#e7eeff",
          "container-high": "#dee8ff",
          "container-highest": "#d8e3fa"
        },
        on: {
          surface: "#111c2c",
          "surface-variant": "#3f484b",
          background: "#111c2c",
          primary: "#ffffff",
          secondary: "#ffffff"
        },
        outline: {
          DEFAULT: "#6f797c",
          variant: "#bec8cb"
        },
        customError: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6"
        },
        tertiary: {
          DEFAULT: "#5d5e00",
          container: "#e3e37e",
          fixed: "#e3e37e",
          "fixed-dim": "#c7c764"
        }
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        body: ['"Work Sans"', 'sans-serif']
      }
    },
  },
  plugins: [],
}
