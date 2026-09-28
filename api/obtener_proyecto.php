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
// API: OBTENER UN PROYECTO COMPLETO
// Este archivo NO existía en el proyecto original, aunque js/app.js ya lo
// llamaba (api/obtener_proyecto.php?id=...). Lo agregamos aquí.
// Devuelve el proyecto + todas sus tablas hijas, solo si es del usuario.
// ==============================================================================

require_once 'auth_guard.php';
require_once 'conexion.php';

$id_proyecto = $_GET['id'] ?? null;

if (!$id_proyecto) {
    echo json_encode(['status' => 'error', 'message' => 'Falta el ID del proyecto']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM proyectos WHERE id_proyecto = :id AND fk_id_usuario = :uid");
    $stmt->execute([':id' => $id_proyecto, ':uid' => $_SESSION['id_usuario']]);
    $proyecto = $stmt->fetch();

    if (!$proyecto) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Proyecto no encontrado o no tienes permiso']);
        exit;
    }

    // Mapeo: clave que espera el frontend => tabla real en la BD
    $tablas_hijas = [
        'inversiones'      => 'inversiones',
        'materias_primas'  => 'materias_primas',
        'gastos_admin'     => 'gastos_administrativos',
        'gastos_ventas'    => 'gastos_ventas',
        'gastos_fijos'     => 'gastos_indirectos_fijos',
        'gastos_variables' => 'gastos_indirectos_variables',
    ];

    $detalle = [];
    foreach ($tablas_hijas as $clave => $tabla) {
        $stmt = $pdo->prepare("SELECT * FROM $tabla WHERE fk_id_proyecto = :id");
        $stmt->execute([':id' => $id_proyecto]);
        $detalle[$clave] = $stmt->fetchAll();
    }

    echo json_encode(array_merge($proyecto, $detalle));

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error al obtener el proyecto: ' . $e->getMessage()]);
}