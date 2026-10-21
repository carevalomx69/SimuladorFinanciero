<?php
// ==============================================================================
// SERVIDOR DE WEBSOCKETS (BACKEND EN TIEMPO REAL)
// Este script se ejecuta en la terminal y se queda "escuchando" permanentemente.
// Utiliza la librería Ratchet para manejar conexiones persistentes.
// ==============================================================================

// 1. CARGA DE DEPENDENCIAS
// Carga automática de las librerías instaladas vía Composer (Ratchet, ReactPHP, etc.)
require dirname(__DIR__) . '/vendor/autoload.php';

// Importamos las clases necesarias de la librería Ratchet
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

// Definimos la clase que manejará los eventos del Socket
class TipoCambioSocket implements MessageComponentInterface {
    protected $clients; // Aquí guardaremos la lista de usuarios conectados

    public function __construct() {
        // Inicializamos el almacenamiento de clientes (SplObjectStorage es muy eficiente para esto)
        $this->clients = new \SplObjectStorage;
    }

    // EVENTO 1: CUANDO ALGUIEN SE CONECTA
    public function onOpen(ConnectionInterface $conn) {
        // Guardamos la conexión del nuevo usuario en la lista
        $this->clients->attach($conn);
        echo "Nuevo cliente conectado ({$conn->resourceId})\n"; // Mensaje en la terminal negra
    }

    // EVENTO 2: CUANDO LLEGA UN MENSAJE (El corazón del sistema)
    public function onMessage(ConnectionInterface $from, $msg) {
        echo "Mensaje recibido: $msg\n";
        
        // 1. Decodificamos el mensaje JSON que envió el navegador (Javascript)
        // El mensaje trae qué moneda quiere el usuario (USD, EUR, etc.)
        $dataCliente = json_decode($msg, true);
        $precio = 0;

        // Verificamos que sea una petición válida
        if (isset($dataCliente['accion']) && $dataCliente['accion'] === 'pedir_tipo_cambio') {
            
            // Obtenemos la moneda base. Si no viene, usamos 'USD' por defecto.
            $monedaBase = $dataCliente['moneda'] ?? 'USD'; 
            
            // --- A. CONSUMO DE API EXTERNA (REST) ---
            // Nos conectamos a una API pública para obtener el precio real de la divisa.
            $apiUrl = "https://open.er-api.com/v6/latest/$monedaBase";
            
            // file_get_contents hace una petición HTTP GET al servidor de la API
            $json = @file_get_contents($apiUrl);

            if ($json !== false) {
                $datos = json_decode($json, true);
                
                // Lógica de negocio:
                // Si piden MXN, vale 1. Si piden otra, buscamos su valor en pesos en el JSON de la API.
                if ($monedaBase === 'MXN') {
                    $precio = 1.0;
                } elseif (isset($datos['rates']['MXN'])) {
                    $precio = $datos['rates']['MXN'];
                }
            }
            
            // --- B. FALLBACK (PLAN B) ---
            // Si se va el internet o la API falla, usamos una simulación para que el sistema no truene.
            if ($precio == 0) {
                $precio = rand(1800, 2200) / 100; // Genera un número entre 18.00 y 22.00
            }
            
            // Configurar zona horaria para que la hora coincida con México
            date_default_timezone_set('America/Mexico_City');
            
            // (Se quitó la inflación aleatoria: la inflación la captura el usuario
            //  en la pestaña 8 para que los resultados sean reproducibles.)

            // 2. PREPARACIÓN DE LA RESPUESTA (JSON)
            // Empaquetamos todos los datos calculados para enviarlos de regreso.
            $respuesta = json_encode([
                'tipo' => 'tipo_cambio_actualizado',
                'valor' => $precio,                 // El precio del dólar/euro
                'moneda_base' => $monedaBase,       // Qué moneda es
                'fecha' => date('H:i:s')            // La hora exacta del servidor
            ]);
            
            // 3. BROADCAST (DIFUSIÓN) - PATRÓN OBSERVER
            // Recorremos la lista de TODOS los clientes conectados y les enviamos el dato.
            // Esto actualiza a todos los usuarios al mismo tiempo.
            foreach ($this->clients as $client) {
                $client->send($respuesta);
            }
        }
    }

    // EVENTO 3: CUANDO ALGUIEN SE DESCONECTA (Cierra la pestaña)
    public function onClose(ConnectionInterface $conn) {
        // Lo borramos de la lista para no intentar enviarle mensajes después
        $this->clients->detach($conn);
        echo "Cliente desconectado ({$conn->resourceId})\n";
    }

    // EVENTO 4: MANEJO DE ERRORES
    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "Error: {$e->getMessage()}\n";
        $conn->close();
    }
}

// ==============================================================================
// INICIO DEL SERVIDOR (EVENT LOOP)
// ==============================================================================

// Configuramos el servidor para escuchar en el puerto 8081
$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new TipoCambioSocket() // Instanciamos nuestra lógica definida arriba
        )
    ),
    8081,       // Puerto del Socket (diferente al 80 de la web)
    '0.0.0.0'   // Escuchar en todas las interfaces de red (necesario para Docker)
);

echo "✅ Servidor WebSocket iniciado en ws://0.0.0.0:8081\n";

// EJECUTAR EL BUCLE INFINITO
// Esto mantiene el script vivo esperando conexiones. Si esto se detiene, el socket muere.
$server->run();