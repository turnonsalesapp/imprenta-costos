-- Permisos de cotización por usuario. ADMIN siempre puede todo (ignora estos).
ALTER TABLE "Usuario"
  ADD COLUMN "puedeCotizar"  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "tiposCotizar"  TEXT[]  NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "puedeEliminar" BOOLEAN NOT NULL DEFAULT false;
