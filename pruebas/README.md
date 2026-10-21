# Prueba automática del simulador

Corre la app (index.html + js/app.js) en un navegador simulado, captura los datos de los
ejercicios del profesor y compara los resultados contra los valores de los Excel.

## Cómo correrla
Necesita Node.js 18 o más reciente.

```
cd pruebas
npm install
npm test
```

Cada línea con ✔ coincide con el Excel (tolerancia de un centavo). Si algo no coincide,
se muestra lo esperado contra lo obtenido y el comando termina con error.

## Casos
- `casos/1_salcera.js`: salsa macha (fabricación con receta, MOD, inventarios y crédito al 40%).
- `casos/2_lacteos.js`: comercializadora de 10 productos (crédito al 80%, VPN con flujo neto).

Para agregar un caso nuevo, copia uno de los archivos de `casos/` y cambia los datos.

## Diferencias conocidas con el Excel de SALCERA (criterio, no error)
- **Gastos de operación:** en el Excel el contador no lleva carga social; en la app sí (se capturó como sueldo).
- **Costo de lo vendido:** el Excel valúa un inventario final de MP que nunca se compró; la app lo hace
  consistente con lo comprado y por eso el balance cuadra.
- **VPN y TIR:** el Excel los calcula con los saldos acumulados de efectivo y la inversión en activo fijo.
