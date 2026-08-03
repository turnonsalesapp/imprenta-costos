import { describe, it, expect } from "vitest";
import {
  validarArchivo, elegirAlmacen, almacenDb, almacenDrive,
  esInline, MAX_BYTES,
} from "./almacenamiento";
import { puedeBorrarDelHilo } from "./roles";

describe("validarArchivo — tamaño y tipo", () => {
  it("acepta una imagen PNG dentro del límite", () => {
    expect(validarArchivo({ nombre: "arte.png", tipo: "image/png", tamano: 1024 }))
      .toEqual({ ok: true });
  });

  it("acepta PDF y ofimática común", () => {
    expect(validarArchivo({ nombre: "a.pdf", tipo: "application/pdf", tamano: 10 }).ok).toBe(true);
    expect(validarArchivo({
      nombre: "a.docx",
      tipo: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      tamano: 10,
    }).ok).toBe(true);
  });

  it("rechaza un archivo que supera 8 MB", () => {
    const r = validarArchivo({ nombre: "grande.png", tipo: "image/png", tamano: MAX_BYTES + 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/8 MB/);
  });

  it("acepta exactamente el límite de 8 MB", () => {
    expect(validarArchivo({ nombre: "justo.png", tipo: "image/png", tamano: MAX_BYTES }).ok).toBe(true);
  });

  it("rechaza ejecutables y tipos no permitidos", () => {
    expect(validarArchivo({ nombre: "x.exe", tipo: "application/x-msdownload", tamano: 10 }).ok).toBe(false);
    expect(validarArchivo({ nombre: "s.sh", tipo: "application/x-sh", tamano: 10 }).ok).toBe(false);
  });

  it("rechaza archivos vacíos o sin nombre", () => {
    expect(validarArchivo({ nombre: "a.png", tipo: "image/png", tamano: 0 }).ok).toBe(false);
    expect(validarArchivo({ nombre: "", tipo: "image/png", tamano: 10 }).ok).toBe(false);
  });
});

describe("esInline", () => {
  it("imágenes y PDF se muestran en línea; lo demás se descarga", () => {
    expect(esInline("image/png")).toBe(true);
    expect(esInline("application/pdf")).toBe(true);
    expect(esInline("application/vnd.ms-excel")).toBe(false);
    expect(esInline("text/csv")).toBe(false);
  });
});

describe("elegirAlmacen — selección de backend por env", () => {
  it("por defecto usa el backend 'db'", () => {
    expect(elegirAlmacen(undefined).nombre).toBe("db");
    expect(elegirAlmacen("db").nombre).toBe("db");
  });

  it("selecciona 'drive' cuando se pide explícitamente", () => {
    expect(elegirAlmacen("drive").nombre).toBe("drive");
    expect(elegirAlmacen("DRIVE").nombre).toBe("drive"); // no distingue mayúsculas
  });

  it("un valor desconocido cae a 'db' (seguro por defecto)", () => {
    expect(elegirAlmacen("s3").nombre).toBe("db");
    expect(elegirAlmacen("").nombre).toBe("db");
  });
});

describe("backends de almacenamiento", () => {
  it("'db' devuelve los bytes para guardarlos como bytea", async () => {
    const bytes = Buffer.from("hola");
    const r = await almacenDb.guardar({ nombre: "a.txt", tipo: "text/plain", bytes });
    expect(r.almacen).toBe("db");
    expect(r.datos).toBe(bytes);
    expect(r.driveFileId).toBeUndefined();
  });

  it("'drive' lanza si no está configurado", async () => {
    await expect(
      almacenDrive.guardar({ nombre: "a.txt", tipo: "text/plain", bytes: Buffer.from("x") }),
    ).rejects.toThrow(/no configurado/i);
  });
});

describe("puedeBorrarDelHilo — permiso de borrado (autor o ADMIN)", () => {
  const autor = { id: "u1", rol: "VENDEDOR" as const };
  const otro = { id: "u2", rol: "VENDEDOR" as const };
  const admin = { id: "u9", rol: "ADMIN" as const };
  const taller = { id: "u3", rol: "TALLER" as const };

  it("el autor puede borrar lo suyo", () => {
    expect(puedeBorrarDelHilo(autor, "u1")).toBe(true);
  });

  it("otro usuario (no ADMIN) no puede borrar lo ajeno", () => {
    expect(puedeBorrarDelHilo(otro, "u1")).toBe(false);
    expect(puedeBorrarDelHilo(taller, "u1")).toBe(false);
  });

  it("ADMIN puede borrar cualquier cosa, incluso de autor desconocido", () => {
    expect(puedeBorrarDelHilo(admin, "u1")).toBe(true);
    expect(puedeBorrarDelHilo(admin, null)).toBe(true);
  });

  it("autor desconocido (null) solo lo borra ADMIN", () => {
    expect(puedeBorrarDelHilo(autor, null)).toBe(false);
  });
});
