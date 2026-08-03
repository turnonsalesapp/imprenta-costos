-- Hilo del trabajo: comentarios + adjuntos. Se ancla a la COTIZACIÓN; la orden
-- muestra el mismo hilo vía su cotizacionId. El hilo NO contiene dinero, así el
-- rol TALLER participa (por la orden) sin ver precios ni costos.

-- gen_random_uuid() vive en la extensión pgcrypto.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "Comentario" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "cotizacionId" TEXT NOT NULL,
    "autorId" TEXT,
    "autorNombre" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Comentario_cotizacionId_idx" ON "Comentario"("cotizacionId");
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_cotizacionId_fkey"
    FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Adjunto" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "cotizacionId" TEXT NOT NULL,
    "autorId" TEXT,
    "autorNombre" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "almacen" TEXT NOT NULL DEFAULT 'db',
    "datos" BYTEA,
    "driveFileId" TEXT,
    "url" TEXT,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Adjunto_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Adjunto_cotizacionId_idx" ON "Adjunto"("cotizacionId");
ALTER TABLE "Adjunto" ADD CONSTRAINT "Adjunto_cotizacionId_fkey"
    FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
