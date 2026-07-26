-- AlterTable
ALTER TABLE "Config" ALTER COLUMN "gfOjeteCosto" SET DEFAULT 0.5,
ALTER COLUMN "offPlancha" SET DEFAULT 4,
ALTER COLUMN "offArranque" SET DEFAULT 12,
ALTER COLUMN "offMillar" SET DEFAULT 5;


-- Afina los valores placeholder ya sembrados, SIN pisar lo que el taller
-- haya ajustado a mano en Variables (solo actualiza si sigue en el valor viejo).
UPDATE "Config" SET "gfOjeteCosto" = 0.5 WHERE "gfOjeteCosto" = 0.8;
UPDATE "Config" SET "offPlancha"   = 4   WHERE "offPlancha"   = 8;
UPDATE "Config" SET "offArranque"  = 12  WHERE "offArranque"  = 15;
UPDATE "Config" SET "offMillar"    = 5   WHERE "offMillar"    = 6;

UPDATE "Equipo" SET "costoMillar" = 8, "costoArranque" = 18
  WHERE "clave" = 'prensa-4c' AND "costoMillar" = 6 AND "costoArranque" = 15;
UPDATE "Equipo" SET "costoMillar" = 3, "costoArranque" = 8
  WHERE "clave" = 'prensa-1c' AND "costoMillar" = 4 AND "costoArranque" = 10;
-- prensa-2c queda igual (5 / 12).
