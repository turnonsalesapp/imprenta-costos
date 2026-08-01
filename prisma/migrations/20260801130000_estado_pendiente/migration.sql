-- Nuevo estado intermedio "Pendiente de aprobación" (antes de enviar al cliente).
-- Se posiciona justo después de BORRADOR / antes de ENVIADA en el enum.
ALTER TYPE "EstadoCotizacion" ADD VALUE IF NOT EXISTS 'PENDIENTE' BEFORE 'ENVIADA';
