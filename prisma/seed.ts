import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PAPELES_BASE, ACABADOS_BASE, CONFIG_BASE, MATERIALES_GF_BASE, PRODUCTOS_GF_BASE } from "../src/lib/datos-base";

const db = new PrismaClient();

async function main() {
  // Variables del negocio (fila única)
  await db.config.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global", ...CONFIG_BASE },
  });

  await db.tasa.create({
    data: {
      bcv: CONFIG_BASE.tasaBCV,
      binCompra: CONFIG_BASE.binCompra,
      binVenta: CONFIG_BASE.binVenta,
    },
  });

  for (const p of PAPELES_BASE) {
    await db.papel.upsert({
      where: { clave: p.id },
      update: {},
      create: { clave: p.id, nombre: p.nombre, hojas: p.hojas, precio: p.precio, medida: p.med },
    });
  }

  for (const [i, a] of ACABADOS_BASE.entries()) {
    await db.acabado.upsert({
      where: { clave: a.id },
      update: {},
      create: { clave: a.id, label: a.label, costo: a.costo, unidad: a.unidad, escala: a.escala, orden: i, grupo: a.grupo ?? null },
    });
  }

  for (const m of MATERIALES_GF_BASE) {
    await db.materialGF.upsert({
      where: { clave: m.clave },
      update: {},
      create: {
        clave: m.clave, nombre: m.nombre, categoria: m.categoria,
        costoM2: m.costoM2, modoCobro: m.modo, anchosRollo: m.anchos,
      },
    });
  }

  for (const p of PRODUCTOS_GF_BASE) {
    await db.productoGF.upsert({
      where: { clave: p.clave },
      update: {},
      create: {
        clave: p.clave, nombre: p.nombre, categoria: p.categoria,
        medida: p.medida, costoUnit: p.costoUnit,
      },
    });
  }

  const email = process.env.ADMIN_EMAIL ?? "admin@imprenta.com";
  const pass = process.env.ADMIN_PASSWORD ?? "cambiar123";
  await db.usuario.upsert({
    where: { email },
    update: {},
    create: {
      email,
      nombre: "Administrador",
      passwordHash: await bcrypt.hash(pass, 10),
      rol: "ADMIN",
    },
  });

  console.log(`Listo: ${PAPELES_BASE.length} papeles, ${ACABADOS_BASE.length} acabados.`);
  console.log(`Usuario: ${email} / ${pass}  ← cambia esta clave al primer ingreso.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
