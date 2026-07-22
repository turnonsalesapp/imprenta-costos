// Stub de `server-only` para las pruebas. El paquete real lanza un error cuando
// se importa fuera de un React Server Component; en vitest (Node) eso impediría
// probar módulos server-only como `ordenes.ts`. Este stub no hace nada.
export {};
