# `src/app/actions` — Server Actions

Frontera de escritura entre los formularios/cliente y la lógica de negocio (`src/lib`).

**Qué vive aquí**
- Acciones `"use server"` que reciben `FormData` o un objeto tipado del cliente.
- Cada acción: (1) `requireRol(...)` primero, (2) valida/normaliza la entrada, (3) llama al repositorio de `lib`, (4) `revalidatePath(...)` o `redirect(...)`.

**Qué NO debe vivir aquí**
- Consultas Prisma directas (van en `src/lib`).
- Cálculo de precios (solo `lib/calculo.ts`).
- Lógica que deba correr en el cliente.

**Reglas**
- La autorización se comprueba **en el servidor**, en cada acción; nunca se confía en que la UI ocultó un botón.
- Las operaciones sensibles (estado de cotización, rol, activación) registran auditoría (`lib/auditoria.ts`).
- Entradas numéricas: normaliza con `n()` y valida rangos con `zod`.
