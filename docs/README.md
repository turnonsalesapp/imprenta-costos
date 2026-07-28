# Documentación del proyecto

Sistema de Costos y Producción para imprenta (*Altoprint* — Producciones AP2024, C.A.).

## Referencias principales

| Documento | Para quién | Contenido |
|---|---|---|
| [**Documentación de Usuario**](DOCUMENTACION_USUARIO.md) | vendedores, taller, administración | Uso diario completo: las cinco calculadoras (Digital, Offset, Proveedor, Gran formato, Personalizados), cotizaciones mixtas y el carrito, comparadores, IA, órdenes, inventario, consumo, clientes, variables, tasas, usuarios y auditoría |
| [**Documentación de Desarrollo**](DOCUMENTACION_DESARROLLO.md) | desarrolladores / técnico | Arquitectura, los seis motores de cálculo con fórmulas exactas, modelo de datos, flujos de cotización y sistema de ítems mezclados, seguridad, config, tasas, catálogos, IA, API, migraciones/despliegue, pruebas y **decisiones de diseño documentadas** |

## Documentos de apoyo (referencia histórica y detalle)

| Documento | Contenido |
|---|---|
| [01 · Especificación técnica](01_ESPECIFICACION_TECNICA.md) | Especificación original del sistema (motor digital, seguridad, despliegue). |
| [02 · Análisis de estándares de código](02_ANALISIS_ESTANDARES_CODIGO.md) | Revisión contra el estándar TOS V2, adaptado a Next.js/TS; hallazgos y mejoras (todas implementadas). |
| [03 · Manual de usuario](03_MANUAL_USUARIO.md) | Manual de usuario original (previo a offset/gran formato/mixtas). Sustituido por la Documentación de Usuario. |
| [04 · Manual de configuración](04_MANUAL_CONFIGURACION.md) | Variables de entorno, despliegue, migraciones y configuración funcional en detalle. |
| [05 · Auditoría de módulos](05_AUDITORIA_MODULOS.md) | Corrida de los motores reales sobre la semilla; los 10 trabajos más comunes por línea; hallazgos de modelado A–H y sus decisiones. |
| [06 · Costos de mercado (Venezuela)](06_COSTOS_MERCADO_VENEZUELA.md) | Investigación de parámetros base (ojetes, offset, gran formato) con fuente y confianza. |
| [glosario](glosario.md) | Términos de dominio: un concepto, un nombre en código, BD y documentación. |

> El `README.md` de la raíz es la guía de arranque rápido para desarrollo.
> `CONTRIBUTING.md` fija las reglas de oro y la convención de commits.
