-- AlterEnum
ALTER TYPE "TipoCotizacion" ADD VALUE 'GRAN_FORMATO';

-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "gfOjeteCm" INTEGER NOT NULL DEFAULT 40,
ADD COLUMN     "gfOjeteCosto" DECIMAL(10,4) NOT NULL DEFAULT 0.8;

-- CreateTable
CREATE TABLE "MaterialGF" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Banner',
    "costoM2" DECIMAL(12,4) NOT NULL,
    "modoCobro" TEXT NOT NULL DEFAULT 'mancha',
    "anchosRollo" TEXT NOT NULL DEFAULT '',
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MaterialGF_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaterialGF_clave_key" ON "MaterialGF"("clave");

