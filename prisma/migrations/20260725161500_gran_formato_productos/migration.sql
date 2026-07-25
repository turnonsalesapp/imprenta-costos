-- CreateTable
CREATE TABLE "ProductoGF" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Pendón',
    "medida" TEXT NOT NULL DEFAULT '',
    "costoUnit" DECIMAL(12,4) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProductoGF_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductoGF_clave_key" ON "ProductoGF"("clave");

