"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRol } from "@/lib/auth";
import {
  crearCliente, editarCliente, alternarActivoCliente, eliminarCliente, type DatosCliente,
} from "@/lib/clientes";

export type EstadoCliente = { error: string | null; ok?: boolean };

const esquema = z.object({
  nombre: z.string().trim().min(1, "El nombre del cliente es obligatorio."),
  rif: z.string().trim().optional(),
  contacto: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
  email: z.string().trim().optional(),
  direccion: z.string().trim().optional(),
  notas: z.string().trim().optional(),
});

function leer(formData: FormData): DatosCliente | { error: string } {
  const parsed = esquema.safeParse({
    nombre: formData.get("nombre"),
    rif: formData.get("rif"),
    contacto: formData.get("contacto"),
    telefono: formData.get("telefono"),
    email: formData.get("email"),
    direccion: formData.get("direccion"),
    notas: formData.get("notas"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const d = parsed.data;
  if (d.email && !/^\S+@\S+\.\S+$/.test(d.email)) return { error: "Ese correo no es válido." };
  return d;
}

export async function crearClienteAction(
  _prev: EstadoCliente,
  formData: FormData,
): Promise<EstadoCliente> {
  await requireRol("ADMIN", "VENDEDOR");
  const d = leer(formData);
  if ("error" in d) return { error: d.error };
  const id = await crearCliente(d);
  redirect(`/clientes/${id}`);
}

export async function editarClienteAction(
  _prev: EstadoCliente,
  formData: FormData,
): Promise<EstadoCliente> {
  await requireRol("ADMIN", "VENDEDOR");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el identificador del cliente." };
  const d = leer(formData);
  if ("error" in d) return { error: d.error };
  await editarCliente(id, d);
  revalidatePath(`/clientes/${id}`);
  return { error: null, ok: true };
}

export async function alternarActivoClienteAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN", "VENDEDOR");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await alternarActivoCliente(id);
  revalidatePath(`/clientes/${id}`);
  revalidatePath("/clientes");
}

/** Elimina un cliente (solo ADMIN, solo si no tiene histórico). */
export async function eliminarClienteAction(formData: FormData): Promise<void> {
  await requireRol("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const r = await eliminarCliente(id);
  if (!r.ok) redirect(`/clientes/${id}`);
  revalidatePath("/clientes");
  redirect("/clientes");
}
