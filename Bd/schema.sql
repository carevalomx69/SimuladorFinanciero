-- ==============================================================================
-- SCHEMA: Sistema de Análisis Financiero de Proyectos
-- Motor: MySQL 8.0
-- Fase 1: Migración de Oracle -> MySQL, basado en base_buena.sql
-- (Se descartan los datos de prueba viejos; el schema queda limpio)
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- Tabla: proyectos
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `proyectos`;
CREATE TABLE `proyectos` (
  `id_proyecto` INT NOT NULL AUTO_INCREMENT,
  `nombre_proyecto` VARCHAR(255) NOT NULL,
  `poblacion_total` BIGINT DEFAULT NULL,
  `pct_mujeres` DECIMAL(10,4) DEFAULT NULL,
  `pct_rango_edad` DECIMAL(10,4) DEFAULT NULL,
  `pct_poblacion_ocupada` DECIMAL(10,4) DEFAULT NULL,
  `pct_concentracion_mercado` DECIMAL(10,4) DEFAULT NULL,
  `participacion_mercado` DECIMAL(10,4) DEFAULT NULL,
  `incremento_poblacion` DECIMAL(10,4) DEFAULT NULL,
  `incremento_producto` DECIMAL(10,4) DEFAULT NULL,
  `penetracion_inicial` DECIMAL(10,4) DEFAULT NULL,
  `incremento_penetracion` DECIMAL(10,4) DEFAULT NULL,
  `precio_unitario_base` DECIMAL(18,4) DEFAULT NULL,
  `incremento_precio` DECIMAL(10,4) DEFAULT NULL,
  `unidades_venta_a1` DECIMAL(18,2) DEFAULT NULL,
  `unidades_venta_a2` DECIMAL(18,2) DEFAULT NULL,
  `unidades_venta_a3` DECIMAL(18,2) DEFAULT NULL,
  `unidades_venta_a4` DECIMAL(18,2) DEFAULT NULL,
  `unidades_venta_a5` DECIMAL(18,2) DEFAULT NULL,
  `dias_credito_ventas` INT DEFAULT NULL,
  `dias_credito_compras` INT DEFAULT NULL,
  `descuento_pronto_pago` DECIMAL(10,4) DEFAULT NULL,
  `inv_inicial_prod` DECIMAL(18,2) DEFAULT NULL,
  `inv_final_a1` DECIMAL(18,2) DEFAULT NULL,
  `inv_final_a2` DECIMAL(18,2) DEFAULT NULL,
  `inv_final_a3` DECIMAL(18,2) DEFAULT NULL,
  `inv_final_a4` DECIMAL(18,2) DEFAULT NULL,
  `inv_final_a5` DECIMAL(18,2) DEFAULT NULL,
  `inv_inicial_mp` DECIMAL(18,2) DEFAULT NULL,
  `inv_final_mp_pct` DECIMAL(10,4) DEFAULT NULL,
  `tiempo_unidad_mo` DECIMAL(18,4) DEFAULT NULL,
  `costo_hora_mo` DECIMAL(18,4) DEFAULT NULL,
  `inversion_inicial` DECIMAL(18,4) DEFAULT NULL,
  `saldo_inicial` DECIMAL(18,4) DEFAULT '0.0000',
  `pct_cobro_efectivo` DECIMAL(10,4) DEFAULT '80.0000',
  `inflacion_anual` DECIMAL(10,4) DEFAULT '0.0000',
  `fecha_creacion` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  -- NUEVO (Fase 2 adelantada aquí porque la FK debe existir desde el inicio):
  `fk_id_usuario` INT NOT NULL,
  PRIMARY KEY (`id_proyecto`),
  KEY `fk_id_usuario` (`fk_id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------------------------
-- Tabla: inversiones
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `inversiones`;
CREATE TABLE `inversiones` (
  `id_inversion` INT NOT NULL AUTO_INCREMENT,
  `fk_id_proyecto` INT NOT NULL,
  `nombre_activo` VARCHAR(255) DEFAULT NULL,
  `monto` DECIMAL(18,4) DEFAULT NULL,
  `vida_util_anios` INT DEFAULT NULL,
  `metodo_depreciacion` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`id_inversion`),
  KEY `fk_id_proyecto` (`fk_id_proyecto`),
  CONSTRAINT `inversiones_ibfk_1` FOREIGN KEY (`fk_id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------------------------
-- Tabla: materias_primas
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `materias_primas`;
CREATE TABLE `materias_primas` (
  `id_materia_prima` INT NOT NULL AUTO_INCREMENT,
  `fk_id_proyecto` INT NOT NULL,
  `nombre_mp` VARCHAR(255) DEFAULT NULL,
  `cantidad_por_unidad_prod` DECIMAL(18,4) DEFAULT NULL,
  `unidad_medida` VARCHAR(50) DEFAULT NULL,
  `costo_unitario` DECIMAL(18,4) DEFAULT NULL,
  PRIMARY KEY (`id_materia_prima`),
  KEY `fk_id_proyecto` (`fk_id_proyecto`),
  CONSTRAINT `materias_primas_ibfk_1` FOREIGN KEY (`fk_id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------------------------
-- Tabla: gastos_administrativos
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `gastos_administrativos`;
CREATE TABLE `gastos_administrativos` (
  `id_gasto_admin` INT NOT NULL AUTO_INCREMENT,
  `fk_id_proyecto` INT NOT NULL,
  `concepto` VARCHAR(255) DEFAULT NULL,
  `monto_mensual` DECIMAL(18,4) DEFAULT NULL,
  PRIMARY KEY (`id_gasto_admin`),
  KEY `fk_id_proyecto` (`fk_id_proyecto`),
  CONSTRAINT `gastos_administrativos_ibfk_1` FOREIGN KEY (`fk_id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------------------------
-- Tabla: gastos_ventas
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `gastos_ventas`;
CREATE TABLE `gastos_ventas` (
  `id_gasto_ventas` INT NOT NULL AUTO_INCREMENT,
  `fk_id_proyecto` INT NOT NULL,
  `concepto` VARCHAR(255) DEFAULT NULL,
  `porcentaje_sobre_ventas` DECIMAL(10,4) DEFAULT NULL,
  PRIMARY KEY (`id_gasto_ventas`),
  KEY `fk_id_proyecto` (`fk_id_proyecto`),
  CONSTRAINT `gastos_ventas_ibfk_1` FOREIGN KEY (`fk_id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------------------------
-- Tabla: gastos_indirectos_fijos
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `gastos_indirectos_fijos`;
CREATE TABLE `gastos_indirectos_fijos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fk_id_proyecto` INT NOT NULL,
  `concepto` VARCHAR(255) DEFAULT NULL,
  `monto_anual` DECIMAL(18,4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_id_proyecto` (`fk_id_proyecto`),
  CONSTRAINT `gastos_indirectos_fijos_ibfk_1` FOREIGN KEY (`fk_id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------------------------
-- Tabla: gastos_indirectos_variables
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `gastos_indirectos_variables`;
CREATE TABLE `gastos_indirectos_variables` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fk_id_proyecto` INT NOT NULL,
  `concepto` VARCHAR(255) DEFAULT NULL,
  `por_unidad` DECIMAL(18,4) DEFAULT NULL,
  `unidad` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_id_proyecto` (`fk_id_proyecto`),
  CONSTRAINT `gastos_indirectos_variables_ibfk_1` FOREIGN KEY (`fk_id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------------------------
-- Tabla: usuarios (NUEVA - Fase 2, incluida aquí porque proyectos depende de ella)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `email` VARCHAR(190) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  -- NUEVO: modelo de roles pedido por el profesor. 'gratuito' por defecto
  -- para que el registro normal no tenga que tocarse.
  `rol` ENUM('gratuito','de_pago','administrador') NOT NULL DEFAULT 'gratuito',
  `fecha_creacion` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uq_usuarios_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Ahora sí, agregamos la FK de proyectos -> usuarios
ALTER TABLE `proyectos`
  ADD CONSTRAINT `proyectos_ibfk_usuario`
  FOREIGN KEY (`fk_id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;