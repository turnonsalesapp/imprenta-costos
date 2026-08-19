-- Extiende el hilo del trabajo (comentarios + adjuntos) a las OPORTUNIDADES
-- (Prospecto), no solo a las cotizaciones. Cada fila queda anclada a UNA
-- cotización O a UN prospecto (XOR): `cotizacionId` deja de ser obligatorio, se
-- añade `prospectoId` con FK en cascada y su índice. Las filas actuales tienen
-- `cotizacionId` y no se tocan. El CHECK garantiza el XOR también en la base.

-- Comentario ------------------------------------------------------------------
ALTER TABLE "Comentario" ALTER COLUMN "cotizacionId" DROP NOT NULL;
ALTER TABLE "Comentario" ADD COLUMN "prospectoId" TEXT;
CREATE INDEX "Comentario_prospectoId_idx" ON "Comentario"("prospectoId");
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_prospectoId_fkey"
    FOREIGN KEY ("prospectoId") REFERENCES "Prospecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_destino_xor"
    CHECK (("cotizacionId" IS NOT NULL) <> ("prospectoId" IS NOT NULL));

-- Adjunto ---------------------------------------------------------------------
ALTER TABLE "Adjunto" ALTER COLUMN "cotizacionId" DROP NOT NULL;
ALTER TABLE "Adjunto" ADD COLUMN "prospectoId" TEXT;
CREATE INDEX "Adjunto_prospectoId_idx" ON "Adjunto"("prospectoId");
ALTER TABLE "Adjunto" ADD CONSTRAINT "Adjunto_prospectoId_fkey"
    FOREIGN KEY ("prospectoId") REFERENCES "Prospecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Adjunto" ADD CONSTRAINT "Adjunto_destino_xor"
    CHECK (("cotizacionId" IS NOT NULL) <> ("prospectoId" IS NOT NULL));
