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
// API: ¿HAY SESIÓN ACTIVA?
// El frontend llama esto al cargar la página para decidir si muestra el login
// o la calculadora directamente.
// ==============================================================================

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 86400,
        'path'     => '/',
        'domain'   => '',
        'secure'   => true,
        'httponly' => true,
        'samesite' => 'None'
    ]);
    session_start();
}
header('Content-Type: application/json; charset=utf-8');

if (isset($_SESSION['id_usuario'])) {
    echo json_encode([
        'status'    => 'success',
        'logueado'  => true,
        'usuario'   => [
            'id_usuario' => $_SESSION['id_usuario'],
            'nombre'     => $_SESSION['nombre'],
            'email'      => $_SESSION['email'],
        ],
    ]);
} else {
    echo json_encode(['status' => 'success', 'logueado' => false]);
}