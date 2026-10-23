// Empresa mixta: SALCERA fabrica su salsa y además revende un producto.
// Las ventas deben sumarse y la producción debe ser solo la del producto propio.
const salcera = require('./1_salcera.js');
module.exports = {
    nombre: 'Mixta (SALCERA + reventa)',
    capturar(app) {
        salcera.capturar(app);
        app.set('tipo-empresa', 'mixta');
        app.filas('productos-container', 'agregarProducto', [{ nombre: 'Totopos', unidades: 1000, precio: 20, costo: 12 }]);
    },
    esperados: (G) => {
        // Unidades de reventa crecen con "Incremento anual en unidades" (vacío = 0%), precio con 5.198% redondeado hacia arriba
        const precios = [20]; for (let a = 1; a < 5; a++) precios[a] = Math.ceil(precios[a - 1] * 1.05198 - 1e-7);
        const ventasSalcera = [12796080, 16892224, 22212574, 29107512, 38025042];
        return {
            'Ventas totales = SALCERA + reventa': { valor: G.ventasProyeccion, esperado: ventasSalcera.map((v, a) => v + 1000 * precios[a]) },
            'Producción = solo lo propio (igual que SALCERA)': { valor: G.unidadesProduccion, esperado: [429818, 528661, 654276, 809736, 1002137] },
            'Costo de la mercancía de reventa': { valor: G.costoMercancia, esperado: [0, 1, 2, 3, 4].map(a => 1000 * 12 * Math.pow(1.05198, a)) },
        };
    },
};
