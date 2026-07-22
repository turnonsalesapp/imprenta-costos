import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  resolve: {
    alias: {
      // `server-only` lanza fuera de un RSC; en las pruebas lo neutralizamos
      // para poder importar módulos del servidor (ej. ordenes.ts).
      "server-only": fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url)),
    },
  },
});
