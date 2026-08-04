-- Las cotizaciones que hoy están APROBADA eran, en el modelo anterior, "ganadas"
-- (con su orden generada). Se reclasifican a GANADA para que el nuevo APROBADA
-- quede libre como aprobación interna. (Migración separada: un valor de enum
-- recién agregado no puede usarse en la misma transacción que lo crea.)
UPDATE "Cotizacion" SET "estado" = 'GANADA' WHERE "estado" = 'APROBADA';
