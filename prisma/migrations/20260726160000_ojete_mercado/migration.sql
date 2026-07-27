-- AlterTable
ALTER TABLE "Config" ALTER COLUMN "gfOjeteCosto" SET DEFAULT 0.2;


-- Costo del ojete ajustado al mercado venezolano (RUPACA/ML: material barato,
-- instalado ~$0,20). Solo pisa el valor si sigue en un placeholder anterior.
UPDATE "Config" SET "gfOjeteCosto" = 0.2 WHERE "gfOjeteCosto" IN (0.5, 0.8);
