/**
 * Bootstrap del primer SUPERADMIN.
 *
 * Solo un SUPERADMIN puede otorgar el rol SUPERADMIN desde la app, así que el
 * PRIMERO hay que crearlo por fuera. Este script promueve a SUPERADMIN a un
 * usuario existente, identificado por su correo, y deja rastro en la bitácora.
 *
 * Uso:
 *   ADMIN_EMAIL=jefe@imprenta.com  npx tsx scripts/promover-superadmin.ts
 *   npx tsx scripts/promover-superadmin.ts jefe@imprenta.com
 *
 * El correo se toma del primer argumento o de la variable de entorno
 * SUPERADMIN_EMAIL / ADMIN_EMAIL (en ese orden). El usuario debe existir.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const email = (process.argv[2] ?? process.env.SUPERADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? "")
    .trim().toLowerCase();
  if (!email) {
    console.error("Falta el correo. Uso: npx tsx scripts/promover-superadmin.ts <correo>");
    process.exit(1);
  }

  const u = await db.usuario.findUnique({ where: { email }, select: { id: true, nombre: true, rol: true } });
  if (!u) {
    console.error(`No existe un usuario con el correo «${email}».`);
    process.exit(1);
  }
  if (u.rol === "SUPERADMIN") {
    console.log(`«${email}» ya es SUPERADMIN. Nada que hacer.`);
    return;
  }

  await db.$transaction(async (tx) => {
    await tx.usuario.update({ where: { id: u.id }, data: { rol: "SUPERADMIN" } });
    await tx.registroAuditoria.create({
      data: {
        actorId: u.id,
        actorNombre: u.nombre,
        accion: "usuario.rol",
        entidad: u.id,
        detalle: `Rol → SUPERADMIN (bootstrap por script; rol previo ${u.rol})`,
      },
    });
  });

  console.log(`Listo: «${email}» ahora es SUPERADMIN.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
