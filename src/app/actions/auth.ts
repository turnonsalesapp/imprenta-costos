"use server";

import { redirect } from "next/navigation";
import { iniciarSesion, cerrarSesion } from "@/lib/auth";

export type EstadoLogin = { error: string | null };

export async function loginAction(
  _prev: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "");
  const clave = String(formData.get("clave") ?? "");

  if (!email || !clave) {
    return { error: "Escribe tu correo y tu clave." };
  }

  const r = await iniciarSesion(email, clave);
  if (!r.ok) return { error: r.error };

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await cerrarSesion();
  redirect("/login");
}
