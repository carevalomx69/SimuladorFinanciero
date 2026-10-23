-- ==============================================================================
-- Migración para la versión con las fórmulas corregidas.
-- Córrela UNA sola vez en la base de datos que ya existe (no borra nada).
-- (Está fuera de Bd/ a propósito: Bd/ se ejecuta solo al crear la base desde cero y ahí schema.sql ya trae estos cambios.)
-- ==============================================================================
ALTER TABLE proyectos ADD COLUMN parametros_extra LONGTEXT NULL;
ALTER TABLE proyectos MODIFY dias_credito_ventas DECIMAL(10,4) NULL;
ALTER TABLE proyectos MODIFY dias_credito_compras DECIMAL(10,4) NULL;
ALTER TABLE proyectos MODIFY tiempo_unidad_mo DECIMAL(18,6) NULL;
ALTER TABLE inversiones MODIFY vida_util_anios DECIMAL(10,4) NULL;
