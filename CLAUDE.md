# Notas para quien trabaje en este repositorio (personas y asistentes de IA)

Este proyecto se publica en Oracle Cloud detrás de un Nginx, bajo la sub-ruta
`/simulador/` (http://140.84.191.7/simulador/). Reglas que no deben romperse:

## 1. Rutas de red del frontend (`js/app.js`)
- Las llamadas a la API van **sin barra inicial**: `fetch('api/login.php')`.
  Nunca `fetch('/api/login.php')`: apunta a la raíz del servidor y devuelve 404.
- El WebSocket se conecta a `location.hostname + '/simulador-ws/'` (puerto 80, vía Nginx).
  No usar `:8083`: Oracle Cloud bloquea puertos no estándar y falla desde varias redes.
- Probar siempre abriendo la app bajo `/simulador/`, no solo en localhost.

## 2. Despliegue
- No editar archivos a mano en el servidor. Todo cambio pasa por rama, pull request y merge.
- Orden de despliegue: respaldo de la base, migración (si hay), `git pull`, `docker compose restart web`, prueba.
- Los cambios de esquema van como script en `migraciones/`. `Bd/` solo corre al crear la base desde cero.
- Nunca ejecutar `docker compose down -v` en el servidor (borra la base).
- No subir respaldos `.sql`, llaves SSH, contraseñas ni archivos `.env` al repositorio.

## 3. Cálculos financieros
- Todo se recalcula con `recalcularTodo()`. Cualquier cambio de fórmulas debe pasar `npm test` en `pruebas/`
  (comparaciones contra los Excel SALCERA y Lácteos, tolerancia de un centavo).
