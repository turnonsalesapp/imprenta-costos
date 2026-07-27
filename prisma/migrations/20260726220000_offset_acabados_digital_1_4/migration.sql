-- AlterTable
ALTER TABLE "Acabado" ADD COLUMN     "modulo" TEXT NOT NULL DEFAULT 'digital';


-- Acabados propios del proceso OFFSET (idempotente). Costos estimados PYME,
-- editables en Variables. No se muestran en la calculadora digital.
INSERT INTO "Acabado" ("id","clave","label","costo","unidad","escala","orden","activo","modulo","grupo") VALUES
  (gen_random_uuid()::text, 'off-guillotina',  'Guillotina / refilado', 8,    'trabajo',  'fija', 100, true, 'offset', NULL),
  (gen_random_uuid()::text, 'off-doblez',       'Doblez / plegado',      8,    'millar',   'fija', 101, true, 'offset', NULL),
  (gen_random_uuid()::text, 'off-engrapado',    'Engrapado (caballete)', 0.05, 'elemento', 'fija', 102, true, 'offset', NULL),
  (gen_random_uuid()::text, 'off-numerado',     'Numeración',            10,   'millar',   'fija', 103, true, 'offset', NULL),
  (gen_random_uuid()::text, 'off-barniz',       'Barniz UV',             0.2,  'pliego',   'area', 104, true, 'offset', NULL),
  (gen_random_uuid()::text, 'off-encuadernado', 'Encuadernado',          20,   'trabajo',  'fija', 105, true, 'offset', NULL)
ON CONFLICT ("clave") DO NOTHING;
