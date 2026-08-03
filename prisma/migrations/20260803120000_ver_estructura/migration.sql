-- Permiso por usuario: ver la estructura de costos (costo, margen, desglose) o
-- solo el precio. Independiente del rol. Por defecto true (comportamiento actual).
ALTER TABLE "Usuario" ADD COLUMN "verEstructura" BOOLEAN NOT NULL DEFAULT true;
