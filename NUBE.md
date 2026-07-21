# Trabajar sin instalar nada en tu computadora

Este proyecto está preparado para construirse enteramente en la nube. Tu
máquina solo pone el navegador.

```
GitHub          guarda el código
Codespaces      el computador donde corre Claude Code y se prueba el sistema
Railway         la base de datos y el sistema publicado para tu equipo
```

## Antes de empezar

Revisa si existe una versión web de Claude Code en
<https://docs.claude.com/en/docs/claude-code/overview>. Si la hay y trabaja
directamente sobre repositorios de GitHub, úsala: te saltas Codespaces
completo y este archivo solo te sirve como referencia.

Si no, sigue con Codespaces. Funciona igual de bien.

## Qué trae ya configurado

- `.devcontainer/devcontainer.json` — el entorno en la nube arranca con Node 22,
  corre `npm install` solo, y abre el puerto 3000 con vista previa.
- `railway.json` — el despliegue, las migraciones automáticas y el health check.

## Las claves no van en un archivo

Trabajando en la nube **no creas un `.env`**. Las credenciales se guardan como
*secrets* del repositorio en GitHub y el entorno las recibe como variables. Así
nunca viajan dentro del código.

Los cuatro secrets que necesitas:

| Nombre | Valor |
|---|---|
| `DATABASE_URL` | La cadena **pública** de Railway (dice `rlwy.net`) |
| `AUTH_SECRET` | Una clave larga aleatoria |
| `ADMIN_EMAIL` | `admin@imprenta.com` |
| `ADMIN_PASSWORD` | Una clave temporal para el primer ingreso |

Se cargan en GitHub → tu perfil → **Settings → Codespaces → Secrets**.

> Ojo: son los secrets de **Codespaces**, no los de *Actions*. Están en dos
> pantallas distintas y se parecen.

## Ver el sistema mientras lo construyes

Cuando corras `npm run dev` dentro del entorno en la nube, se abre una vista
previa en una pestaña. Esa dirección es privada y temporal: sirve para que tú
revises el avance, no para tu equipo. La dirección definitiva es la de Railway.

## Lo único que se apaga solo

Codespaces se suspende tras unos minutos sin uso, y tiene horas gratis
limitadas al mes. Al volver, retoma donde quedaste. Para no perder trabajo,
haz commit al terminar cada sesión:

```
Haz commit de lo que llevamos y súbelo a GitHub.
```

Nada de esto afecta a Railway: el sistema publicado sigue en línea para tu
equipo aunque tu entorno de trabajo esté dormido.
