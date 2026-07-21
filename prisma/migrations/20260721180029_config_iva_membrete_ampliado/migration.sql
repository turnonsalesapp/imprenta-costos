-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "empresaEmail" TEXT,
ADD COLUMN     "empresaWeb" TEXT,
ADD COLUMN     "iva" DECIMAL(6,2) NOT NULL DEFAULT 16;


-- Precarga del membrete con los datos reales del emisor (solo si están vacíos).
UPDATE "Config" SET
  "empresaNombre"    = COALESCE("empresaNombre", 'PRODUCCIONES AP2024, C.A.'),
  "empresaRif"       = COALESCE("empresaRif", 'J-50542525-0'),
  "empresaDireccion" = COALESCE("empresaDireccion", 'Av. Zona Industrial La Tinaja, Calle Prolongación La Tinaja, Edificio Bamar, Piso 1, Local 1, Urb. El Llanito, Municipio Sucre, Petare, Miranda'),
  "empresaEmail"     = COALESCE("empresaEmail", 'altoprint@tradew.us'),
  "empresaWeb"       = COALESCE("empresaWeb", 'http://altoprint.tradew.us')
WHERE "id" = 'global';
