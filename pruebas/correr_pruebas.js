// =============================================================================
// PRUEBA AUTOMÁTICA DEL SIMULADOR
// Carga index.html + js/app.js en un navegador simulado (jsdom), captura los
// datos de cada caso y compara los resultados contra los valores del Excel.
//
// Uso (desde la carpeta pruebas/):
//   npm install
//   npm test
// =============================================================================
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const TOLERANCIA = 0.01; // un centavo

function crearApp() {
    const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
    const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/' });
    const w = dom.window;
    w.fetch = () => new Promise(() => {});           // sin servidor
    w.WebSocket = function () { return { send() {}, close() {} }; };
    w.Chart = function () { return { destroy() {} }; };
    w.console.log = () => {};
    w.eval(fs.readFileSync(path.join(RAIZ, 'js', 'app.js'), 'utf8') + '\nwindow.__G = () => globalData;');
    w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
    const d = w.document;
    const api = {
        w, d,
        set: (id, v) => { d.getElementById(id).value = v; },
        check: (id, v) => { d.getElementById(id).checked = v; },
        filas: (cont, fn, datos) => { d.getElementById(cont).innerHTML = ''; datos.forEach(x => w[fn](x)); },
        G: () => w.__G(),
        recalcular: () => w.recalcularTodo(),
    };
    return api;
}

let fallas = 0, aciertos = 0;
function comparar(caso, nombre, obtenido, esperado, tol = TOLERANCIA) {
    const ok = esperado.every((e, i) => Math.abs((obtenido[i] ?? NaN) - e) <= tol);
    if (ok) { aciertos++; console.log(`  ✔ ${nombre}`); }
    else {
        fallas++;
        console.log(`  ✖ ${nombre}`);
        console.log(`      esperado: ${esperado.join(' | ')}`);
        console.log(`      obtenido: ${obtenido.map(v => Math.round(v * 100) / 100).join(' | ')}`);
    }
}

for (const archivo of fs.readdirSync(path.join(__dirname, 'casos')).filter(f => f.endsWith('.js')).sort()) {
    const caso = require(path.join(__dirname, 'casos', archivo));
    console.log(`\n=== ${caso.nombre} ===`);
    const app = crearApp();
    caso.capturar(app);
    app.recalcular();
    const G = app.G();
    for (const [nombre, { valor, esperado, tol }] of Object.entries(caso.esperados(G))) {
        comparar(caso.nombre, nombre, Array.isArray(valor) ? valor : [valor], Array.isArray(esperado) ? esperado : [esperado], tol);
    }
    const dif = G.activoTotal.map((x, a) => x - G.pasivoMasCapital[a]);
    comparar(caso.nombre, 'Balance cuadra (Activo − Pasivo − Capital = 0)', dif, [0, 0, 0, 0, 0], 0.01);
}

console.log(`\nResultado: ${aciertos} comparaciones correctas, ${fallas} con diferencias.`);
process.exit(fallas ? 1 : 0);
