// Caso SALCERA (salsa macha) — PROYECTO_EMPRESA_SALCERA_2023_FINAL_011123.xlsx
// Diferencias conocidas por criterio (NO se comparan aquí, ver pruebas/README.md):
//   - Gastos de operación: en el Excel el contador no lleva carga social.
//   - Costo de lo vendido / utilidad: el Excel valúa un inventario final de MP que nunca se compró.
//   - VPN y TIR: el Excel los calcula con saldos acumulados de efectivo.
module.exports = {
    nombre: 'SALCERA',
    capturar({ set, check, filas, recalcular, d }) {
        set('poblacion-total', 166787);            // mujeres ocupadas 20-54 años (hoja Plan)
        set('concentracion-mercado', 72956 / 205402 * 100); // nivel D+ y C
        set('incremento-poblacion', 19); set('penetracion-inicial', 15); set('incremento-penetracion', 4); set('usos-mensuales', 4);
        set('precio-unitario-base', 30); set('incremento-precio', 5.198); check('redondear-precio', true);
        set('inv-inicial-prod', 0); set('dias-inventario', 2); set('dias-laborables', 260);
        filas('receta-container', 'agregarMateriaPrima', [
            ['Agua', 0.0625, 'ml'], ['Cacahuate', 0.07, 'gr'], ['Chile morita', 0.015, 'gr'], ['Ajo', 0.002, 'gr'],
            ['Tomate', 0.07, 'gr'], ['Cebolla', 0.02, 'gr'], ['Botellas', 1, 'pza'], ['Otros', 1, 'pza']
        ].map(([n, c, u]) => ({ nombre_mp: n, cantidad_por_unidad_prod: c, unidad_medida: u })));
        recalcular();
        // "Otros" = 20% del costo de los ingredientes por unidad
        const otros = 0.2 * (0.0625 * 1.75 + 0.07 * 49 + 0.015 * 165 + 0.002 * 60 + 0.07 * 14 + 0.02 * 12.5);
        const costos = { Agua: 1.75, Cacahuate: 49, 'Chile morita': 165, Ajo: 60, Tomate: 14, Cebolla: 12.5, Botellas: 1.7, Otros: otros };
        d.querySelectorAll('.costo-mp').forEach(i => { i.value = costos[i.dataset.nombre]; });
        set('inv-inicial-mp', 0); set('inv-final-mp-pct', 0); set('inflacion-mp', 5.198);
        set('tiempo-unidad', 4); set('tiempo-unidad-tipo', 'min'); set('costo-hora', 242.34 / 8); set('horas-jornada', 8);
        set('incremento-salarial', (0.1999768612251981 + 0.21997177134791826) / 2 * 100); // promedio 2022-2023 (hoja Fact.sensibil)
        filas('gastos-fijos-container', 'agregarGastoFijo', [['Renta', 30000], ['Mantenimiento', 2400], ['Energía eléctrica', 42000]]
            .map(([c, m]) => ({ concepto: c, monto_anual: m })));
        set('inflacion-anual', 5.198);
        filas('inversiones-container', 'agregarInversion', [
            ['Camioneta', 412900, 4], ['Licuadoras', 31530, 10], ['Estufa', 11361, 10], ['Refrigerador', 41114, 10],
            ['Eq. de cómputo', 16799.3, 1 / 0.3], ['Utensilios', 10000, 10], ['Mobiliario', 23228.1, 10]
        ].map(([n, m, v]) => ({ nombre_activo: n, monto: m, vida_util_anios: v, metodo_depreciacion: 'lineal' })));
        filas('gastos-admin-container', 'agregarGastoAdmin', [
            ['Contador', 4000, 'salario'], ['Chofer', 4800, 'salario'], ['Gerente', 12000, 'salario'], ['Agua', 500, 'inflacion'],
            ['Teléfono e internet', 750, 'inflacion'], ['Papelería', 300, 'inflacion'], ['Combustibles', 4000, 'inflacion'], ['Licencias', 250, 'inflacion']
        ].map(([c, m, t]) => ({ concepto: c, monto_mensual: m, tipo: t })));
        filas('gastos-ventas-container', 'agregarGastoVentas', [['Comisiones', 1], ['Publicidad', 2]]
            .map(([c, p]) => ({ concepto: c, porcentaje_sobre_ventas: p })));
        set('pct-carga-social', 32);
        set('dias-credito-ventas', 1.5); set('dias-credito-compras', 6);
        set('tasa-isr', 30); set('tasa-ptu', 10);
        set('inversion-inicial', 1181483.5997166669); set('pct-financiamiento', 40); set('tasa-interes', 19); set('plazo-credito', 5);
        set('tasa-ke', 15);
    },
    esperados: (G) => ({
        'Mercado potencial año 1': { valor: G.mercadoPotencial[0], esperado: 59241 },
        'Unidades a vender': { valor: G.unidadesVenta, esperado: [426536, 527882, 653311, 808542, 1000659] },
        'Precio': { valor: G.precioUnitario, esperado: [30, 32, 34, 36, 38] },
        'Ventas': { valor: G.ventasProyeccion, esperado: [12796080, 16892224, 22212574, 29107512, 38025042] },
        'Producción requerida': { valor: G.unidadesProduccion, esperado: [429818, 528661, 654276, 809736, 1002137] },
        'Compras de MP (incluye botella y 20% de otros)': { valor: G.comprasMP, esperado: [4529099.72, 5860194.63, 7629625.84, 9933291.53, 12932554.40] },
        'Mano de obra directa': { valor: G.costoMO, esperado: [882117.60, 1296055.28, 1937180.33, 2902019.02, 4456736.92] },
        'Gastos indirectos de fabricación': { valor: G.gastosIndirectos, esperado: [74400, 78267.31, 82335.65, 86615.45, 91117.73] },
        'Depreciación': { valor: G.depreciacion, esperado: [119988.10, 119988.10, 119988.10, 116628.24, 11723.31] },
        'Crédito bancario (40%)': { valor: G.credito, esperado: 472593.44 },
        'Intereses (gastos financieros)': { valor: G.intereses, esperado: [84528.13, 71545.04, 55868.60, 36940.06, 14084.78] },
        'Amortización del crédito': { valor: G.amortizacion, esperado: [62583.88, 75566.97, 91243.41, 110171.95, 133027.23] },
        'Cuentas por cobrar': { valor: G.cuentasPorCobrar, esperado: [53317, 70384.27, 92552.39, 121281.30, 158437.68] },
        'Proveedores': { valor: G.cuentasPorPagar, esperado: [75485.00, 97669.91, 127160.43, 165554.86, 215542.57] },
        'Saldo de efectivo año 0': { valor: G.saldoEfectivo0, esperado: 634551.20 },
        'WACC': { valor: G.wacc, esperado: 0.1356, tol: 0.00001 },
    }),
};
