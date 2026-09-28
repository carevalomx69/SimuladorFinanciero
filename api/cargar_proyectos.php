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
// API: CARGAR LISTA DE PROYECTOS DEL USUARIO
// Solo devuelve los proyectos que pertenecen al usuario en sesión.
// ==============================================================================

require_once 'auth_guard.php';
require_once 'conexion.php';

try {
    $stmt = $pdo->prepare(
        "SELECT id_proyecto, nombre_proyecto, fecha_creacion
         FROM proyectos
         WHERE fk_id_usuario = :id
         ORDER BY id_proyecto DESC"
    );
    $stmt->execute([':id' => $_SESSION['id_usuario']]);
    $proyectos = $stmt->fetchAll();

    echo json_encode($proyectos);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error al cargar proyectos: ' . $e->getMessage()]);
}