-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "offPlanchaMedio" DECIMAL(12,4) NOT NULL DEFAULT 7,
ADD COLUMN     "offPlanchaPliego" DECIMAL(12,4) NOT NULL DEFAULT 12,
ADD COLUMN     "offTinta" DECIMAL(12,4) NOT NULL DEFAULT 2;


-- Nuevos acabados de offset (laminado, barniz litográfico, pegado acetato/caja).
INSERT INTO "Acabado" ("id","clave","label","costo","unidad","escala","orden","activo","modulo","grupo") VALUES
  (gen_random_uuid()::text, 'off-laminado',       'Laminado',            0.4,  'pliego',   'area', 106, true, 'offset', NULL),
  (gen_random_uuid()::text, 'off-barniz-lito',    'Barniz Litográfico',  0.12, 'pliego',   'area', 107, true, 'offset', NULL),
  (gen_random_uuid()::text, 'off-pegado-acetato', 'Pegado de Acetato',   0.05, 'elemento', 'fija', 108, true, 'offset', NULL),
  (gen_random_uuid()::text, 'off-pegado-caja',    'Pegado de Caja',      0.1,  'elemento', 'fija', 109, true, 'offset', NULL)
ON CONFLICT ("clave") DO NOTHING;
