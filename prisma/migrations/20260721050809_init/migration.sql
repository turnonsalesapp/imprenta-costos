-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'VENDEDOR', 'TALLER');

-- CreateEnum
CREATE TYPE "EstadoCotizacion" AS ENUM ('BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "EstadoOrden" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'TERMINADA', 'ENTREGADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "EstadoEtapa" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'LISTA', 'OMITIDA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'VENDEDOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sesion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rif" TEXT,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Papel" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "hojas" INTEGER NOT NULL,
    "precio" DECIMAL(12,4) NOT NULL,
    "medida" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Papel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acabado" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "costo" DECIMAL(12,4) NOT NULL,
    "unidad" TEXT NOT NULL,
    "escala" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Acabado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Config" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "merma" DECIMAL(6,2) NOT NULL DEFAULT 3,
    "margen" DECIMAL(6,2) NOT NULL DEFAULT 30,
    "comision" DECIMAL(6,2) NOT NULL DEFAULT 3,
    "ml" DECIMAL(6,2) NOT NULL DEFAULT 12,
    "tasaBCV" DECIMAL(14,4) NOT NULL,
    "binCompra" DECIMAL(14,4) NOT NULL,
    "binVenta" DECIMAL(14,4) NOT NULL,
    "pinza" DECIMAL(6,2) NOT NULL DEFAULT 5,
    "sep" DECIMAL(6,2) NOT NULL DEFAULT 3,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tasa" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bcv" DECIMAL(14,4) NOT NULL,
    "binCompra" DECIMAL(14,4) NOT NULL,
    "binVenta" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "Tasa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trabajo" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "ancho" INTEGER NOT NULL,
    "alto" INTEGER NOT NULL,
    "tamano" TEXT NOT NULL,
    "papelId" TEXT,
    "capacidad" INTEGER NOT NULL,
    "capAuto" BOOLEAN NOT NULL DEFAULT true,
    "acabados" JSONB NOT NULL,
    "archivado" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "estado" "EstadoCotizacion" NOT NULL DEFAULT 'BORRADOR',
    "clienteId" TEXT,
    "trabajoId" TEXT,
    "usuarioId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "cantidad" INTEGER NOT NULL,
    "ancho" INTEGER NOT NULL,
    "alto" INTEGER NOT NULL,
    "tamano" TEXT NOT NULL,
    "papelNombre" TEXT NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "entrada" JSONB NOT NULL,
    "snapshot" JSONB NOT NULL,
    "lineas" JSONB NOT NULL,
    "pliegos" DECIMAL(14,4) NOT NULL,
    "costoTotal" DECIMAL(14,4) NOT NULL,
    "costoUnit" DECIMAL(14,6) NOT NULL,
    "diferencial" DECIMAL(10,6) NOT NULL,
    "margen" DECIMAL(6,2) NOT NULL,
    "precioUnit" DECIMAL(14,6) NOT NULL,
    "ventaTotal" DECIMAL(14,4) NOT NULL,
    "precioML" DECIMAL(14,6) NOT NULL,
    "tasaBCV" DECIMAL(14,4) NOT NULL,
    "precioBs" DECIMAL(16,4) NOT NULL,
    "validaHasta" TIMESTAMP(3),
    "notas" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orden" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "cotizacionId" TEXT NOT NULL,
    "estado" "EstadoOrden" NOT NULL DEFAULT 'PENDIENTE',
    "usuarioId" TEXT,
    "fechaEntrega" TIMESTAMP(3),
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "instrucciones" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerradaEn" TIMESTAMP(3),

    CONSTRAINT "Orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtapaOrden" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoEtapa" NOT NULL DEFAULT 'PENDIENTE',
    "responsable" TEXT,
    "iniciadaEn" TIMESTAMP(3),
    "terminadaEn" TIMESTAMP(3),
    "notas" TEXT,

    CONSTRAINT "EtapaOrden_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sesion_token_key" ON "Sesion"("token");

-- CreateIndex
CREATE INDEX "Sesion_usuarioId_idx" ON "Sesion"("usuarioId");

-- CreateIndex
CREATE INDEX "Cliente_nombre_idx" ON "Cliente"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Papel_clave_key" ON "Papel"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "Acabado_clave_key" ON "Acabado"("clave");

-- CreateIndex
CREATE INDEX "Tasa_fecha_idx" ON "Tasa"("fecha");

-- CreateIndex
CREATE INDEX "Trabajo_clienteId_idx" ON "Trabajo"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_numero_key" ON "Cotizacion"("numero");

-- CreateIndex
CREATE INDEX "Cotizacion_clienteId_idx" ON "Cotizacion"("clienteId");

-- CreateIndex
CREATE INDEX "Cotizacion_estado_idx" ON "Cotizacion"("estado");

-- CreateIndex
CREATE INDEX "Cotizacion_creadaEn_idx" ON "Cotizacion"("creadaEn");

-- CreateIndex
CREATE UNIQUE INDEX "Orden_numero_key" ON "Orden"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Orden_cotizacionId_key" ON "Orden"("cotizacionId");

-- CreateIndex
CREATE INDEX "Orden_estado_idx" ON "Orden"("estado");

-- CreateIndex
CREATE INDEX "Orden_fechaEntrega_idx" ON "Orden"("fechaEntrega");

-- CreateIndex
CREATE INDEX "EtapaOrden_ordenId_idx" ON "EtapaOrden"("ordenId");

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trabajo" ADD CONSTRAINT "Trabajo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trabajo" ADD CONSTRAINT "Trabajo_papelId_fkey" FOREIGN KEY ("papelId") REFERENCES "Papel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_trabajoId_fkey" FOREIGN KEY ("trabajoId") REFERENCES "Trabajo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orden" ADD CONSTRAINT "Orden_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orden" ADD CONSTRAINT "Orden_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtapaOrden" ADD CONSTRAINT "EtapaOrden_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "Orden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

