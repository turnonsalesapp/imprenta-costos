import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PAPELES_BASE, ACABADOS_BASE, CONFIG_BASE } from "../src/lib/datos-base";

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
