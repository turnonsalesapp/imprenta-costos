import type { Config } from "tailwindcss";

// Paleta de artes gráficas: plancha, tinta y registros CMYK.
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        plancha: "#E3E7E3",
        hoja: "#FCFCFB",
        tinta: "#171B19",
        regla: "#C4CBC5",
        suave: "#EFF2EF",
        kraft: "#767D76",
        cian: "#0B8FA8",
        magenta: "#C4177C",
        amarillo: "#C79400",
        exito: "#15794F",
      },
      fontFamily: {
        sans: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SF Mono", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
