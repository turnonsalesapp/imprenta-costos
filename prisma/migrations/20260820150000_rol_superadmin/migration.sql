-- Agrega el rol SUPERADMIN (superconjunto de ADMIN). Se coloca ANTES de ADMIN
-- para que el orden del enum en Postgres coincida con schema.prisma.
-- En PostgreSQL 12+ ADD VALUE es válido dentro de la transacción de migración
-- siempre que el nuevo valor no se USE en la misma transacción (aquí solo se
-- agrega). No se pueden eliminar valores de un enum, así que esta migración no
-- tiene reverso automático.
ALTER TYPE "Rol" ADD VALUE IF NOT EXISTS 'SUPERADMIN' BEFORE 'ADMIN';
