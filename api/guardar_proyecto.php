<?php
// Permitir el origen exacto de tu app en Vercel
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, ngrok-skip-browser-warning");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==============================================================================
// API: GUARDAR / ACTUALIZAR PROYECTO
// Requiere sesión activa. Si el proyecto ya existe, valida que sea del usuario
// antes de dejarlo modificarlo.
// ==============================================================================

require_once 'auth_guard.php'; // session_start() + header JSON + exige login
require_once 'conexion.php';

$id_usuario = $_SESSION['id_usuario'];

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['status' => 'error', 'message' => 'No llegaron datos JSON']);
    exit;
}

$id_proyecto = isset($input['id_proyecto']) && !empty($input['id_proyecto']) ? (int) $input['id_proyecto'] : null;

// Columnas de la tabla PROYECTOS (deben coincidir con schema.sql)
$campos = [
    'nombre_proyecto', 'poblacion_total', 'pct_mujeres', 'pct_rango_edad',
    'pct_poblacion_ocupada', 'pct_concentracion_mercado', 'participacion_mercado',
    'incremento_poblacion', 'incremento_producto', 'penetracion_inicial',
    'incremento_penetracion', 'precio_unitario_base', 'incremento_precio',
    'unidades_venta_a1', 'unidades_venta_a2', 'unidades_venta_a3',
    'unidades_venta_a4', 'unidades_venta_a5', 'dias_credito_ventas',
    'dias_credito_compras', 'descuento_pronto_pago', 'inv_inicial_prod',
    'inv_final_a1', 'inv_final_a2', 'inv_final_a3', 'inv_final_a4', 'inv_final_a5',
    'inv_inicial_mp', 'inv_final_mp_pct', 'tiempo_unidad_mo', 'costo_hora_mo',
    'inversion_inicial', 'saldo_inicial', 'pct_cobro_efectivo', 'inflacion_anual',
];

$valores = [];
$params  = [];
foreach ($campos as $col) {
    // Importante: MySQL en modo estricto rechaza '' en columnas numéricas.
    // Si el campo llegó vacío (usuario no lo llenó), lo mandamos como NULL.
    $valor = $input[$col] ?? null;
    if ($valor === '') {
        $valor = null;
    }
    $valores[$col]  = $valor;
    $params[":$col"] = $valor;
}

try {
    $pdo->beginTransaction();

    if ($id_proyecto === null) {
        // --- INSERTAR NUEVO ---
        $cols  = implode(', ', array_keys($valores));
        $binds = implode(', ', array_keys($params));

        $sql = "INSERT INTO proyectos ($cols, fk_id_usuario) VALUES ($binds, :fk_id_usuario)";
        $stmt = $pdo->prepare($sql);
        $params[':fk_id_usuario'] = $id_usuario;
        $stmt->execute($params);

        $id_proyecto = (int) $pdo->lastInsertId();

    } else {
        // --- VALIDAR QUE EL PROYECTO SEA DEL USUARIO ANTES DE TOCARLO ---
        $stmt = $pdo->prepare("SELECT fk_id_usuario FROM proyectos WHERE id_proyecto = :id");
        $stmt->execute([':id' => $id_proyecto]);
        $dueno = $stmt->fetchColumn();

        if ($dueno === false) {
            $pdo->rollBack();
            echo json_encode(['status' => 'error', 'message' => 'El proyecto no existe']);
            exit;
        }
        if ((int) $dueno !== (int) $id_usuario) {
            $pdo->rollBack();
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No tienes permiso sobre este proyecto']);
            exit;
        }

        // --- ACTUALIZAR ---
        $set_parts = [];
        foreach (array_keys($valores) as $col) {
            $set_parts[] = "$col = :$col";
        }
        $set_sql = implode(', ', $set_parts);

        $sql = "UPDATE proyectos SET $set_sql WHERE id_proyecto = :id_proy AND fk_id_usuario = :fk_id_usuario";
        $stmt = $pdo->prepare($sql);
        $params[':id_proy']        = $id_proyecto;
        $params[':fk_id_usuario']  = $id_usuario;
        $stmt->execute($params);

        // Borrar hijos viejos para re-insertarlos (misma estrategia que la versión original)
        $tablas_hijas = ['inversiones', 'materias_primas', 'gastos_administrativos', 'gastos_ventas', 'gastos_indirectos_fijos', 'gastos_indirectos_variables'];
        foreach ($tablas_hijas as $tabla) {
            $stmt_del = $pdo->prepare("DELETE FROM $tabla WHERE fk_id_proyecto = :id");
            $stmt_del->execute([':id' => $id_proyecto]);
        }
    }

    // --- INSERTAR DETALLES (Tablas Hijas) ---

    if (!empty($input['inversiones'])) {
        $stmt = $pdo->prepare("INSERT INTO inversiones (fk_id_proyecto, nombre_activo, monto, vida_util_anios, metodo_depreciacion) VALUES (:id, :nom, :monto, :vida, :metodo)");
        foreach ($input['inversiones'] as $item) {
            $stmt->execute([
                ':id'     => $id_proyecto,
                ':nom'    => $item['nombre'] ?? null,
                ':monto'  => $item['monto'] ?? null,
                ':vida'   => $item['vida_util'] ?? null,
                ':metodo' => $item['tipo'] ?? null,
            ]);
        }
    }

    if (!empty($input['materias_primas'])) {
        $stmt = $pdo->prepare("INSERT INTO materias_primas (fk_id_proyecto, nombre_mp, cantidad_por_unidad_prod, unidad_medida, costo_unitario) VALUES (:id, :nom, :cant, :uni, :costo)");
        foreach ($input['materias_primas'] as $item) {
            $stmt->execute([
                ':id'    => $id_proyecto,
                ':nom'   => $item['nombre'] ?? null,
                ':cant'  => $item['cantidad'] ?? null,
                ':uni'   => $item['unidad'] ?? null,
                ':costo' => $item['costo_unitario'] ?? null,
            ]);
        }
    }

    if (!empty($input['gastos_admin'])) {
        $stmt = $pdo->prepare("INSERT INTO gastos_administrativos (fk_id_proyecto, concepto, monto_mensual) VALUES (:id, :con, :monto)");
        foreach ($input['gastos_admin'] as $item) {
            $stmt->execute([
                ':id'    => $id_proyecto,
                ':con'   => $item['concepto'] ?? null,
                ':monto' => $item['monto_mensual'] ?? null,
            ]);
        }
    }

    if (!empty($input['gastos_ventas'])) {
        $stmt = $pdo->prepare("INSERT INTO gastos_ventas (fk_id_proyecto, concepto, porcentaje_sobre_ventas) VALUES (:id, :con, :pct)");
        foreach ($input['gastos_ventas'] as $item) {
            $stmt->execute([
                ':id'  => $id_proyecto,
                ':con' => $item['concepto'] ?? null,
                ':pct' => $item['porcentaje_sobre_ventas'] ?? null,
            ]);
        }
    }

    if (!empty($input['gastos_fijos'])) {
        $stmt = $pdo->prepare("INSERT INTO gastos_indirectos_fijos (fk_id_proyecto, concepto, monto_anual) VALUES (:id, :con, :monto)");
        foreach ($input['gastos_fijos'] as $item) {
            $stmt->execute([
                ':id'    => $id_proyecto,
                ':con'   => $item['concepto'] ?? null,
                ':monto' => $item['monto_anual'] ?? null,
            ]);
        }
    }

    if (!empty($input['gastos_variables'])) {
        $stmt = $pdo->prepare("INSERT INTO gastos_indirectos_variables (fk_id_proyecto, concepto, por_unidad, unidad) VALUES (:id, :con, :por, :uni)");
        foreach ($input['gastos_variables'] as $item) {
            $stmt->execute([
                ':id'  => $id_proyecto,
                ':con' => $item['concepto'] ?? null,
                ':por' => $item['por_unidad'] ?? null,
                ':uni' => $item['unidad'] ?? null,
            ]);
        }
    }

    $pdo->commit();

    echo json_encode([
        'status'      => 'success',
        'message'     => 'Proyecto guardado correctamente',
        'id_proyecto' => $id_proyecto,
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}