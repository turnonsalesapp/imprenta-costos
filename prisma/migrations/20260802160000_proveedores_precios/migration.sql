-- Fase 3: proveedores y listas de precios. Backfill: el catálogo actual se vuelve
-- la lista del proveedor "Principal" (predeterminado y preferido de cada papel).

CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "contacto" TEXT,
    "notas" TEXT,
    "predeterminado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Proveedor_nombre_key" ON "Proveedor"("nombre");

CREATE TABLE "PrecioProveedorPapel" (
    "id" TEXT NOT NULL,
    "papelId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "precio" DECIMAL(12,4) NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'resma',
    "hojas" INTEGER,
    "medida" TEXT,
    "vigenteDesde" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notas" TEXT,
    CONSTRAINT "PrecioProveedorPapel_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PrecioProveedorPapel_papelId_proveedorId_key" ON "PrecioProveedorPapel"("papelId", "proveedorId");
CREATE INDEX "PrecioProveedorPapel_proveedorId_idx" ON "PrecioProveedorPapel"("proveedorId");

ALTER TABLE "Papel" ADD COLUMN "proveedorPreferidoId" TEXT;

ALTER TABLE "PrecioProveedorPapel" ADD CONSTRAINT "PrecioProveedorPapel_papelId_fkey"
    FOREIGN KEY ("papelId") REFERENCES "Papel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrecioProveedorPapel" ADD CONSTRAINT "PrecioProveedorPapel_proveedorId_fkey"
    FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Papel" ADD CONSTRAINT "Papel_proveedorPreferidoId_fkey"
    FOREIGN KEY ("proveedorPreferidoId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: proveedor "Principal" (predeterminado).
INSERT INTO "Proveedor" ("id", "nombre", "moneda", "predeterminado", "activo", "creadoEn")
VALUES (gen_random_uuid()::text, 'Principal', 'USD', true, true, now())
ON CONFLICT ("nombre") DO NOTHING;

-- Lista inicial = catálogo actual, del proveedor Principal.
INSERT INTO "PrecioProveedorPapel" ("id", "papelId", "proveedorId", "precio", "unidad", "hojas", "medida", "vigenteDesde")
SELECT gen_random_uuid()::text, p."id", pr."id", p."precio", 'resma', p."hojas", p."medida", now()
FROM "Papel" p
CROSS JOIN "Proveedor" pr
WHERE pr."nombre" = 'Principal'
AND NOT EXISTS (
    SELECT 1 FROM "PrecioProveedorPapel" x WHERE x."papelId" = p."id" AND x."proveedorId" = pr."id"
);

-- Cada papel toma a Principal como preferido.
UPDATE "Papel" p SET "proveedorPreferidoId" = pr."id"
FROM "Proveedor" pr
WHERE pr."nombre" = 'Principal' AND p."proveedorPreferidoId" IS NULL;
