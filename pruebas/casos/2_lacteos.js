// Caso Lácteos (comercializadora de 10 productos) — EJERCICIO_2_LACTEOS.xlsx
// Se usa ke = 15.49% y pagos iguales (PMT), que es lo que calculan las fórmulas del Excel
// (las instrucciones dicen 30% y pagos iguales a capital).
module.exports = {
    nombre: 'Lácteos',
    capturar({ set, filas }) {
        set('incremento-producto', 5); set('incremento-precio', 13); set('inflacion-mp', 18);
        filas('productos-container', 'agregarProducto', [
            ['Queso Panela 1/2kg', 3260, 45, 18], ['Queso Panela 1kg', 2350, 90, 38], ['Queso Fresco 100grs', 2480, 15, 6],
            ['Queso Fresco 200grs', 3440, 25, 14], ['Queso asadero 1/2kg', 5520, 50, 28], ['Queso asadero 1kg', 4720, 100, 45],
            ['Leche bronca', 3960, 15, 5], ['Nata 1/2 lt', 320, 50, 20], ['Nata 1/4 lt', 3060, 25, 8], ['Huevo', 7200, 30, 20]
        ].map(([nombre, unidades, precio, costo]) => ({ nombre, unidades, precio, costo })));
        set('inflacion-anual', 18);
        filas('gastos-admin-container', 'agregarGastoAdmin', [
            ['Renta', 5000], ['Teléfono e internet', 500], ['Papelería', 200], ['Publicidad', 1000], ['Nómina', 36700],
            ['Luz', 2500], ['Agua', 300], ['Gasolina', 1000], ['Mantenimiento de equipo', 100], ['Mantenimiento de unidad', 300]
        ].map(([c, m]) => ({ concepto: c, monto_mensual: m, tipo: 'inflacion' })));
        filas('inversiones-container', 'agregarInversion', [
            ['Mobiliario', 240420, 10], ['Maquinaria y Equipo', 532400, 10], ['Equipo de Cómputo', 18500, 3], ['Herramientas', 5710, 10],
            ['Equipo de Transporte', 300000, 5], ['Software', 50000, 5], ['Habilitación', 50000, 5]
        ].map(([n, m, v]) => ({ nombre_activo: n, monto: m, vida_util_anios: v, metodo_depreciacion: 'lineal' })));
        set('tasa-isr', 30); set('tasa-ptu', 10);
        set('inversion-inicial', 1340263); set('inv-capital-trabajo', 60000);
        set('pct-financiamiento', 80); set('tasa-interes', 18); set('plazo-credito', 5);
        set('tasa-ke', 15.49); set('metodo-vpn', 'flujo-neto');
    },
    esperados: (G) => ({
        'Ventas': { valor: G.ventasProyeccion, esperado: [1597300, 1895247.30, 2248920.97, 2668652.43, 3166811.83] },
        'Costo de ventas': { valor: G.costoVendido, esperado: [772660, 957348.16, 1186252.40, 1469925.43, 1821477.83] },
        'Gastos (admin + venta + operación)': { valor: G.gastosOperacion, esperado: [571200, 674016, 795338.88, 938499.88, 1107429.86] },
        'Depreciación + amortización': { valor: G.depreciacion, esperado: [164019.67, 164019.67, 164019.67, 157853, 157853] },
        'Intereses': { valor: G.intereses, esperado: [181394.67, 152965.39, 118974.82, 78335.08, 29745.46] },
        'Pago a capital': { valor: G.amortizacion, esperado: [145330.49, 173759.78, 207750.34, 248390.09, 296979.70] },
        'Utilidad antes de impuestos': { valor: G.utilidadAntesImpuestos, esperado: [-91974.34, -53101.92, -15664.79, 24039.04, 50305.68] },
        'Utilidad neta': { valor: G.utilidadNeta, esperado: [-91974.34, -53101.92, -15664.79, 14423.42, 30183.41] },
        'Flujo neto': { valor: G.flujoNeto, esperado: [-73285.16, -62842.02, -59395.47, -76113.66, -108943.29] },
        'Saldo final de efectivo': { valor: G.saldoEfectivo, esperado: [9947.84, -52894.19, -112289.65, -188403.32, -297346.61] },
        'Total activo': { valor: G.activoTotal, esperado: [1102958.17, 876096.48, 652681.35, 418714.68, 151918.39] },
        'Saldo del crédito': { valor: G.saldoDeuda, esperado: [926879.91, 753120.13, 545369.79, 296979.70, 0] },
        'WACC': { valor: G.wacc, esperado: 0.11738, tol: 0.00001 },
        'VPN': { valor: G.vpn, esperado: -1610129.08 },
        'Beneficio / costo': { valor: G.beneficioCosto, esperado: -0.2014, tol: 0.0001 },
    }),
};
