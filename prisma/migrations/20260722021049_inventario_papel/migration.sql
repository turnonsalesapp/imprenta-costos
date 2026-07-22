-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE');

-- AlterTable
ALTER TABLE "Papel" ADD COLUMN     "stock" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "stockMin" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Orden" ADD COLUMN     "inventarioAplicado" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MovimientoInventario" (
    "id" TEXT NOT NULL,
    "papelId" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" DECIMAL(14,2) NOT NULL,
    "saldo" DECIMAL(14,2) NOT NULL,
    "motivo" TEXT,
    "ordenId" TEXT,
    "usuarioId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MovimientoInventario_papelId_idx" ON "MovimientoInventario"("papelId");

-- CreateIndex
CREATE INDEX "MovimientoInventario_fecha_idx" ON "MovimientoInventario"("fecha");

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_papelId_fkey" FOREIGN KEY ("papelId") REFERENCES "Papel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

