-- Pipeline comercial: se separa "Aprobada" (aprobación interna) de "Ganada"
-- (el cliente aceptó → dispara la Orden de Producción). Se añade el valor GANADA.
ALTER TYPE "EstadoCotizacion" ADD VALUE IF NOT EXISTS 'GANADA' AFTER 'APROBADA';
