-- CreateEnum
CREATE TYPE "TipoCotizacion" AS ENUM ('PROPIA', 'PROVEEDOR');

-- AlterTable
ALTER TABLE "Cotizacion" ADD COLUMN     "proveedorNombre" TEXT,
ADD COLUMN     "proveedorNotas" TEXT,
ADD COLUMN     "proveedorRef" TEXT,
ADD COLUMN     "tipo" "TipoCotizacion" NOT NULL DEFAULT 'PROPIA';

