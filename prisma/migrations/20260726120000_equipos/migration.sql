-- CreateTable
CREATE TABLE "Equipo" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "coloresPasada" INTEGER NOT NULL DEFAULT 4,
    "costoMillar" DECIMAL(12,4) NOT NULL DEFAULT 6,
    "costoArranque" DECIMAL(12,4) NOT NULL DEFAULT 15,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Equipo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Equipo_clave_key" ON "Equipo"("clave");

