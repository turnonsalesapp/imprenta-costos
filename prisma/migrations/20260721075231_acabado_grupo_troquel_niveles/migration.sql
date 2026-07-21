-- AlterTable
ALTER TABLE "Acabado" ADD COLUMN     "grupo" TEXT;

-- El troquel único pasa a ser el nivel "Básico" (conserva su precio actual)
-- y se agregan los niveles Medio y Complejo, todos en el grupo "troquel".
UPDATE "Acabado" SET "grupo" = 'troquel', "label" = 'Troquel Básico'
WHERE "clave" = 'troquel';

INSERT INTO "Acabado" ("id", "clave", "label", "costo", "unidad", "escala", "orden", "activo", "grupo")
SELECT 'seed_troquel_medio', 'troquelMedio', 'Troquel Medio', 150, 'trabajo', 'fija',
       COALESCE((SELECT "orden" FROM "Acabado" WHERE "clave" = 'troquel'), 5), true, 'troquel'
WHERE NOT EXISTS (SELECT 1 FROM "Acabado" WHERE "clave" = 'troquelMedio');

INSERT INTO "Acabado" ("id", "clave", "label", "costo", "unidad", "escala", "orden", "activo", "grupo")
SELECT 'seed_troquel_complejo', 'troquelComplejo', 'Troquel Complejo', 200, 'trabajo', 'fija',
       COALESCE((SELECT "orden" FROM "Acabado" WHERE "clave" = 'troquel'), 5), true, 'troquel'
WHERE NOT EXISTS (SELECT 1 FROM "Acabado" WHERE "clave" = 'troquelComplejo');
