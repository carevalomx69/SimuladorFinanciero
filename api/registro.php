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
// API: REGISTRO DE USUARIO NUEVO
// Recibe { nombre, email, password } por JSON, crea la cuenta e inicia sesión.
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
require_once 'conexion.php';

$input = json_decode(file_get_contents('php://input'), true);

$nombre   = trim($input['nombre'] ?? '');
$email    = trim(strtolower($input['email'] ?? ''));
$password = $input['password'] ?? '';

// --- Validaciones básicas ---
if ($nombre === '' || $email === '' || $password === '') {
    echo json_encode(['status' => 'error', 'message' => 'Faltan datos (nombre, email o contraseña)']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'El correo no es válido']);
    exit;
}
if (strlen($password) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'La contraseña debe tener al menos 6 caracteres']);
    exit;
}

try {
    // ¿Ya existe ese correo?
    $stmt = $pdo->prepare("SELECT id_usuario FROM usuarios WHERE email = :email");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        echo json_encode(['status' => 'error', 'message' => 'Ese correo ya está registrado']);
        exit;
    }

    // Guardamos el hash, nunca la contraseña en texto plano
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO usuarios (nombre, email, password_hash) VALUES (:nombre, :email, :hash)");
    $stmt->execute([':nombre' => $nombre, ':email' => $email, ':hash' => $hash]);

    $id_usuario = (int) $pdo->lastInsertId();

    // Iniciamos sesión automáticamente tras registrarse
    session_regenerate_id(true);
    $_SESSION['id_usuario'] = $id_usuario;
    $_SESSION['nombre']     = $nombre;
    $_SESSION['email']      = $email;

    echo json_encode([
        'status'  => 'success',
        'message' => 'Cuenta creada correctamente',
        'usuario' => ['id_usuario' => $id_usuario, 'nombre' => $nombre, 'email' => $email],
    ]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error al registrar: ' . $e->getMessage()]);
}