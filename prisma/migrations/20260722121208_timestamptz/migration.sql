-- Convierte todas las columnas de fecha de TIMESTAMP (sin zona) a TIMESTAMPTZ.
-- Prisma guarda las fechas en UTC, así que interpretamos explícitamente el valor
-- almacenado como UTC (AT TIME ZONE 'UTC') para que NINGÚN dato existente se
-- desplace, sin importar la zona horaria de la sesión que corra la migración.

ALTER TABLE "Usuario"
  ALTER COLUMN "creadoEn" SET DATA TYPE TIMESTAMPTZ(3) USING "creadoEn" AT TIME ZONE 'UTC';

ALTER TABLE "Sesion"
  ALTER COLUMN "expiraEn" SET DATA TYPE TIMESTAMPTZ(3) USING "expiraEn" AT TIME ZONE 'UTC';

ALTER TABLE "Cliente"
  ALTER COLUMN "creadoEn" SET DATA TYPE TIMESTAMPTZ(3) USING "creadoEn" AT TIME ZONE 'UTC';

ALTER TABLE "MovimientoInventario"
  ALTER COLUMN "fecha" SET DATA TYPE TIMESTAMPTZ(3) USING "fecha" AT TIME ZONE 'UTC';

ALTER TABLE "Config"
  ALTER COLUMN "actualizadoEn" SET DATA TYPE TIMESTAMPTZ(3) USING "actualizadoEn" AT TIME ZONE 'UTC';

ALTER TABLE "Tasa"
  ALTER COLUMN "fecha" SET DATA TYPE TIMESTAMPTZ(3) USING "fecha" AT TIME ZONE 'UTC';

ALTER TABLE "Trabajo"
  ALTER COLUMN "creadoEn" SET DATA TYPE TIMESTAMPTZ(3) USING "creadoEn" AT TIME ZONE 'UTC';

ALTER TABLE "Cotizacion"
  ALTER COLUMN "validaHasta" SET DATA TYPE TIMESTAMPTZ(3) USING "validaHasta" AT TIME ZONE 'UTC',
  ALTER COLUMN "creadaEn" SET DATA TYPE TIMESTAMPTZ(3) USING "creadaEn" AT TIME ZONE 'UTC';

ALTER TABLE "Orden"
  ALTER COLUMN "fechaEntrega" SET DATA TYPE TIMESTAMPTZ(3) USING "fechaEntrega" AT TIME ZONE 'UTC',
  ALTER COLUMN "creadaEn" SET DATA TYPE TIMESTAMPTZ(3) USING "creadaEn" AT TIME ZONE 'UTC',
  ALTER COLUMN "cerradaEn" SET DATA TYPE TIMESTAMPTZ(3) USING "cerradaEn" AT TIME ZONE 'UTC';

ALTER TABLE "EtapaOrden"
  ALTER COLUMN "iniciadaEn" SET DATA TYPE TIMESTAMPTZ(3) USING "iniciadaEn" AT TIME ZONE 'UTC',
  ALTER COLUMN "terminadaEn" SET DATA TYPE TIMESTAMPTZ(3) USING "terminadaEn" AT TIME ZONE 'UTC';

ALTER TABLE "RegistroAuditoria"
  ALTER COLUMN "fecha" SET DATA TYPE TIMESTAMPTZ(3) USING "fecha" AT TIME ZONE 'UTC';
