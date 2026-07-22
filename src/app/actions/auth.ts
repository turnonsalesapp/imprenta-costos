"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { iniciarSesion, cerrarSesion } from "@/lib/auth";
import { limitar, reiniciarLimite } from "@/lib/rate-limit";

export type EstadoLogin = { error: string | null };

const MIN = 60_000;

export async function loginAction(
  _prev: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "");
  const clave = String(formData.get("clave") ?? "");

  if (!email || !clave) {
    return { error: "Escribe tu correo y tu clave." };
  }

  // Rate limiting: frena fuerza bruta por IP y por correo (fail-closed).
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconocida";
  const correo = email.trim().toLowerCase();
  const porIp = limitar(`login:ip:${ip}`, 10, 5 * MIN);
  const porCorreo = limitar(`login:correo:${correo}`, 8, 15 * MIN);
  if (!porIp.ok || !porCorreo.ok) {
    const seg = Math.max(porIp.enSegundos, porCorreo.enSegundos);
    return { error: `Demasiados intentos. Espera ${seg} segundos e intenta de nuevo.` };
  }

  const r = await iniciarSesion(email, clave);
  if (!r.ok) return { error: r.error };

  // Login válido: limpia el contador del correo para no penalizar al usuario.
  reiniciarLimite(`login:correo:${correo}`);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await cerrarSesion();
  redirect("/login");
}
