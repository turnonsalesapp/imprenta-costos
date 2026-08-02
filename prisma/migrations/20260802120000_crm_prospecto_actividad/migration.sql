-- CRM comercial: prospectos (leads) y actividades (reuniones/seguimientos).
CREATE TYPE "ProspectoEstado" AS ENUM ('NUEVO', 'CONTACTADO', 'CONVERTIDO', 'DESCARTADO');
CREATE TYPE "ActividadTipo" AS ENUM ('REUNION', 'LLAMADA', 'SEGUIMIENTO', 'NOTA');

CREATE TABLE "Prospecto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "clienteNombre" TEXT,
    "clienteId" TEXT,
    "contacto" TEXT,
    "detalle" TEXT,
    "estado" "ProspectoEstado" NOT NULL DEFAULT 'NUEVO',
    "cotizacionId" TEXT,
    "usuarioId" TEXT,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "Prospecto_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Prospecto_estado_idx" ON "Prospecto"("estado");

CREATE TABLE "Actividad" (
    "id" TEXT NOT NULL,
    "tipo" "ActividadTipo" NOT NULL DEFAULT 'REUNION',
    "titulo" TEXT NOT NULL,
    "fecha" TIMESTAMPTZ(3),
    "hecha" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "clienteId" TEXT,
    "clienteNombre" TEXT,
    "prospectoId" TEXT,
    "cotizacionId" TEXT,
    "usuarioId" TEXT,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Actividad_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Actividad_hecha_fecha_idx" ON "Actividad"("hecha", "fecha");
