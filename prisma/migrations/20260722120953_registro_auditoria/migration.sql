-- CreateTable
CREATE TABLE "RegistroAuditoria" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "actorNombre" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT,
    "detalle" TEXT,

    CONSTRAINT "RegistroAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistroAuditoria_fecha_idx" ON "RegistroAuditoria"("fecha");

