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
- `casos/2_lacteos.js`: comercializadora de 10 productos, reproduciendo el Excel tal cual.
- `casos/3_lacteos_criterios_maestra.js`: Lácteos con los criterios de la maestra
  (pagos iguales a capital, pérdidas acumuladas, VPN con saldos acumulados).

Para agregar un caso nuevo, copia uno de los archivos de `casos/` y cambia los datos.

## Criterios de la maestra (22 de octubre de 2026)
- La app debe coincidir con el Excel **y** el balance debe cuadrar.
- VPN y TIR con los **saldos acumulados** de efectivo; en el año 0 se resta **lo invertido en activos**.
- ke lo captura cada usuario.
- El inventario final de MP **no se suma** a las compras.
- La carga social va sobre todos los sueldos **excepto honorarios**.
- PTU solo cuando hay utilidad (también en la t del WACC).
- Las pérdidas se acumulan y se restan de la utilidad de los años siguientes (ISR).

## Única diferencia con el Excel de SALCERA
La celda del VPN usa un WACC de **6.27%** porque la fórmula tiene un paréntesis mal puesto:
`(E/V·ke + D/V·(1−t))·kd`. El WACC correcto, `E/V·ke + D/V·kd·(1−t)`, es **13.56%** (la celda de
abajo del mismo Excel) y es el que usa la app. Con 6.27% el VPN daría 68,275,400; con 13.56% da 53,257,924.
