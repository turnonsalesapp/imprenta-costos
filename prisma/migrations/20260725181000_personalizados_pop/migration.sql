-- AlterEnum
ALTER TYPE "TipoCotizacion" ADD VALUE 'PERSONALIZADO';

-- CreateTable
CREATE TABLE "ProductoPop" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Chapa',
    "modo" TEXT NOT NULL DEFAULT 'escalas',
    "escalas" TEXT NOT NULL DEFAULT '',
    "precioLineal" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "anchoCm" INTEGER NOT NULL DEFAULT 0,
    "minCm" INTEGER NOT NULL DEFAULT 0,
    "unidad" TEXT NOT NULL DEFAULT 'unidad',
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProductoPop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductoPop_clave_key" ON "ProductoPop"("clave");

