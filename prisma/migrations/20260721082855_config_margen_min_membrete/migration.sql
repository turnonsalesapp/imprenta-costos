-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "empresaDireccion" TEXT,
ADD COLUMN     "empresaNombre" TEXT,
ADD COLUMN     "empresaRif" TEXT,
ADD COLUMN     "empresaTelefono" TEXT,
ADD COLUMN     "margenMin" DECIMAL(6,2) NOT NULL DEFAULT 15;

