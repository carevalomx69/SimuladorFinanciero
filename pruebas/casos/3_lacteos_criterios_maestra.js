// Lácteos con los criterios de la maestra (22-oct-2026) en lugar de los del Excel:
// pagos iguales a capital, pérdidas de años anteriores restadas para el ISR,
// VPN y TIR con saldos acumulados y la inversión en activos.
const base = require('./2_lacteos.js');
module.exports = {
    nombre: 'Lácteos con criterios de la maestra',
    capturar(app) {
        base.capturar(app);
        app.set('tipo-credito', 'capital');
        app.d.getElementById('amortizar-perdidas').checked = true;
        app.set('metodo-vpn', 'saldos');
        app.set('inversion-vpn', 'activos');
    },
    esperados: (G) => {
        // Pérdidas acumuladas: el ISR de cada año se calcula sobre la utilidad menos las pérdidas pendientes
        let pendiente = 0;
        const isrEsperado = G.utilidadAntesImpuestos.map(u => {
            if (u < 0) { pendiente -= u; return 0; }
            const aplicada = Math.min(pendiente, u); pendiente -= aplicada;
            return (u - aplicada) * 0.30;
        });
        return {
            'Pago a capital (1,072,210.40 / 5 cada año)': { valor: G.amortizacion, esperado: Array(5).fill(214442.08) },
            'Intereses año 1 (1.5% mensual sobre saldo)': { valor: G.intereses[0], esperado: 175306.40 },
            'Saldo del crédito': { valor: G.saldoDeuda, esperado: [857768.32, 643326.24, 428884.16, 214442.08, 0] },
            'ISR con pérdidas acumuladas': { valor: G.isr, esperado: isrEsperado },
            'PTU solo en años con utilidad': { valor: G.ptu, esperado: G.utilidadAntesImpuestos.map(u => Math.max(0, u) * 0.10) },
            'Inversión del año 0 = activos (1,197,030 + 60,000)': { valor: G.inversionVPN, esperado: 1257030 },
        };
    },
};
