-- Referencia a la cotización del sistema paralelo/externo. Sirve para relacionar
-- una orden/cotización del sistema con la cotización hecha por fuera (p. ej. las
-- órdenes en proceso importadas desde Trello, que no tienen cotización interna).
ALTER TABLE "Cotizacion" ADD COLUMN "refCotizacion" TEXT;
