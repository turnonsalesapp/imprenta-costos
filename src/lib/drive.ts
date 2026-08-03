import "server-only";
import { SignJWT, importPKCS8 } from "jose";

/**
 * Integración con Google Drive SIN dependencias pesadas (usa `jose` + fetch).
 * Sube adjuntos a una carpeta y los descarga en streaming desde el servidor, para
 * que cualquier usuario de la app pueda verlos aunque no tenga cuenta de Google.
 *
 * Dos formas de autenticar, elegidas por entorno:
 *   1) OAuth de usuario (recomendado si la organización bloquea las claves de
 *      service account con `iam.managed.disableServiceAccountKeyCreation`):
 *        GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN.
 *      La app actúa como el usuario dueño del token; sirve para una carpeta de
 *      "Mi unidad" (los archivos quedan a su nombre, sin problema de cuota).
 *   2) Cuenta de servicio (si se pueden crear claves y hay Unidad Compartida):
 *        GOOGLE_SERVICE_ACCOUNT_JSON.
 * En ambos casos: GDRIVE_FOLDER_ID = carpeta destino.
 */

const TOKEN_URI = "https://oauth2.googleapis.com/token";

function carpetaId(): string {
  const id = process.env.GDRIVE_FOLDER_ID?.trim();
  if (!id) throw new Error("Falta GDRIVE_FOLDER_ID.");
  return id;
}

/** ¿Está configurado algún backend de Drive? */
export function driveConfigurado(): boolean {
  if (!process.env.GDRIVE_FOLDER_ID) return false;
  const oauth =
    !!process.env.GOOGLE_OAUTH_CLIENT_ID &&
    !!process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  return oauth || !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
}

// ─────────────────────────── token de acceso ───────────────────────────

// Caché en memoria (se renueva ~1 min antes de expirar).
let tokenCache: { token: string; expira: number } | null = null;

async function accessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expira) return tokenCache.token;
  const token = process.env.GOOGLE_OAUTH_REFRESH_TOKEN
    ? await tokenOAuth()
    : await tokenServiceAccount();
  return token;
}

/** OAuth de usuario: cambia el refresh token por un access token. */
async function tokenOAuth(): Promise<string> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Faltan GOOGLE_OAUTH_CLIENT_ID / SECRET / REFRESH_TOKEN.");
  }
  const res = await fetch(TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Drive (OAuth): no se pudo refrescar el token (${res.status}).`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: data.access_token, expira: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

type Credenciales = { client_email: string; private_key: string; token_uri?: string };

/** Cuenta de servicio: JWT firmado → access token. */
async function tokenServiceAccount(): Promise<string> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) throw new Error("Falta GOOGLE_SERVICE_ACCOUNT_JSON (o configura OAuth).");
  const texto = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  const c = JSON.parse(texto) as Credenciales;
  if (!c.client_email || !c.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON incompleto (client_email/private_key).");
  }
  const privateKey = c.private_key.replace(/\\n/g, "\n");
  const tokenUri = c.token_uri || TOKEN_URI;
  const key = await importPKCS8(privateKey, "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/drive" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(c.client_email)
    .setAudience(tokenUri)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);

  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`Drive (SA): no se pudo obtener token (${res.status}).`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: data.access_token, expira: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

// ─────────────────────────── subir / descargar ───────────────────────────

/** Sube un archivo a la carpeta configurada. Devuelve el fileId y el enlace web. */
export async function subirADrive(
  f: { nombre: string; tipo: string; bytes: Buffer },
): Promise<{ id: string; webViewLink?: string }> {
  const token = await accessToken();
  const metadata = { name: f.nombre, parents: [carpetaId()] };

  const boundary = "imprenta-" + Math.random().toString(36).slice(2);
  const pre =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: ${f.tipo || "application/octet-stream"}\r\n\r\n`;
  const post = `\r\n--${boundary}--`;
  const cuerpo = Buffer.concat([Buffer.from(pre, "utf8"), f.bytes, Buffer.from(post, "utf8")]);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: new Uint8Array(cuerpo),
    },
  );
  if (!res.ok) throw new Error(`Drive: falló la subida (${res.status}).`);
  const data = (await res.json()) as { id: string; webViewLink?: string };
  return { id: data.id, webViewLink: data.webViewLink };
}

/** Descarga un archivo de Drive por su fileId (para servirlo desde la app). */
export async function descargarDeDrive(fileId: string): Promise<Buffer> {
  const token = await accessToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Drive: falló la descarga (${res.status}).`);
  return Buffer.from(await res.arrayBuffer());
}
