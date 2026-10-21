// ====================================================================
// 1. VARIABLES GLOBALES
// ====================================================================
let globalData = {
    mercadoMeta: 0,
    porcentajeConcentracion: 0,
    penetracionMercado: [0, 0, 0, 0, 0],
    unidadesVenta: [0, 0, 0, 0, 0],
    precioUnitario: [0, 0, 0, 0, 0],
    incrementoUnidades: 0,
    ventasProyeccion: [0, 0, 0, 0, 0],
    unidadesProduccion: [0, 0, 0, 0, 0],
    materiaPrima: [],
    costoMP: [],
    consumoMP: [],
    comprasMP: [],
    costoMO: [0, 0, 0, 0, 0],
    gastosIndirectos: [0, 0, 0, 0, 0],
    costoProduccion: [0, 0, 0, 0, 0],
    costoVendido: [0, 0, 0, 0, 0],
    costoUnitarioProduccion: [0, 0, 0, 0, 0],
    gastosOperacion: [0, 0, 0, 0, 0],
    diasCredito: { ventas: 0, compras: 0 },
    descuentoProntoPago: 0,
    inversionesActivo: [],
    depreciacion: [0, 0, 0, 0, 0],
    amortizacion: [0, 0, 0, 0, 0],
    utilidadNeta: [0, 0, 0, 0, 0],
    activoCirculante: [0, 0, 0, 0, 0],
    pasivoCirculante: [0, 0, 0, 0, 0],
    capital: [0, 0, 0, 0, 0]
};

const API_URL = ''; // mismo servidor que sirve la página

// Variables para el Socket, Moneda y Conversión
let conn;
let monedaActual = 'MXN';
let culturaActual = 'es-MX';
let tasaActualVsMXN = 1; // Tasa actual vs MXN (Inicia en 1 porque la base es MXN)
let conversionPendiente = false; // Bandera para saber si debemos convertir inputs
let tasaDeCambioAlmacenada = 1; // Guardar la tasa anterior para calcular el factor

// Usuario actualmente autenticado (null si no ha iniciado sesión)
let usuarioActual = null;

// ====================================================================
// 1.5 AUTENTICACIÓN (Login / Registro / Sesión)
// ====================================================================

// Se llama al cargar la página. Decide si mostrar el login o la app.
function verificarSesion() {
    fetch('/api/sesion_actual.php', {
        credentials: 'include',
        headers: { 'ngrok-skip-browser-warning': 'true' }
    })
        .then(response => response.json())
        .then(data => {
            if (data.logueado) {
                usuarioActual = data.usuario;
                ocultarPantallaAuth();
                cargarListaDeProyectos();
            } else {
                mostrarPantallaAuth();
            }
        })
        .catch(error => {
            console.error('No se pudo verificar la sesión:', error);
            mostrarPantallaAuth();
        });
}

function mostrarPantallaAuth() {
    document.getElementById('auth-screen').style.display = 'flex';
}

function ocultarPantallaAuth() {
    document.getElementById('auth-screen').style.display = 'none';
    const nombreEl = document.getElementById('usuario-nombre');
    if (nombreEl && usuarioActual) {
        nombreEl.textContent = `👤 ${usuarioActual.nombre}`;
    }
}

// Alterna entre el formulario de login y el de registro
function mostrarFormulario(cual) {
    const login = document.getElementById('form-login');
    const registro = document.getElementById('form-registro');
    if (cual === 'registro') {
        login.classList.add('hidden');
        registro.classList.remove('hidden');
    } else {
        registro.classList.add('hidden');
        login.classList.remove('hidden');
    }
}

function enviarLogin(event) {
    event.preventDefault();
    const errorEl = document.getElementById('login-error');
    errorEl.classList.add('hidden');

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    fetch('/api/login.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ email, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                usuarioActual = data.usuario;
                document.getElementById('form-login').reset();
                ocultarPantallaAuth();
                cargarListaDeProyectos();
            } else {
                errorEl.textContent = data.message || 'No se pudo iniciar sesión';
                errorEl.classList.remove('hidden');
            }
        })
        .catch(error => {
            console.error('Error al iniciar sesión:', error);
            errorEl.textContent = 'Error de conexión. Intenta de nuevo.';
            errorEl.classList.remove('hidden');
        });
}

function enviarRegistro(event) {
    event.preventDefault();
    const errorEl = document.getElementById('registro-error');
    errorEl.classList.add('hidden');

    const nombre = document.getElementById('registro-nombre').value.trim();
    const email = document.getElementById('registro-email').value.trim();
    const password = document.getElementById('registro-password').value;

    fetch('/api/registro.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ nombre, email, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                usuarioActual = data.usuario;
                document.getElementById('form-registro').reset();
                ocultarPantallaAuth();
                cargarListaDeProyectos();
            } else {
                errorEl.textContent = data.message || 'No se pudo crear la cuenta';
                errorEl.classList.remove('hidden');
            }
        })
        .catch(error => {
            console.error('Error al registrar:', error);
            errorEl.textContent = 'Error de conexión. Intenta de nuevo.';
            errorEl.classList.remove('hidden');
        });
}

function cerrarSesion() {
    fetch('/api/logout.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        }
    })
        .then(() => {
            usuarioActual = null;
            nuevoProyecto(); // Limpia el formulario para que el siguiente usuario no vea datos ajenos
            mostrarPantallaAuth();
            document.getElementById('form-login').reset();
        })
        .catch(error => console.error('Error al cerrar sesión:', error));
}

// Si cualquier llamada a la API responde 401 (sesión vencida/cerrada en otra
// pestaña), regresamos a la pantalla de login en vez de mostrar un error crudo.
function manejarSesionExpirada(response) {
    if (response.status === 401) {
        mostrarPantallaAuth();
        return true;
    }
    return false;
}

// ====================================================================
// 1.6 NOTIFICACIONES (reemplazan a alert() / confirm() nativos)
// ====================================================================

// tipo: 'success' | 'error' | 'info'
function mostrarToast(mensaje, tipo = 'info') {
    const contenedor = document.getElementById('toast-container');
    if (!contenedor) { console.log(mensaje); return; } // fallback por si el contenedor no existe aún

    const colores = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-gray-800',
    };
    const iconos = { success: '✅', error: '❌', info: 'ℹ️' };

    const toast = document.createElement('div');
    toast.className = `${colores[tipo] || colores.info} text-white px-4 py-3 rounded-lg shadow-lg text-sm max-w-xs transition-all duration-300 opacity-0 translate-y-2`;
    toast.textContent = `${iconos[tipo] || ''} ${mensaje}`;
    contenedor.appendChild(toast);

    // Animación de entrada
    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-y-2');
    });

    // Animación de salida + limpieza
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Devuelve una Promise<boolean>: true si el usuario confirma, false si cancela
function mostrarConfirmacion(mensaje) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-confirmar');
        const texto = document.getElementById('modal-confirmar-texto');
        const btnAceptar = document.getElementById('modal-confirmar-aceptar');
        const btnCancelar = document.getElementById('modal-confirmar-cancelar');

        texto.textContent = mensaje;
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        function limpiar(resultado) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            btnAceptar.removeEventListener('click', onAceptar);
            btnCancelar.removeEventListener('click', onCancelar);
            resolve(resultado);
        }
        function onAceptar() { limpiar(true); }
        function onCancelar() { limpiar(false); }

        btnAceptar.addEventListener('click', onAceptar);
        btnCancelar.addEventListener('click', onCancelar);
    });
}

// ====================================================================
// 1.7 COMPLETITUD DE SECCIONES (marca con ✓ en el sidebar)
// ====================================================================

// Revisa cada sección: si todos sus campos de texto/número tienen valor,
// le pone un check al botón correspondiente en el sidebar.
function verificarCompletitudSecciones() {
    document.querySelectorAll('.tab-content').forEach(tab => {
        const campos = tab.querySelectorAll('input[type="number"]:not([readonly]):not([data-opcional]), input[type="text"]:not([readonly]):not([data-opcional])');
        if (campos.length === 0) return; // secciones que son solo resultados, sin nada que llenar

        let completo = true;
        campos.forEach(campo => {
            if (!campo.value || campo.value.trim() === '') {
                completo = false;
            }
        });

        const boton = document.querySelector(`.nav-button[data-tab="${tab.id}"]`);
        if (boton) {
            boton.classList.toggle('nav-complete', completo);
        }
    });
}

// Se revisa cada vez que el usuario escribe en cualquier campo
document.addEventListener('input', function (e) {
    if (e.target.matches('input')) {
        verificarCompletitudSecciones();
    }
});

// ====================================================================
// 2. FUNCIONES DE INTERFAZ Y CONVERSIÓN (MODAL/SOCKET)
// ====================================================================

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

function mostrarModal() {
    const modal = document.getElementById('modal-moneda');
    if (modal) modal.style.display = 'flex';
}

function seleccionarMoneda(moneda, cultura) {
    // Si la moneda es diferente a la actual, activamos la conversión
    if (moneda !== monedaActual) {
        conversionPendiente = true;
    }

    monedaActual = moneda;
    culturaActual = cultura;

    document.getElementById('modal-moneda').style.display = 'none';

    // Actualizar texto visual inmediato
    document.getElementById('label-moneda').innerText = `1 ${moneda}`;
    document.getElementById('valor-dolar').innerText = "Cargando...";

    if (!conn || conn.readyState !== WebSocket.OPEN) {
        iniciarSocket();
        setInterval(pedirTipoCambio, 60000);
    } else {
        pedirTipoCambio();
    }
}

// ===========================
// 3. LÓGICA DE CÁLCULOS (MOTOR FINANCIERO)
// ===========================
// Todo se recalcula en orden con recalcularTodo(). Las funciones viejas
// (calcularPlan, calcularPptoVtas, etc.) siguen existiendo porque el HTML
// las llama en los onchange, pero ahora todas llaman a recalcularTodo()
// para que ninguna pestaña se quede con datos viejos.

const ANIOS = [0, 1, 2, 3, 4];

// Lee un número de un input. Si está vacío regresa "porDefecto".
function num(id, porDefecto = 0) {
    const el = document.getElementById(id);
    if (!el || el.value === '' || el.value === null) return porDefecto;
    const v = parseFloat(el.value);
    return isNaN(v) ? porDefecto : v;
}

// Redondeo hacia arriba como ROUNDUP(x,0) de Excel (tolera errores de punto flotante)
function redondearArriba(x) {
    return Math.ceil(x - 1e-7);
}

function fmtMoneda(v) {
    return (v || 0).toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
}
function fmtNum(v, dec = 0) {
    return (v || 0).toLocaleString('es-MX', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtPct(v, dec = 2) {
    return isFinite(v) ? (v * 100).toFixed(dec) + '%' : 'N/A';
}
function fmtVeces(v, dec = 2) {
    return isFinite(v) ? v.toFixed(dec) : 'N/A';
}

// Arma una tabla de 5 años. filas = [{ label, data, fmt, clase, negrita }]
function tablaAnual(filas, conAnioCero = false) {
    let html = '<div class="overflow-x-auto"><table class="min-w-full text-sm"><thead class="table-header"><tr><th class="px-3 py-2 text-left">Concepto</th>';
    if (conAnioCero) html += '<th class="px-3 py-2">Año 0</th>';
    for (let a = 1; a <= 5; a++) html += `<th class="px-3 py-2">Año ${a}</th>`;
    html += '</tr></thead><tbody>';
    filas.forEach(f => {
        if (f.seccion) {
            html += `<tr class="${f.clase || 'bg-gray-100'}"><td colspan="${conAnioCero ? 7 : 6}" class="px-3 py-2 font-bold">${f.seccion}</td></tr>`;
            return;
        }
        const formato = f.fmt || fmtMoneda;
        html += `<tr class="table-row ${f.clase || ''}"><td class="px-3 py-2 ${f.negrita ? 'font-bold' : ''}">${f.label}</td>`;
        f.data.forEach(v => {
            const txt = (v === null || v === undefined) ? '' : formato(v);
            const color = (typeof v === 'number' && v < 0) ? 'text-red-700' : '';
            html += `<td class="px-3 py-2 text-right whitespace-nowrap ${f.negrita ? 'font-bold' : ''} ${color}">${txt}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
}

function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

let _recalculando = false;

function recalcularTodo() {
    if (_recalculando) return;
    _recalculando = true;
    try {
        const G = globalData;

        // ---------- 1. MERCADO META ----------
        // Si un % se deja vacío se toma como 100% (así puedes capturar el mercado meta directo en "Población Total")
        const poblacion = num('poblacion-total');
        G.mercadoMeta = poblacion * num('porcentaje-mujeres', 100) / 100 * num('rango-edad', 100) / 100 * num('poblacion-ocupada', 100) / 100;
        G.porcentajeConcentracion = num('concentracion-mercado', 100);
        G.mercadoConcentrado = G.mercadoMeta * G.porcentajeConcentracion / 100;
        setHTML('mercado-meta', fmtNum(Math.round(G.mercadoMeta)));
        setHTML('mercado-concentrado', fmtNum(Math.round(G.mercadoConcentrado)));

        // ---------- 2. PROYECCIÓN DE MERCADO Y UNIDADES ----------
        const participacion = num('participacion-mercado', 100);
        const incPoblacion = num('incremento-poblacion');
        const incProducto = num('incremento-producto');
        const penetracionIni = num('penetracion-inicial', 100);
        const incPenetracion = num('incremento-penetracion');
        const usosMensuales = num('usos-mensuales');

        G.mercadoPotencial = [];
        G.penetracionMercado = [];
        G.clientes = [];
        ANIOS.forEach(a => {
            if (a === 0) {
                G.mercadoPotencial[a] = redondearArriba(G.mercadoConcentrado * participacion / 100);
                G.penetracionMercado[a] = penetracionIni;
            } else {
                G.mercadoPotencial[a] = redondearArriba(G.mercadoPotencial[a - 1] * (1 + incPoblacion / 100) * (1 + incProducto / 100));
                // Crecimiento porcentual (igual que el Excel: 15% x 1.04 = 15.6%)
                G.penetracionMercado[a] = G.penetracionMercado[a - 1] * (1 + incPenetracion / 100);
            }
            G.clientes[a] = G.mercadoPotencial[a] * G.penetracionMercado[a] / 100;
            // Si hay usos mensuales, las unidades a vender se calculan solas
            if (usosMensuales > 0) {
                const unidades = redondearArriba(G.clientes[a] * usosMensuales * 12);
                const input = document.getElementById(`unidades-${a + 1}`);
                if (input) input.value = unidades;
            }
        });
        if (G.mercadoConcentrado > 0) {
            setHTML('proyeccion-mercado', tablaAnual([
                { label: 'Mercado potencial', data: G.mercadoPotencial, fmt: v => fmtNum(v) },
                { label: '% Participación', data: G.penetracionMercado, fmt: v => v.toFixed(2) + '%' },
                { label: 'Clientes', data: G.clientes, fmt: v => fmtNum(v) },
                ...(usosMensuales > 0 ? [{ label: 'Unidades (× usos × 12)', data: G.clientes.map(c => redondearArriba(c * usosMensuales * 12)), fmt: v => fmtNum(v), negrita: true }] : [])
            ]));
        } else {
            setHTML('proyeccion-mercado', '<p class="text-ink-400 italic">Completa la sección de Mercado Meta para ver la proyección aquí.</p>');
        }

        // ---------- 3. PRESUPUESTO DE VENTAS ----------
        const precioBase = num('precio-unitario-base');
        const incPrecio = num('incremento-precio');
        const redondearPrecio = document.getElementById('redondear-precio')?.checked || false;
        G.precioUnitario = [];
        G.unidadesVenta = [];
        G.ventasProyeccion = [];
        G.costoMercancia = [0, 0, 0, 0, 0];

        // Modo comercializadora: varios productos que se compran y se revenden
        // (unidades crecen con "Incremento anual en unidades" de la pestaña 2,
        //  precios con el incremento de precio y costos con el incremento del costo de MP)
        const incCostoProd = num('inflacion-mp');
        G.productos = [];
        document.querySelectorAll('#productos-container .producto-item').forEach(fila => {
            const nombre = fila.querySelector('.prod-nombre').value.trim();
            const u0 = parseFloat(fila.querySelector('.prod-unidades').value) || 0;
            const p0 = parseFloat(fila.querySelector('.prod-precio').value) || 0;
            const c0 = parseFloat(fila.querySelector('.prod-costo').value) || 0;
            if (!nombre || u0 <= 0) return;
            const prod = { nombre, unidades: [], precio: [], costo: [], ventas: [], costoTotal: [] };
            ANIOS.forEach(a => {
                prod.unidades[a] = a === 0 ? u0 : redondearArriba(prod.unidades[a - 1] * (1 + incProducto / 100));
                let pr = a === 0 ? p0 : prod.precio[a - 1] * (1 + incPrecio / 100);
                if (a > 0 && redondearPrecio) pr = redondearArriba(pr);
                prod.precio[a] = pr;
                prod.costo[a] = c0 * Math.pow(1 + incCostoProd / 100, a);
                prod.ventas[a] = prod.unidades[a] * pr;
                prod.costoTotal[a] = prod.unidades[a] * prod.costo[a];
            });
            G.productos.push(prod);
        });

        if (G.productos.length > 0) {
            ANIOS.forEach(a => {
                G.unidadesVenta[a] = G.productos.reduce((s, p) => s + p.unidades[a], 0);
                G.ventasProyeccion[a] = G.productos.reduce((s, p) => s + p.ventas[a], 0);
                G.costoMercancia[a] = G.productos.reduce((s, p) => s + p.costoTotal[a], 0);
                G.precioUnitario[a] = G.unidadesVenta[a] > 0 ? G.ventasProyeccion[a] / G.unidadesVenta[a] : 0;
                const input = document.getElementById(`unidades-${a + 1}`);
                if (input) input.value = G.unidadesVenta[a];
            });
            let htmlProd = '';
            G.productos.forEach(p => {
                htmlProd += `<div class="font-semibold text-gray-700 mt-3">${p.nombre}</div>` + tablaAnual([
                    { label: 'Unidades', data: p.unidades, fmt: v => fmtNum(v) },
                    { label: 'Precio', data: p.precio },
                    { label: 'Ventas', data: p.ventas },
                    { label: 'Costo de venta', data: p.costoTotal }
                ]);
            });
            setHTML('ventas-proyeccion', tablaAnual([
                { label: 'Unidades (todos)', data: G.unidadesVenta, fmt: v => fmtNum(v) },
                { label: 'Ventas totales', data: G.ventasProyeccion, negrita: true },
                { label: 'Costo de la mercancía', data: G.costoMercancia, negrita: true }
            ]) + htmlProd);
        } else {
            ANIOS.forEach(a => {
                let precio = a === 0 ? precioBase : G.precioUnitario[a - 1] * (1 + incPrecio / 100);
                if (a > 0 && redondearPrecio) precio = redondearArriba(precio);
                G.precioUnitario[a] = precio;
                G.unidadesVenta[a] = num(`unidades-${a + 1}`);
                G.ventasProyeccion[a] = G.unidadesVenta[a] * precio;
            });
            setHTML('ventas-proyeccion', tablaAnual([
                { label: 'Unidades', data: G.unidadesVenta, fmt: v => fmtNum(v) },
                { label: 'Precio', data: G.precioUnitario },
                { label: 'Ventas', data: G.ventasProyeccion, negrita: true }
            ]));
        }

        // ---------- 4. PRESUPUESTO DE PRODUCCIÓN ----------
        const diasLaborables = num('dias-laborables', 260);
        const diasInventario = num('dias-inventario');
        const invInicialPTUnid = num('inv-inicial-prod');
        G.invFinalPTUnid = [];
        G.invInicialPTUnid = [];
        G.unidadesProduccion = [];
        ANIOS.forEach(a => {
            if (diasInventario > 0) {
                // Igual que el Excel: ventas / días laborables × días de inventario
                const invAuto = redondearArriba(G.unidadesVenta[a] / diasLaborables * diasInventario);
                const input = document.getElementById(`inv-final-${a + 1}`);
                if (input) input.value = invAuto;
            }
            G.invFinalPTUnid[a] = num(`inv-final-${a + 1}`);
            G.invInicialPTUnid[a] = a === 0 ? invInicialPTUnid : G.invFinalPTUnid[a - 1];
            G.unidadesProduccion[a] = Math.max(0, G.unidadesVenta[a] + G.invFinalPTUnid[a] - G.invInicialPTUnid[a]);
        });
        setHTML('produccion-proyeccion', tablaAnual([
            { label: 'Ventas (u)', data: G.unidadesVenta, fmt: v => fmtNum(v) },
            { label: '(+) Inv. final deseado', data: G.invFinalPTUnid, fmt: v => fmtNum(v) },
            { label: '(−) Inv. inicial', data: G.invInicialPTUnid, fmt: v => fmtNum(v) },
            { label: '(=) Producción requerida', data: G.unidadesProduccion, fmt: v => fmtNum(v), negrita: true }
        ]));

        // ---------- 5. MATERIA PRIMA (receta y consumo) ----------
        G.materiaPrima = [];
        document.querySelectorAll('#receta-container .mp-item').forEach(fila => {
            const nombre = fila.querySelector('.receta-mp').value.trim();
            const cantidad = parseFloat(fila.querySelector('.receta-cant').value) || 0;
            const unidad = fila.querySelector('.receta-unidad').value.trim() || 'unidad';
            if (nombre && cantidad > 0) {
                G.materiaPrima.push({
                    nombre, cantidadPorUnidad: cantidad, unidad,
                    consumoAnual: G.unidadesProduccion.map(p => p * cantidad)
                });
            }
        });
        let htmlConsumo = '';
        G.materiaPrima.forEach(mp => {
            htmlConsumo += `<div class="border-b pb-3 mb-2"><div class="font-semibold text-gray-700 mb-1">${mp.nombre}</div>`;
            mp.consumoAnual.forEach((c, a) => {
                htmlConsumo += `<div class="text-sm text-gray-600">Año ${a + 1}: ${fmtNum(c, 3)} ${mp.unidad}</div>`;
            });
            htmlConsumo += '</div>';
        });
        setHTML('consumo-mp', htmlConsumo || '<p class="text-sm text-gray-600">Agrega materias primas a la receta.</p>');

        // ---------- 6. COMPRAS DE MP (con inflación del costo) ----------
        sincronizarInputsCostoMP();
        const inflacionMP = num('inflacion-mp');
        const pctInvFinalMP = num('inv-final-mp-pct');
        const invInicialMPUnid = num('inv-inicial-mp');
        G.costoMP = [];
        document.querySelectorAll('#costos-mp-container .costo-mp').forEach((input, i) => {
            G.costoMP[i] = parseFloat(input.value) || 0;
        });
        G.comprasMP = [0, 0, 0, 0, 0];
        G.invInicialMP = [0, 0, 0, 0, 0];
        G.invFinalMP = [0, 0, 0, 0, 0];
        G.mpUtilizada = [0, 0, 0, 0, 0];
        let htmlCompras = '';
        let htmlValMP = '';
        G.materiaPrima.forEach((mp, i) => {
            const costoBase = G.costoMP[i] || 0;
            mp.costoAnual = [];
            mp.comprasUnid = [];
            mp.invFinalUnid = [];
            mp.comprasValor = [];
            mp.invFinalValor = [];
            let invFinalAnteriorUnid = invInicialMPUnid;
            let invFinalAnteriorValor = null;
            ANIOS.forEach(a => {
                const costo = costoBase * Math.pow(1 + inflacionMP / 100, a);
                const consumo = mp.consumoAnual[a];
                const invFinalUnid = consumo * pctInvFinalMP / 100;
                const invInicialUnid = invFinalAnteriorUnid;
                const comprasUnid = Math.max(0, consumo + invFinalUnid - invInicialUnid);
                const invInicialValor = a === 0 ? invInicialUnid * costo : invFinalAnteriorValor;
                const comprasValor = comprasUnid * costo;
                const invFinalValor = invFinalUnid * costo;

                mp.costoAnual[a] = costo;
                mp.comprasUnid[a] = comprasUnid;
                mp.invFinalUnid[a] = invFinalUnid;
                mp.comprasValor[a] = comprasValor;
                mp.invFinalValor[a] = invFinalValor;

                G.comprasMP[a] += comprasValor;
                G.invInicialMP[a] += invInicialValor;
                G.invFinalMP[a] += invFinalValor;
                G.mpUtilizada[a] += invInicialValor + comprasValor - invFinalValor;

                invFinalAnteriorUnid = invFinalUnid;
                invFinalAnteriorValor = invFinalValor;
            });
            htmlCompras += `<div class="font-semibold text-gray-700 mt-3">${mp.nombre}</div>` + tablaAnual([
                { label: `Compras (${mp.unidad})`, data: mp.comprasUnid, fmt: v => fmtNum(v, 2) },
                { label: 'Costo unitario', data: mp.costoAnual, fmt: v => fmtNum(v, 4) },
                { label: 'Costo total', data: mp.comprasValor }
            ]);
            htmlValMP += `<div class="font-semibold text-gray-700 mt-3">${mp.nombre}</div>` + tablaAnual([
                { label: `Inv. final (${mp.unidad})`, data: mp.invFinalUnid, fmt: v => fmtNum(v, 2) },
                { label: 'Valor', data: mp.invFinalValor }
            ]);
        });
        if (G.productos.length > 0) {
            // La mercancía para reventa se compra y se vende en el mismo año (sin inventario)
            ANIOS.forEach(a => {
                G.comprasMP[a] += G.costoMercancia[a];
                G.mpUtilizada[a] += G.costoMercancia[a];
            });
            htmlCompras += '<div class="font-semibold text-gray-700 mt-3">Mercancía para reventa (pestaña 3)</div>' +
                tablaAnual([{ label: 'Costo total', data: G.costoMercancia }]);
        }
        htmlCompras += '<div class="font-bold text-indigo-600 mt-4">Total de compras</div>' + tablaAnual([
            { label: 'Total compras', data: G.comprasMP, negrita: true }
        ]);
        setHTML('compras-mp-resultado', (G.materiaPrima.length || G.productos.length) ? htmlCompras : '<p>Configure costos y consumo de MP</p>');

        // ---------- 7. MANO DE OBRA DIRECTA ----------
        const tiempo = num('tiempo-unidad');
        const tipoTiempo = document.getElementById('tiempo-unidad-tipo')?.value || 'hr';
        const horasPorUnidad = tipoTiempo === 'min' ? tiempo / 60 : tiempo;
        const costoHora = num('costo-hora');
        const incSalarial = num('incremento-salarial');
        const horasJornada = num('horas-jornada');
        G.horasMO = [];
        G.trabajadores = [];
        G.costoHoraAnual = [];
        G.costoMO = [];
        ANIOS.forEach(a => {
            const horas = G.unidadesProduccion[a] * horasPorUnidad;
            const tarifa = costoHora * Math.pow(1 + incSalarial / 100, a);
            G.horasMO[a] = horas;
            G.costoHoraAnual[a] = tarifa;
            if (horasJornada > 0 && diasLaborables > 0) {
                // Igual que el Excel: trabajadores = ROUNDUP(horas/días/jornada); MOD = trabajadores × salario diario × días
                const trabajadores = redondearArriba(horas / diasLaborables / horasJornada);
                G.trabajadores[a] = trabajadores;
                G.costoMO[a] = trabajadores * horasJornada * tarifa * diasLaborables;
            } else {
                G.trabajadores[a] = null;
                G.costoMO[a] = horas * tarifa;
            }
        });
        setHTML('costo-mo', tablaAnual([
            { label: 'Horas requeridas', data: G.horasMO, fmt: v => fmtNum(v, 1) },
            ...(horasJornada > 0 ? [
                { label: 'Trabajadores', data: G.trabajadores, fmt: v => fmtNum(v) },
                { label: 'Salario diario', data: G.costoHoraAnual.map(t => t * horasJornada) }
            ] : [{ label: 'Costo por hora', data: G.costoHoraAnual }]),
            { label: 'Costo MOD', data: G.costoMO, negrita: true }
        ]));

        // ---------- 8. GASTOS INDIRECTOS DE FABRICACIÓN ----------
        const inflacion = num('inflacion-anual');
        G.gifFijos = [];
        G.gifVariables = [];
        G.gastosIndirectos = [];
        ANIOS.forEach(a => {
            let fijos = 0;
            document.querySelectorAll('.gasto-fijo-monto').forEach(input => {
                fijos += (parseFloat(input.value) || 0) * Math.pow(1 + inflacion / 100, a);
            });
            let variables = 0;
            document.querySelectorAll('.gasto-var-unidad').forEach(input => {
                variables += (parseFloat(input.value) || 0) * G.unidadesProduccion[a];
            });
            G.gifFijos[a] = fijos;
            G.gifVariables[a] = variables;
            G.gastosIndirectos[a] = fijos + variables;
        });
        setHTML('gastos-indirectos-resultado', tablaAnual([
            { label: 'Fijos (con inflación)', data: G.gifFijos },
            { label: 'Variables', data: G.gifVariables },
            { label: 'Total GIF', data: G.gastosIndirectos, negrita: true }
        ]));

        // ---------- 9. INVERSIONES Y DEPRECIACIÓN ----------
        G.inversionesActivo = [];
        G.depreciacion = [0, 0, 0, 0, 0];
        let htmlInv = '';
        document.querySelectorAll('#inversiones-container .inversion-item').forEach(fila => {
            const nombre = fila.querySelector('.inv-nombre').value.trim();
            const monto = parseFloat(fila.querySelector('.inv-monto').value) || 0;
            const vidaUtil = parseFloat(fila.querySelector('.inv-vida').value) || 1;
            const tipo = fila.querySelector('.inv-tipo').value;
            if (!nombre || monto <= 0) return;
            const inversion = { nombre, monto, vidaUtil, tipo, depreciacionAnual: [] };
            let acumulada = 0;
            ANIOS.forEach(a => {
                const valorLibros = monto - acumulada;
                let dep;
                if (tipo === 'lineal') {
                    // Nunca deprecia más de lo que queda por depreciar (ej. vida de 3.33 años)
                    dep = Math.min(monto / vidaUtil, valorLibros);
                } else {
                    // Saldos decrecientes (doble tasa); en el último año de vida se deprecia lo que queda
                    dep = (a + 1 >= Math.ceil(vidaUtil)) ? valorLibros : valorLibros * (2 / vidaUtil);
                    dep = Math.min(dep, valorLibros);
                }
                dep = Math.max(0, dep);
                acumulada += dep;
                inversion.depreciacionAnual[a] = dep;
                G.depreciacion[a] += dep;
            });
            G.inversionesActivo.push(inversion);
            htmlInv += `<div class="font-semibold text-gray-700 mt-3">${nombre} — ${fmtMoneda(monto)}</div>` +
                tablaAnual([{ label: 'Depreciación', data: inversion.depreciacionAnual }]);
        });
        G.activoFijo = G.inversionesActivo.reduce((s, i) => s + i.monto, 0);
        htmlInv += '<div class="font-bold text-blue-600 mt-4">Depreciación total</div>' +
            tablaAnual([{ label: 'Total', data: G.depreciacion, negrita: true }]);
        setHTML('inversiones-resultado', G.inversionesActivo.length ? htmlInv : '<p>Agregue activos para calcular la depreciación.</p>');

        // ---------- 10. GASTOS DE OPERACIÓN ----------
        const pctCargaSocial = num('pct-carga-social');
        G.gastosAdmin = [0, 0, 0, 0, 0];
        G.sueldosAdmin = [0, 0, 0, 0, 0];
        G.gastosVentas = [0, 0, 0, 0, 0];
        G.cargaSocial = [0, 0, 0, 0, 0];
        G.gastosOperacion = [];
        document.querySelectorAll('#gastos-admin-container .gasto-admin-item').forEach(fila => {
            const mensual = parseFloat(fila.querySelector('.gasto-admin-monto').value) || 0;
            const tipo = fila.querySelector('.gasto-admin-tipo')?.value || 'inflacion';
            ANIOS.forEach(a => {
                let factor = 1;
                if (tipo === 'inflacion') factor = Math.pow(1 + inflacion / 100, a);
                if (tipo === 'salario') factor = Math.pow(1 + incSalarial / 100, a);
                const anual = mensual * 12 * factor;
                G.gastosAdmin[a] += anual;
                if (tipo === 'salario') G.sueldosAdmin[a] += anual;
            });
        });
        document.querySelectorAll('#gastos-ventas-container .gasto-ventas-pct').forEach(input => {
            const pct = parseFloat(input.value) || 0;
            ANIOS.forEach(a => { G.gastosVentas[a] += G.ventasProyeccion[a] * pct / 100; });
        });
        ANIOS.forEach(a => {
            // Carga social sobre sueldos administrativos + mano de obra directa (como el Excel)
            G.cargaSocial[a] = (G.sueldosAdmin[a] + G.costoMO[a]) * pctCargaSocial / 100;
            G.gastosOperacion[a] = G.gastosAdmin[a] + G.gastosVentas[a] + G.cargaSocial[a];
        });
        setHTML('gastos-operacion-resultado', tablaAnual([
            { label: 'Administración', data: G.gastosAdmin },
            { label: 'Ventas', data: G.gastosVentas },
            { label: 'Carga social', data: G.cargaSocial },
            { label: 'Total (sin depreciación)', data: G.gastosOperacion, negrita: true }
        ]));

        // ---------- 11. CONDICIONES COMERCIALES ----------
        const diasCV = num('dias-credito-ventas');
        const diasCC = num('dias-credito-compras');
        const descuento = num('descuento-pronto-pago');
        G.diasCredito = { ventas: diasCV, compras: diasCC };
        G.descuentoProntoPago = descuento;
        G.cuentasPorCobrar = G.ventasProyeccion.map(v => v * diasCV / 360);
        G.cuentasPorPagar = G.comprasMP.map(c => c * diasCC / 360);
        setHTML('condiciones-comerciales-resultado', tablaAnual([
            { label: 'Cuentas por cobrar (fin de año)', data: G.cuentasPorCobrar },
            { label: 'Cuentas por pagar (fin de año)', data: G.cuentasPorPagar },
            { label: 'Descuento posible por pronto pago', data: G.comprasMP.map(c => c * descuento / 100) }
        ]));

        // ---------- 12. COSTO DE PRODUCCIÓN Y DE LO VENDIDO ----------
        const costoUnitInvIniPT = num('inv-inicial-pt'); // $ por unidad del inventario inicial (opcional)
        G.costoProduccion = [];
        G.costoUnitarioProduccion = [];
        G.invInicialPT = [];
        G.invFinalPT = [];
        G.costoVendido = [];
        ANIOS.forEach(a => {
            // Se usa la MATERIA UTILIZADA (inv. inicial + compras − inv. final), no las compras
            const cp = G.mpUtilizada[a] + G.costoMO[a] + G.gastosIndirectos[a];
            const cu = G.unidadesProduccion[a] > 0 ? cp / G.unidadesProduccion[a] : 0;
            G.costoProduccion[a] = cp;
            G.costoUnitarioProduccion[a] = cu;
            // El inventario inicial se valúa al costo del año ANTERIOR
            G.invInicialPT[a] = a === 0 ? G.invInicialPTUnid[0] * (costoUnitInvIniPT || cu) : G.invFinalPT[a - 1];
            G.invFinalPT[a] = G.invFinalPTUnid[a] * cu;
            G.costoVendido[a] = G.invInicialPT[a] + cp - G.invFinalPT[a];
        });
        const cuInput = document.getElementById('costo-unitario-pt');
        if (cuInput) cuInput.value = (G.costoUnitarioProduccion[0] || 0).toFixed(4);
        setHTML('costo-produccion-anual', tablaAnual([
            { label: 'Inv. inicial MP', data: G.invInicialMP },
            { label: '(+) Compras MP', data: G.comprasMP },
            { label: '(−) Inv. final MP', data: G.invFinalMP },
            { label: '(=) Materia utilizada', data: G.mpUtilizada },
            { label: '(+) MO directa', data: G.costoMO },
            { label: '(+) GIF', data: G.gastosIndirectos },
            { label: '(=) Costo de producción', data: G.costoProduccion, negrita: true },
            { label: 'Costo unitario', data: G.costoUnitarioProduccion, fmt: v => fmtNum(v, 4) }
        ]));
        setHTML('costo-vendido-anual', tablaAnual([
            { label: 'Inv. inicial PT', data: G.invInicialPT },
            { label: '(+) Costo de producción', data: G.costoProduccion },
            { label: '(−) Inv. final PT', data: G.invFinalPT },
            { label: '(=) Costo de lo vendido', data: G.costoVendido, negrita: true }
        ]));

        // ---------- 13. VALUACIÓN DE INVENTARIOS ----------
        setHTML('valuacion-mp', (htmlValMP || '') + tablaAnual([{ label: 'Total inv. final MP', data: G.invFinalMP, negrita: true }]));
        setHTML('valuacion-pt', tablaAnual([
            { label: 'Unidades inv. final', data: G.invFinalPTUnid, fmt: v => fmtNum(v) },
            { label: 'Costo unitario', data: G.costoUnitarioProduccion, fmt: v => fmtNum(v, 4) },
            { label: 'Valor inv. final PT', data: G.invFinalPT, negrita: true }
        ]));

        // ---------- 15a. FINANCIAMIENTO (se necesita antes del ERI por los intereses) ----------
        G.inversionTotal = num('inversion-inicial', G.activoFijo);
        G.saldoInicialExtra = num('saldo-inicial');
        // Inventario que se compra con la inversión inicial y se mantiene (capital de trabajo)
        G.invCapitalTrabajo = num('inv-capital-trabajo');
        const pctFinanciamiento = num('pct-financiamiento');
        const tasaInteres = num('tasa-interes');
        const plazoAnios = num('plazo-credito', 5);
        G.credito = G.inversionTotal * pctFinanciamiento / 100;
        G.aportacion = G.inversionTotal - G.credito;
        G.intereses = [0, 0, 0, 0, 0];
        G.amortizacion = [0, 0, 0, 0, 0];
        G.saldoDeuda = [0, 0, 0, 0, 0];
        G.pagoMensual = 0;
        if (G.credito > 0 && plazoAnios > 0) {
            const i = tasaInteres / 100 / 12;
            const n = Math.round(plazoAnios * 12);
            G.pagoMensual = i > 0 ? G.credito * i / (1 - Math.pow(1 + i, -n)) : G.credito / n;
            let saldo = G.credito;
            for (let mes = 1; mes <= Math.min(n, 60); mes++) {
                const interes = saldo * i;
                const capital = Math.min(G.pagoMensual - interes, saldo);
                saldo -= capital;
                const a = Math.floor((mes - 1) / 12);
                G.intereses[a] += interes;
                G.amortizacion[a] += capital;
                G.saldoDeuda[a] = Math.max(0, saldo);
            }
            for (let a = 1; a < 5; a++) {
                if (Math.floor((n - 1) / 12) < a) G.saldoDeuda[a] = 0;
            }
        }
        setHTML('tabla-amortizacion', G.credito > 0
            ? `<p class="text-sm text-gray-600 mb-2">Crédito: <b>${fmtMoneda(G.credito)}</b> · Pago mensual: <b>${fmtMoneda(G.pagoMensual)}</b> · Aportación socios: <b>${fmtMoneda(G.aportacion)}</b></p>` +
              tablaAnual([
                  { label: 'Intereses', data: G.intereses },
                  { label: 'Amortización de capital', data: G.amortizacion },
                  { label: 'Saldo del crédito', data: G.saldoDeuda, negrita: true }
              ])
            : '<p class="text-sm text-gray-500">Sin crédito bancario (captura el % financiado para calcularlo).</p>');

        // ---------- 14. ESTADO DE RESULTADOS ----------
        const tasaISR = num('tasa-isr', 30) / 100;
        const tasaPTU = num('tasa-ptu', 10) / 100;
        G.utilidadBruta = [];
        G.utilidadOperacion = [];
        G.utilidadAntesImpuestos = [];
        G.isr = [];
        G.ptu = [];
        G.utilidadNeta = [];
        ANIOS.forEach(a => {
            G.utilidadBruta[a] = G.ventasProyeccion[a] - G.costoVendido[a];
            G.utilidadOperacion[a] = G.utilidadBruta[a] - G.gastosOperacion[a] - G.depreciacion[a];
            G.utilidadAntesImpuestos[a] = G.utilidadOperacion[a] - G.intereses[a];
            const base = Math.max(0, G.utilidadAntesImpuestos[a]);
            G.isr[a] = base * tasaISR;
            G.ptu[a] = base * tasaPTU;
            G.utilidadNeta[a] = G.utilidadAntesImpuestos[a] - G.isr[a] - G.ptu[a];
        });
        setHTML('estado-resultados', tablaAnual([
            { label: 'Ventas', data: G.ventasProyeccion, clase: 'bg-green-50', negrita: true },
            { label: '(−) Costo de lo vendido', data: G.costoVendido },
            { label: 'UTILIDAD BRUTA', data: G.utilidadBruta, clase: 'bg-blue-50', negrita: true },
            { label: '(−) Gastos de operación', data: G.gastosOperacion },
            { label: '(−) Depreciación', data: G.depreciacion },
            { label: 'UTILIDAD DE OPERACIÓN', data: G.utilidadOperacion, clase: 'bg-yellow-50', negrita: true },
            { label: '(−) Gastos financieros (intereses)', data: G.intereses },
            { label: 'UTILIDAD ANTES DE IMPUESTOS', data: G.utilidadAntesImpuestos, negrita: true },
            { label: `(−) ISR (${(tasaISR * 100).toFixed(0)}%)`, data: G.isr },
            { label: `(−) PTU (${(tasaPTU * 100).toFixed(0)}%)`, data: G.ptu },
            { label: 'UTILIDAD NETA', data: G.utilidadNeta, clase: 'bg-green-100', negrita: true }
        ]));

        // ---------- 15b. FLUJO DE EFECTIVO ----------
        G.cobros = [];
        G.pagosProveedores = [];
        G.impuestos = [];
        G.totalIngresosFE = [];
        G.totalEgresosFE = [];
        G.flujoNeto = [];
        G.saldoEfectivo = [];
        // Año 0: entra la aportación + el crédito (+ saldo inicial extra) y sale el activo fijo
        G.saldoEfectivo0 = G.inversionTotal + G.saldoInicialExtra - G.activoFijo - G.invCapitalTrabajo;
        let saldoAnterior = G.saldoEfectivo0;
        ANIOS.forEach(a => {
            const cxcAnterior = a === 0 ? 0 : G.cuentasPorCobrar[a - 1];
            const cxpAnterior = a === 0 ? 0 : G.cuentasPorPagar[a - 1];
            G.cobros[a] = G.ventasProyeccion[a] - G.cuentasPorCobrar[a] + cxcAnterior;
            G.pagosProveedores[a] = G.comprasMP[a] - G.cuentasPorPagar[a] + cxpAnterior;
            G.impuestos[a] = G.isr[a] + G.ptu[a];
            G.totalIngresosFE[a] = G.cobros[a];
            G.totalEgresosFE[a] = G.pagosProveedores[a] + G.costoMO[a] + G.gastosIndirectos[a] +
                G.gastosOperacion[a] + G.intereses[a] + G.amortizacion[a] + G.impuestos[a];
            G.flujoNeto[a] = G.totalIngresosFE[a] - G.totalEgresosFE[a];
            G.saldoEfectivo[a] = saldoAnterior + G.flujoNeto[a];
            saldoAnterior = G.saldoEfectivo[a];
        });
        const v0 = (x) => [x, ...ANIOS.map(() => null)];
        const conCero = (arr) => [null, ...arr];
        setHTML('flujo-efectivo-resultado', tablaAnual([
            { seccion: 'INGRESOS', clase: 'bg-green-50' },
            { label: 'Aportación de socios', data: v0(G.aportacion + G.saldoInicialExtra) },
            { label: 'Crédito bancario', data: v0(G.credito) },
            { label: 'Cobranza (ventas − CxC + CxC año anterior)', data: conCero(G.cobros) },
            { seccion: 'EGRESOS', clase: 'bg-red-50' },
            { label: 'Inversión en activo fijo y diferido', data: v0(G.activoFijo) },
            ...(G.invCapitalTrabajo ? [{ label: 'Inventario inicial (capital de trabajo)', data: v0(G.invCapitalTrabajo) }] : []),
            { label: 'Pago a proveedores de MP', data: conCero(G.pagosProveedores) },
            { label: 'Mano de obra directa', data: conCero(G.costoMO) },
            { label: 'Gastos indirectos', data: conCero(G.gastosIndirectos) },
            { label: 'Gastos de operación', data: conCero(G.gastosOperacion) },
            { label: 'Intereses', data: conCero(G.intereses) },
            { label: 'Amortización del crédito', data: conCero(G.amortizacion) },
            { label: 'Impuestos (ISR + PTU)', data: conCero(G.impuestos) },
            { label: 'FLUJO NETO', data: [G.saldoEfectivo0, ...G.flujoNeto], clase: 'bg-blue-50', negrita: true },
            { label: 'SALDO FINAL DE EFECTIVO', data: [G.saldoEfectivo0, ...G.saldoEfectivo], clase: 'bg-yellow-50', negrita: true }
        ], true));

        // ---------- 16. BALANCE GENERAL ----------
        // El capital social incluye los inventarios iniciales (aportación en especie) para que cuadre
        G.capitalSocial = G.aportacion + G.saldoInicialExtra + G.invInicialMP[0] + G.invInicialPT[0];
        G.depAcumulada = [];
        G.activoFijoNeto = [];
        G.activoCirculante = [];
        G.activoTotal = [];
        G.pasivoTotal = [];
        G.utilidadesAnteriores = [];
        G.capital = [];
        G.pasivoMasCapital = [];
        let depAcum = 0, utilAcum = 0;
        ANIOS.forEach(a => {
            depAcum += G.depreciacion[a];
            G.depAcumulada[a] = depAcum;
            G.activoFijoNeto[a] = G.activoFijo - depAcum;
            G.activoCirculante[a] = G.saldoEfectivo[a] + G.cuentasPorCobrar[a] + G.invFinalMP[a] + G.invFinalPT[a] + G.invCapitalTrabajo;
            G.activoTotal[a] = G.activoCirculante[a] + G.activoFijoNeto[a];
            G.pasivoTotal[a] = G.cuentasPorPagar[a] + G.saldoDeuda[a];
            G.utilidadesAnteriores[a] = utilAcum;
            utilAcum += G.utilidadNeta[a];
            G.capital[a] = G.capitalSocial + G.utilidadesAnteriores[a] + G.utilidadNeta[a];
            G.pasivoMasCapital[a] = G.pasivoTotal[a] + G.capital[a];
        });
        const diferencia = G.activoTotal.map((x, a) => x - G.pasivoMasCapital[a]);
        const cuadra = diferencia.every(d => Math.abs(d) < 1);
        setHTML('estado-situacion', tablaAnual([
            { seccion: 'ACTIVO', clase: 'bg-blue-100' },
            { label: 'Efectivo', data: G.saldoEfectivo },
            { label: 'Cuentas por cobrar', data: G.cuentasPorCobrar },
            { label: 'Inventario final de MP', data: G.invFinalMP },
            { label: 'Inventario final de PT', data: G.invFinalPT },
            ...(G.invCapitalTrabajo ? [{ label: 'Inventario (capital de trabajo)', data: ANIOS.map(() => G.invCapitalTrabajo) }] : []),
            { label: 'Total activo circulante', data: G.activoCirculante, negrita: true },
            { label: 'Activo fijo (costo)', data: ANIOS.map(() => G.activoFijo) },
            { label: '(−) Depreciación acumulada', data: G.depAcumulada },
            { label: 'Total activo fijo neto', data: G.activoFijoNeto, negrita: true },
            { label: 'TOTAL ACTIVO', data: G.activoTotal, clase: 'bg-blue-50', negrita: true },
            { seccion: 'PASIVO', clase: 'bg-red-100' },
            { label: 'Proveedores (cuentas por pagar)', data: G.cuentasPorPagar },
            { label: 'Crédito bancario', data: G.saldoDeuda },
            { label: 'Total pasivo', data: G.pasivoTotal, negrita: true },
            { seccion: 'CAPITAL CONTABLE', clase: 'bg-green-100' },
            { label: 'Capital social', data: ANIOS.map(() => G.capitalSocial) },
            { label: 'Resultados de ejercicios anteriores', data: G.utilidadesAnteriores },
            { label: 'Resultado del ejercicio', data: G.utilidadNeta },
            { label: 'Total capital', data: G.capital, negrita: true },
            { label: 'TOTAL PASIVO + CAPITAL', data: G.pasivoMasCapital, clase: 'bg-green-50', negrita: true },
            { label: 'Diferencia (debe ser 0)', data: diferencia }
        ]) + (cuadra
            ? '<p class="mt-2 text-sm font-semibold text-green-700">✔ El balance cuadra: Activo = Pasivo + Capital</p>'
            : '<p class="mt-2 text-sm font-semibold text-red-700">✖ El balance NO cuadra, revisa los datos capturados</p>'));

        // ---------- 17. EVALUACIÓN (WACC, VPN, TIR, B/C, PRI) Y RAZONES ----------
        calcularEvaluacion(tasaISR + tasaPTU, tasaInteres);

        generarResumenEjecutivo();
    } catch (err) {
        console.error('Error al recalcular:', err);
    } finally {
        _recalculando = false;
    }
    if (typeof verificarCompletitudSecciones === 'function') verificarCompletitudSecciones();
}

// Mantiene los inputs de costo de MP alineados con la receta sin perder lo que ya se escribió
let _firmaMP = null;
function sincronizarInputsCostoMP(materiasPrimasCargadas = null) {
    const container = document.getElementById('costos-mp-container');
    if (!container) return;
    const firma = globalData.materiaPrima.map(m => m.nombre + '|' + m.unidad).join('§');
    if (firma === _firmaMP && !materiasPrimasCargadas && container.querySelector('.costo-mp')) return;

    // Guardamos los costos ya escritos (por nombre) antes de redibujar
    const previos = {};
    container.querySelectorAll('.costo-mp').forEach(input => { previos[input.dataset.nombre] = input.value; });

    if (globalData.materiaPrima.length === 0) {
        container.innerHTML = '<h4 class="font-semibold text-gray-700 mb-3">Costos Unitarios de Materia Prima</h4><p class="text-sm text-gray-600">Configure primero las materias primas</p>';
        _firmaMP = firma;
        return;
    }
    let html = '<h4 class="font-semibold text-gray-700 mb-3">Costos Unitarios de Materia Prima (Año 1)</h4>';
    globalData.materiaPrima.forEach((mp, i) => {
        let costo = previos[mp.nombre] ?? '';
        if (materiasPrimasCargadas) {
            const cargada = materiasPrimasCargadas.find(m => m.nombre_mp === mp.nombre);
            if (cargada && cargada.costo_unitario !== null) costo = cargada.costo_unitario;
        }
        const nombreSeguro = mp.nombre.replace(/"/g, '&quot;');
        html += `<div class="costo-mp-item grid grid-cols-2 gap-2 mb-2">
                <span class="text-sm text-gray-700 py-2">${mp.nombre} (${mp.unidad})</span>
                <input type="number" class="costo-mp text-sm" data-index="${i}" data-nombre="${nombreSeguro}" placeholder="Costo por ${mp.unidad}" step="any" onchange="recalcularTodo()" value="${costo}">
            </div>`;
    });
    container.innerHTML = html;
    _firmaMP = firma;
}

// Valor presente neto de una serie de flujos (flujos[0] es el año 0)
function vpn(tasa, flujos) {
    return flujos.reduce((s, f, t) => s + f / Math.pow(1 + tasa, t), 0);
}

// TIR por bisección (busca la tasa donde el VPN = 0)
function tir(flujos) {
    let bajo = -0.99, alto = 1;
    while (vpn(alto, flujos) > 0 && alto < 1e6) alto *= 2;
    if (vpn(bajo, flujos) * vpn(alto, flujos) > 0) return NaN;
    for (let k = 0; k < 300; k++) {
        const medio = (bajo + alto) / 2;
        if (vpn(bajo, flujos) * vpn(medio, flujos) <= 0) alto = medio; else bajo = medio;
    }
    return (bajo + alto) / 2;
}

function calcularEvaluacion(tasaImpuestos, tasaInteres) {
    const G = globalData;
    const ke = num('tasa-ke') / 100;
    const kd = tasaInteres / 100;
    const E = G.aportacion + G.saldoInicialExtra;
    const D = G.credito;
    const V = E + D;
    G.wacc = V > 0 ? (E / V) * ke + (D / V) * kd * (1 - tasaImpuestos) : ke;

    // Método "proyecto": flujo neto + intereses + amortización (antes de financiamiento)
    // Método "flujo-neto": el flujo neto del flujo de efectivo tal cual (como el ejercicio de Lácteos)
    const metodo = document.getElementById('metodo-vpn')?.value || 'proyecto';
    G.flujoProyecto = ANIOS.map(a => metodo === 'flujo-neto'
        ? G.flujoNeto[a]
        : G.flujoNeto[a] + G.intereses[a] + G.amortizacion[a]);
    const flujos = [-G.inversionTotal, ...G.flujoProyecto];
    G.vpn = vpn(G.wacc, flujos);
    G.tir = tir(flujos);
    const vpFlujos = G.flujoProyecto.reduce((s, f, a) => s + f / Math.pow(1 + G.wacc, a + 1), 0);
    G.beneficioCosto = G.inversionTotal > 0 ? vpFlujos / G.inversionTotal : NaN;

    // Periodo de recuperación (años y meses)
    let acumulado = -G.inversionTotal;
    G.pri = null;
    for (let a = 0; a < 5; a++) {
        const antes = acumulado;
        acumulado += G.flujoProyecto[a];
        if (antes < 0 && acumulado >= 0) {
            const fraccion = -antes / G.flujoProyecto[a];
            let anios = a + Math.floor(fraccion);
            let meses = Math.round((fraccion - Math.floor(fraccion)) * 12);
            if (meses === 12) { anios += 1; meses = 0; }
            G.pri = { anios, meses };
            break;
        }
    }
    if (G.inversionTotal <= 0) G.pri = { anios: 0, meses: 0 };
    const textoPRI = G.pri ? `${G.pri.anios} años ${G.pri.meses} meses` : 'No se recupera en 5 años';

    let htmlEval = `
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div class="bg-gray-50 p-3 rounded"><div class="text-xs text-gray-500">WACC</div><div class="text-xl font-bold">${fmtPct(G.wacc)}</div></div>
            <div class="bg-gray-50 p-3 rounded"><div class="text-xs text-gray-500">VPN</div><div class="text-xl font-bold ${G.vpn >= 0 ? 'text-green-700' : 'text-red-700'}">${fmtMoneda(G.vpn)}</div></div>
            <div class="bg-gray-50 p-3 rounded"><div class="text-xs text-gray-500">TIR</div><div class="text-xl font-bold">${fmtPct(G.tir)}</div></div>
            <div class="bg-gray-50 p-3 rounded"><div class="text-xs text-gray-500">Beneficio / Costo</div><div class="text-xl font-bold">${fmtVeces(G.beneficioCosto)}</div></div>
            <div class="bg-gray-50 p-3 rounded"><div class="text-xs text-gray-500">Periodo de recuperación</div><div class="text-xl font-bold">${textoPRI}</div></div>
            <div class="bg-gray-50 p-3 rounded"><div class="text-xs text-gray-500">Inversión total</div><div class="text-xl font-bold">${fmtMoneda(G.inversionTotal)}</div></div>
        </div>
        <p class="text-xs text-gray-500 mb-2">WACC = E/(D+E)·ke + D/(D+E)·kd·(1−t), con E = ${fmtMoneda(E)}, D = ${fmtMoneda(D)}, ke = ${(ke * 100).toFixed(2)}%, kd = ${(kd * 100).toFixed(2)}%, t = ${(tasaImpuestos * 100).toFixed(0)}% (ISR + PTU).</p>`;
    htmlEval += tablaAnual([
        { label: metodo === 'flujo-neto' ? 'Flujo neto' : 'Flujo del proyecto', data: [-G.inversionTotal, ...G.flujoProyecto] },
        { label: 'Flujo descontado (WACC)', data: flujos.map((f, t) => f / Math.pow(1 + G.wacc, t)) }
    ], true);
    setHTML('evaluacion-resultado', htmlEval);

    // Razones financieras
    const pasivoCirculante = ANIOS.map(a => G.cuentasPorPagar[a] + (a < 4 ? G.amortizacion[a + 1] : G.saldoDeuda[a]));
    const inventarios = ANIOS.map(a => G.invFinalMP[a] + G.invFinalPT[a] + (G.invCapitalTrabajo || 0));
    const div = (x, y) => (y ? x / y : NaN);
    // Apalancamiento: costos variables = MP utilizada + MOD + GIF variables + gastos de venta
    const margenContribucion = ANIOS.map(a => G.ventasProyeccion[a] - (G.mpUtilizada[a] + G.costoMO[a] + G.gifVariables[a] + G.gastosVentas[a]));
    const gao = ANIOS.map(a => div(margenContribucion[a], G.utilidadOperacion[a]));
    const gaf = ANIOS.map(a => div(G.utilidadOperacion[a], G.utilidadAntesImpuestos[a]));
    setHTML('razones-resultado', tablaAnual([
        { seccion: 'LIQUIDEZ', clase: 'bg-blue-50' },
        { label: 'Índice de liquidez (AC / PC)', data: ANIOS.map(a => div(G.activoCirculante[a], pasivoCirculante[a])), fmt: fmtVeces },
        { label: 'Prueba del ácido ((AC − Inv) / PC)', data: ANIOS.map(a => div(G.activoCirculante[a] - inventarios[a], pasivoCirculante[a])), fmt: fmtVeces },
        { label: 'Capital de trabajo (AC − PC)', data: ANIOS.map(a => G.activoCirculante[a] - pasivoCirculante[a]) },
        { seccion: 'RENTABILIDAD', clase: 'bg-green-50' },
        { label: 'ROE (Utilidad neta / Capital)', data: ANIOS.map(a => div(G.utilidadNeta[a], G.capital[a])), fmt: fmtPct },
        { label: 'ROA (Utilidad neta / Activo total)', data: ANIOS.map(a => div(G.utilidadNeta[a], G.activoTotal[a])), fmt: fmtPct },
        { label: 'Margen bruto', data: ANIOS.map(a => div(G.utilidadBruta[a], G.ventasProyeccion[a])), fmt: fmtPct },
        { label: 'Margen de operación', data: ANIOS.map(a => div(G.utilidadOperacion[a], G.ventasProyeccion[a])), fmt: fmtPct },
        { label: 'Margen neto', data: ANIOS.map(a => div(G.utilidadNeta[a], G.ventasProyeccion[a])), fmt: fmtPct },
        { seccion: 'ESTRUCTURA', clase: 'bg-yellow-50' },
        { label: 'Pasivo / Activo', data: ANIOS.map(a => div(G.pasivoTotal[a], G.activoTotal[a])), fmt: fmtPct },
        { label: 'Capital / Activo', data: ANIOS.map(a => div(G.capital[a], G.activoTotal[a])), fmt: fmtPct },
        { label: 'Cobertura de intereses (UO / intereses)', data: ANIOS.map(a => div(G.utilidadOperacion[a], G.intereses[a])), fmt: fmtVeces },
        { seccion: 'OPERACIÓN', clase: 'bg-purple-50' },
        { label: 'Rotación de cartera (ventas / CxC)', data: ANIOS.map(a => div(G.ventasProyeccion[a], G.cuentasPorCobrar[a])), fmt: fmtVeces },
        { label: 'Rotación de inventarios (CV / inventarios)', data: ANIOS.map(a => div(G.costoVendido[a], inventarios[a])), fmt: fmtVeces },
        { seccion: 'GRADOS DE APALANCAMIENTO', clase: 'bg-gray-100' },
        { label: 'Operativo (GAO)', data: gao, fmt: fmtVeces },
        { label: 'Financiero (GAF)', data: gaf, fmt: fmtVeces },
        { label: 'Total (GAT)', data: ANIOS.map(a => gao[a] * gaf[a]), fmt: fmtVeces }
    ]));
}

function generarResumenEjecutivo() {
    const G = globalData;
    const ventasTotal = G.ventasProyeccion.reduce((a, b) => a + b, 0);
    const utilidadNeta5 = G.utilidadNeta.reduce((a, b) => a + b, 0);
    const html = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-green-100 p-3 rounded-lg text-center">
                <div class="text-2xl font-bold text-green-700">${fmtMoneda(ventasTotal)}</div>
                <div class="text-sm text-green-600">Ingresos totales (5 años)</div>
            </div>
            <div class="bg-blue-100 p-3 rounded-lg text-center">
                <div class="text-2xl font-bold text-blue-700">${fmtMoneda(utilidadNeta5)}</div>
                <div class="text-sm text-blue-600">Utilidad neta (5 años)</div>
            </div>
            <div class="bg-purple-100 p-3 rounded-lg text-center">
                <div class="text-2xl font-bold text-purple-700">${fmtMoneda(G.vpn)}</div>
                <div class="text-sm text-purple-600">VPN</div>
            </div>
            <div class="bg-yellow-100 p-3 rounded-lg text-center">
                <div class="text-2xl font-bold text-yellow-700">${fmtPct(G.tir, 1)}</div>
                <div class="text-sm text-yellow-600">TIR</div>
            </div>
        </div>
        <div class="mt-4 text-sm text-gray-600">
            <p><strong>Recomendación:</strong> ${G.vpn > 0 ? 'El VPN es positivo: el proyecto genera valor y es viable.' : 'El VPN es negativo o cero: revisar costos, precios o financiamiento.'}</p>
            <p><strong>Participación de mercado:</strong> Año 1: ${(G.penetracionMercado[0] || 0).toFixed(2)}% → Año 5: ${(G.penetracionMercado[4] || 0).toFixed(2)}%</p>
        </div>`;
    setHTML('resumen-ejecutivo', html);
}

// Las funciones de siempre (las llama el HTML) ahora recalculan todo en orden
function calcularPlan() { recalcularTodo(); }
function calcularFactSensibil() { recalcularTodo(); }
function calcularPptoVtas() { recalcularTodo(); }
function calcularCondicionesComerciales() { recalcularTodo(); }
function calcularInversiones() { recalcularTodo(); }
function calcularPptoProd() { recalcularTodo(); }
function calcularPptoMtp() { recalcularTodo(); }
function calcularComprasMP() { recalcularTodo(); }
function calcularPptoMO() { recalcularTodo(); }
function calcularGastosIndirectos() { recalcularTodo(); }
function calcularCostoProduccion() { recalcularTodo(); }
function calcularGastosOperacion() { recalcularTodo(); }
function calcularValuacionInv() { recalcularTodo(); }
function calcularEstadoResultados() { recalcularTodo(); }
function calcularEstadoSituacion() { recalcularTodo(); }
function calcularFlujoEfectivo() { recalcularTodo(); }

function actualizarCostosMP(materiasPrimasCargadas = null) {
    recalcularTodo(); // arma la lista de MP
    sincronizarInputsCostoMP(materiasPrimasCargadas);
    recalcularTodo();
}

// ---- Filas dinámicas ----
function agregarInversion(inversion = null) {
    const container = document.getElementById('inversiones-container');
    const newRow = document.createElement('div');
    newRow.className = 'inversion-item grid grid-cols-5 gap-2 mb-2 items-center';
    const nombre = inversion ? inversion.nombre_activo : '';
    const monto = inversion ? inversion.monto : '';
    const vida = inversion ? inversion.vida_util_anios : '';
    const tipo = inversion ? inversion.metodo_depreciacion : 'lineal';
    newRow.innerHTML = `<input type="text" placeholder="Nombre Activo" class="inv-nombre text-sm col-span-1" onchange="recalcularTodo()" value="${nombre || ''}"><input type="number" placeholder="Monto" class="inv-monto text-sm col-span-1" step="any" onchange="recalcularTodo()" value="${monto || ''}"><input type="number" placeholder="Vida útil (años)" class="inv-vida text-sm col-span-1" step="any" onchange="recalcularTodo()" value="${vida || ''}"><select class="inv-tipo text-sm col-span-1" onchange="recalcularTodo()"><option value="lineal" ${tipo === 'lineal' ? 'selected' : ''}>Lineal</option><option value="acelerada" ${tipo === 'acelerada' ? 'selected' : ''}>Acelerada</option></select><button onclick="recalcularTodo()" class="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs col-span-1">Calcular</button>`;
    container.appendChild(newRow);
}

function agregarProducto(prod = null) {
    const container = document.getElementById('productos-container');
    const newRow = document.createElement('div');
    newRow.className = 'producto-item grid grid-cols-4 gap-2 mb-2';
    const v = (k) => (prod && prod[k] !== undefined && prod[k] !== null) ? prod[k] : '';
    newRow.innerHTML = `<input type="text" placeholder="Producto" class="prod-nombre text-sm" data-opcional onchange="recalcularTodo()" value="${String(v('nombre')).replace(/"/g, '&quot;')}"><input type="number" placeholder="Unidades año 1" class="prod-unidades text-sm" data-opcional step="any" onchange="recalcularTodo()" value="${v('unidades')}"><input type="number" placeholder="Precio venta" class="prod-precio text-sm" data-opcional step="any" onchange="recalcularTodo()" value="${v('precio')}"><input type="number" placeholder="Costo unitario" class="prod-costo text-sm" data-opcional step="any" onchange="recalcularTodo()" value="${v('costo')}">`;
    container.appendChild(newRow);
}

function agregarMateriaPrima(mp = null) {
    const container = document.getElementById('receta-container');
    const newRow = document.createElement('div');
    newRow.className = 'mp-item grid grid-cols-3 gap-2 mb-2';
    const nombre = mp ? mp.nombre_mp : '';
    const cantidad = mp ? mp.cantidad_por_unidad_prod : '';
    const unidad = mp ? mp.unidad_medida : '';
    newRow.innerHTML = `<input type="text" placeholder="Materia Prima" class="receta-mp text-sm" onchange="calcularPptoMtp()" value="${nombre || ''}"><input type="number" placeholder="Cantidad por unidad" class="receta-cant text-sm" step="any" onchange="calcularPptoMtp()" value="${cantidad || ''}"><input type="text" placeholder="Unidad" class="receta-unidad text-sm" onchange="calcularPptoMtp()" value="${unidad || ''}">`;
    container.appendChild(newRow);
}

function agregarGastoFijo(gasto = null) {
    const container = document.getElementById('gastos-fijos-container');
    const newRow = document.createElement('div');
    newRow.className = 'gasto-fijo-item grid grid-cols-2 gap-2 mt-2';
    const concepto = gasto ? gasto.concepto : '';
    const monto = gasto ? gasto.monto_anual : '';
    newRow.innerHTML = `<input type="text" placeholder="Concepto (ej: Renta)" class="gasto-fijo-concepto text-sm" value="${concepto || ''}"><input type="number" placeholder="Monto anual" class="gasto-fijo-monto text-sm" step="any" onchange="calcularGastosIndirectos()" value="${monto || ''}">`;
    container.appendChild(newRow);
}

function agregarGastoVariable(gasto = null) {
    const container = document.getElementById('gastos-variables-container');
    const newRow = document.createElement('div');
    newRow.className = 'gasto-var-item grid grid-cols-3 gap-2 mt-2';
    const concepto = gasto ? gasto.concepto : '';
    const porUnidad = gasto ? gasto.por_unidad : '';
    const unidad = gasto ? gasto.unidad : '';
    newRow.innerHTML = `<input type="text" placeholder="Concepto" class="gasto-var-concepto text-sm" data-opcional value="${concepto || ''}"><input type="number" placeholder="Por unidad" class="gasto-var-unidad text-sm" data-opcional step="any" onchange="calcularGastosIndirectos()" value="${porUnidad || ''}"><input type="text" placeholder="Unidad" class="gasto-var-tipo text-sm" data-opcional value="${unidad || ''}">`;
    container.appendChild(newRow);
}

function agregarGastoAdmin(gasto = null) {
    const container = document.getElementById('gastos-admin-container');
    const newRow = document.createElement('div');
    newRow.className = 'gasto-admin-item grid grid-cols-3 gap-2 mb-2';
    const concepto = gasto ? gasto.concepto : '';
    const monto = gasto ? gasto.monto_mensual : '';
    const tipo = (gasto && gasto.tipo) ? gasto.tipo : 'inflacion';
    newRow.innerHTML = `<input type="text" placeholder="Concepto" class="gasto-admin-concepto text-sm" value="${concepto || ''}"><input type="number" placeholder="Monto mensual" class="gasto-admin-monto text-sm" step="any" onchange="calcularGastosOperacion()" value="${monto || ''}"><select class="gasto-admin-tipo text-sm" onchange="calcularGastosOperacion()" title="¿Con qué sube cada año?"><option value="inflacion" ${tipo === 'inflacion' ? 'selected' : ''}>Sube con inflación</option><option value="salario" ${tipo === 'salario' ? 'selected' : ''}>Es sueldo (sube con incremento salarial)</option><option value="fijo" ${tipo === 'fijo' ? 'selected' : ''}>No cambia</option></select>`;
    container.appendChild(newRow);
}

function agregarGastoVentas(gasto = null) {
    const container = document.getElementById('gastos-ventas-container');
    const newRow = document.createElement('div');
    newRow.className = 'gasto-ventas-item grid grid-cols-2 gap-2 mb-2';
    const concepto = gasto ? gasto.concepto : '';
    const porcentaje = gasto ? gasto.porcentaje_sobre_ventas : '';
    newRow.innerHTML = `<input type="text" placeholder="Concepto" class="gasto-ventas-concepto text-sm" value="${concepto || ''}"><input type="number" placeholder="% de ventas" class="gasto-ventas-pct text-sm" step="any" onchange="calcularGastosOperacion()" value="${porcentaje || ''}">`;
    container.appendChild(newRow);
}

// Campos nuevos que se guardan juntos en la columna parametros_extra (JSON)
const CAMPOS_EXTRA = [
    'usos-mensuales', 'dias-inventario', 'dias-laborables', 'inflacion-mp',
    'tiempo-unidad-tipo', 'horas-jornada', 'incremento-salarial', 'pct-carga-social',
    'tasa-isr', 'tasa-ptu', 'pct-financiamiento', 'tasa-interes', 'plazo-credito',
    'tasa-ke', 'inv-inicial-pt', 'inv-capital-trabajo', 'metodo-vpn'
];

function recolectarParametrosExtra() {
    const extra = {};
    CAMPOS_EXTRA.forEach(id => {
        const el = document.getElementById(id);
        if (el) extra[id] = el.value;
    });
    extra['redondear-precio'] = document.getElementById('redondear-precio')?.checked || false;
    extra.productos = [];
    document.querySelectorAll('#productos-container .producto-item').forEach(fila => {
        const nombre = fila.querySelector('.prod-nombre').value;
        const unidades = fila.querySelector('.prod-unidades').value;
        if (nombre && unidades) {
            extra.productos.push({ nombre, unidades, precio: fila.querySelector('.prod-precio').value, costo: fila.querySelector('.prod-costo').value });
        }
    });
    extra.tipos_gasto_admin = [];
    document.querySelectorAll('#gastos-admin-container .gasto-admin-item').forEach(fila => {
        const concepto = fila.querySelector('.gasto-admin-concepto').value;
        const monto = fila.querySelector('.gasto-admin-monto').value;
        if (concepto && monto) extra.tipos_gasto_admin.push(fila.querySelector('.gasto-admin-tipo').value);
    });
    return extra;
}

function aplicarParametrosExtra(extra) {
    if (!extra) return;
    if (typeof extra === 'string') {
        try { extra = JSON.parse(extra); } catch (e) { return; }
    }
    CAMPOS_EXTRA.forEach(id => {
        const el = document.getElementById(id);
        if (el && extra[id] !== undefined && extra[id] !== null) el.value = extra[id];
    });
    const chk = document.getElementById('redondear-precio');
    if (chk) chk.checked = !!extra['redondear-precio'];
    const cont = document.getElementById('productos-container');
    if (cont) {
        cont.innerHTML = '';
        (extra.productos || []).forEach(p => agregarProducto(p));
        if (!cont.children.length) agregarProducto();
    }
}

// ===========================
// FUNCIONES DE GUARDADO/CARGADO/EXPORT
// ===========================
function nuevoProyecto() {
    // Limpia el ID y el nombre del proyecto
    document.getElementById('id_proyecto_actual').value = '';
    document.getElementById('nombre_proyecto').value = '';

    // Limpia todos los demás campos de texto y número del formulario
    const formulario = document.querySelector('main');
    const inputs = formulario.querySelectorAll('input[type="number"], input[type="text"]');
    inputs.forEach(input => {
        if (input.id !== 'nombre_proyecto' && input.id !== 'id_proyecto_actual') {
            input.value = '';
        }
    });

    // Limpia los contenedores de las listas dinámicas
    document.getElementById('inversiones-container').innerHTML = '';
    document.getElementById('receta-container').innerHTML = '';
    document.getElementById('costos-mp-container').innerHTML = '';
    document.getElementById('gastos-admin-container').innerHTML = '';
    document.getElementById('gastos-ventas-container').innerHTML = '';
    document.getElementById('gastos-fijos-container').innerHTML = '';
    document.getElementById('gastos-variables-container').innerHTML = '';
    document.getElementById('productos-container').innerHTML = '';
    const metodoVpn = document.getElementById('metodo-vpn');
    if (metodoVpn) metodoVpn.value = 'proyecto';
    _firmaMP = null;
    const chkPrecio = document.getElementById('redondear-precio');
    if (chkPrecio) chkPrecio.checked = false;
    const tipoTiempo = document.getElementById('tiempo-unidad-tipo');
    if (tipoTiempo) tipoTiempo.value = 'hr';

    // Recalcula todo para limpiar los resultados
    Object.keys(globalData).forEach(k => {
        if (Array.isArray(globalData[k])) {
            globalData[k] = [];
        } else if (typeof globalData[k] === 'object' && globalData[k] !== null) {
            globalData[k] = {}; // O un valor default apropiado
        } else {
            globalData[k] = 0;
        }
    });

    // Agrega una fila vacía a las listas dinámicas
    agregarInversion();
    agregarMateriaPrima();
    agregarGastoAdmin();
    agregarGastoVentas();
    agregarGastoFijo();
    agregarGastoVariable();
    agregarProducto();

    // Llama a las funciones principales para limpiar los paneles de resultados
    recalcularTodo();

    console.log('Formulario limpiado.');
}

function guardarProyecto() {
    console.log("Iniciando el proceso de guardado...");

    const btnGuardar = document.getElementById('btn-guardar');
    if (btnGuardar) {
        btnGuardar.disabled = true;
        btnGuardar.textContent = '⏳ Guardando...';
    }

    // PARTE 1: Recolecta todos los campos de texto principales
    const datosDelProyecto = {
        id_proyecto: document.getElementById('id_proyecto_actual').value,
        nombre_proyecto: document.getElementById('nombre_proyecto').value || "Proyecto sin nombre",
        poblacion_total: document.getElementById('poblacion-total').value,
        pct_mujeres: document.getElementById('porcentaje-mujeres').value,
        pct_rango_edad: document.getElementById('rango-edad').value,
        pct_poblacion_ocupada: document.getElementById('poblacion-ocupada').value,
        pct_concentracion_mercado: document.getElementById('concentracion-mercado').value,
        participacion_mercado: document.getElementById('participacion-mercado').value,
        incremento_poblacion: document.getElementById('incremento-poblacion').value,
        incremento_producto: document.getElementById('incremento-producto').value,
        penetracion_inicial: document.getElementById('penetracion-inicial').value,
        incremento_penetracion: document.getElementById('incremento-penetracion').value,
        precio_unitario_base: document.getElementById('precio-unitario-base').value,
        incremento_precio: document.getElementById('incremento-precio').value,
        unidades_venta_a1: document.getElementById('unidades-1').value,
        unidades_venta_a2: document.getElementById('unidades-2').value,
        unidades_venta_a3: document.getElementById('unidades-3').value,
        unidades_venta_a4: document.getElementById('unidades-4').value,
        unidades_venta_a5: document.getElementById('unidades-5').value,
        dias_credito_ventas: document.getElementById('dias-credito-ventas').value,
        dias_credito_compras: document.getElementById('dias-credito-compras').value,
        descuento_pronto_pago: document.getElementById('descuento-pronto-pago').value,
        inv_inicial_prod: document.getElementById('inv-inicial-prod').value,
        inv_final_a1: document.getElementById('inv-final-1').value,
        inv_final_a2: document.getElementById('inv-final-2').value,
        inv_final_a3: document.getElementById('inv-final-3').value,
        inv_final_a4: document.getElementById('inv-final-4').value,
        inv_final_a5: document.getElementById('inv-final-5').value,
        inv_inicial_mp: document.getElementById('inv-inicial-mp').value,
        inv_final_mp_pct: document.getElementById('inv-final-mp-pct').value,
        tiempo_unidad_mo: document.getElementById('tiempo-unidad').value,
        costo_hora_mo: document.getElementById('costo-hora').value,
        inversion_inicial: document.getElementById('inversion-inicial').value,
        saldo_inicial: document.getElementById('saldo-inicial').value,
        inflacion_anual: document.getElementById('inflacion-anual').value,
        // Campos nuevos (crédito, ISR/PTU, WACC, etc.) van juntos en una columna JSON
        parametros_extra: JSON.stringify(recolectarParametrosExtra())
    };

    // PARTE 2: Recolecta todas las listas dinámicas
    const inversiones = [];
    document.querySelectorAll('#inversiones-container .inversion-item').forEach(fila => {
        const nombre = fila.querySelector('.inv-nombre').value;
        const monto = fila.querySelector('.inv-monto').value;
        const vida = fila.querySelector('.inv-vida').value;
        const tipo = fila.querySelector('.inv-tipo').value;
        if (nombre && monto && vida) {
            inversiones.push({ nombre, monto, vida_util: vida, tipo });
        }
    });
    datosDelProyecto.inversiones = inversiones;

    const materiasPrimas = [];
    const filasMP = document.querySelectorAll('#receta-container .mp-item');
    const costosMP = document.querySelectorAll('#costos-mp-container .costo-mp-item');

    filasMP.forEach((fila, index) => {
        const nombre = fila.querySelector('.receta-mp').value;
        const cantidad = fila.querySelector('.receta-cant').value;
        const unidad = fila.querySelector('.receta-unidad').value;

        let costo = 0;
        if (costosMP[index]) {
            costo = costosMP[index].querySelector('.costo-mp').value;
        }

        if (nombre && cantidad) {
            materiasPrimas.push({ nombre, cantidad, unidad, costo_unitario: costo });
        }
    });
    datosDelProyecto.materias_primas = materiasPrimas;

    const gastosAdmin = [];
    document.querySelectorAll('#gastos-admin-container .gasto-admin-item').forEach(fila => {
        const concepto = fila.querySelector('.gasto-admin-concepto').value;
        const monto = fila.querySelector('.gasto-admin-monto').value;
        if (concepto && monto) {
            gastosAdmin.push({ concepto, monto_mensual: monto });
        }
    });
    datosDelProyecto.gastos_admin = gastosAdmin;

    const gastosVentas = [];
    document.querySelectorAll('#gastos-ventas-container .gasto-ventas-item').forEach(fila => {
        const concepto = fila.querySelector('.gasto-ventas-concepto').value;
        const porcentaje = fila.querySelector('.gasto-ventas-pct').value;
        if (concepto && porcentaje) {
            gastosVentas.push({ concepto, porcentaje_sobre_ventas: porcentaje });
        }
    });
    datosDelProyecto.gastos_ventas = gastosVentas;

    // --- RECOLECCIÓN DE GASTOS INDIRECTOS ---
    const gastosFijos = [];
    document.querySelectorAll('#gastos-fijos-container .gasto-fijo-item').forEach(fila => {
        const concepto = fila.querySelector('.gasto-fijo-concepto').value;
        const monto = fila.querySelector('.gasto-fijo-monto').value;
        if (concepto && monto) {
            gastosFijos.push({ concepto, monto_anual: monto });
        }
    });
    datosDelProyecto.gastos_fijos = gastosFijos;

    const gastosVariables = [];
    document.querySelectorAll('#gastos-variables-container .gasto-var-item').forEach(fila => {
        const concepto = fila.querySelector('.gasto-var-concepto').value;
        const porUnidad = fila.querySelector('.gasto-var-unidad').value;
        const unidad = fila.querySelector('.gasto-var-tipo').value;
        if (concepto && porUnidad) {
            gastosVariables.push({ concepto, por_unidad: porUnidad, unidad });
        }
    });
    datosDelProyecto.gastos_variables = gastosVariables;

    console.log("Datos que se enviarán al servidor:", datosDelProyecto);

    // PARTE 3: Envía todo al backend
    fetch('/api/guardar_proyecto.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(datosDelProyecto)
    })
        .then(response => {
            if (manejarSesionExpirada(response)) {
                return Promise.reject(new Error('Sesión no iniciada'));
            }
            if (!response.ok) {
                // Si la respuesta no es OK (ej: error 500), lanza un error
                throw new Error(`Error del servidor: ${response.status}`);
            }
            return response.json(); // Intenta decodificar JSON
        })
        .then(data => {
            console.log('Respuesta del servidor:', data);
            if (data.status === 'success' && data.id_proyecto) {
                document.getElementById('id_proyecto_actual').value = data.id_proyecto;
            }
            mostrarToast(data.message || 'Acción completada', data.status === 'error' ? 'error' : 'success');
            cargarListaDeProyectos(); // Recarga la lista
        })
        .catch(error => {
            if (error.message === 'Sesión no iniciada') return;
            console.error('Error al intentar guardar:', error);
            mostrarToast('Hubo un error al guardar. Revisa la consola.', 'error');
        })
        .finally(() => {
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.textContent = '💾 Guardar';
            }
        });
}

function cargarListaDeProyectos() {
    fetch('/api/cargar_proyectos.php', {
        credentials: 'include',
        headers: { 'ngrok-skip-browser-warning': 'true' }
    })
        .then(response => {
            if (manejarSesionExpirada(response)) {
                return Promise.reject(new Error('Sesión no iniciada'));
            }
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }
            return response.json();
        })
        .then(proyectos => {
            const lista = document.getElementById('lista-proyectos');
            lista.innerHTML = ''; // Limpiar la lista

            if (proyectos.length === 0) {
                lista.innerHTML = '<li class="text-gray-500 text-sm italic">No hay proyectos guardados.</li>';
            } else {
                proyectos.forEach(proyecto => {
                    // Creamos un elemento de lista con diseño flex (nombre a la izq, botón a la der)
                    lista.innerHTML += `
                        <li class="flex justify-start items-center gap-3 p-2 border-b hover:bg-gray-50 transition-colors">
                            <a href="#" class="text-blue-600 hover:underline text-sm font-medium truncate mr-2" onclick="cargarProyecto(${proyecto.id_proyecto}); return false;">
                                ${proyecto.nombre_proyecto}
                            </a>
                            <button onclick="borrarProyecto(${proyecto.id_proyecto})" class="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-100 transition-colors" title="Eliminar Proyecto">
                                🗑️
                            </button>
                        </li>
                    `;
                });
            }
        })
        .catch(error => {
            if (error.message === 'Sesión no iniciada') return;
            console.error('Error al cargar la lista de proyectos:', error);
            document.getElementById('lista-proyectos').innerHTML = '<li class="text-red-500">Error al cargar proyectos.</li>';
        });
}

function cargarProyecto(id) {
    console.log(`Cargando datos para el proyecto con ID: ${id}`);
    fetch(`/api/obtener_proyecto.php?id=${id}`, {
        credentials: 'include',
        headers: { 'ngrok-skip-browser-warning': 'true' }
    })
        .then(response => {
            if (manejarSesionExpirada(response)) {
                return Promise.reject(new Error('Sesión no iniciada'));
            }
            if (!response.ok) { throw new Error(`Error del servidor: ${response.status}`); }
            return response.json();
        })
        .then(datos => {
            if (datos.error) {
                throw new Error(datos.error);
            }

            // Limpia completamente el formulario antes de llenarlo
            nuevoProyecto();

            // === RELLENAR TODOS LOS CAMPOS PRINCIPALES ===
            document.getElementById('id_proyecto_actual').value = datos.id_proyecto;
            document.getElementById('nombre_proyecto').value = datos.nombre_proyecto;

            // Pestaña 1
            document.getElementById('poblacion-total').value = datos.poblacion_total;
            document.getElementById('porcentaje-mujeres').value = datos.pct_mujeres;
            document.getElementById('rango-edad').value = datos.pct_rango_edad;
            document.getElementById('poblacion-ocupada').value = datos.pct_poblacion_ocupada;
            document.getElementById('concentracion-mercado').value = datos.pct_concentracion_mercado;

            // Pestaña 2
            document.getElementById('participacion-mercado').value = datos.participacion_mercado;
            document.getElementById('incremento-poblacion').value = datos.incremento_poblacion;
            document.getElementById('incremento-producto').value = datos.incremento_producto;
            document.getElementById('penetracion-inicial').value = datos.penetracion_inicial;
            document.getElementById('incremento-penetracion').value = datos.incremento_penetracion;

            // Pestaña 3
            document.getElementById('precio-unitario-base').value = datos.precio_unitario_base;
            document.getElementById('incremento-precio').value = datos.incremento_precio;
            document.getElementById('unidades-1').value = datos.unidades_venta_a1;
            document.getElementById('unidades-2').value = datos.unidades_venta_a2;
            document.getElementById('unidades-3').value = datos.unidades_venta_a3;
            document.getElementById('unidades-4').value = datos.unidades_venta_a4;
            document.getElementById('unidades-5').value = datos.unidades_venta_a5;

            // Pestaña 4
            document.getElementById('dias-credito-ventas').value = datos.dias_credito_ventas;
            document.getElementById('dias-credito-compras').value = datos.dias_credito_compras;
            document.getElementById('descuento-pronto-pago').value = datos.descuento_pronto_pago;

            // Pestaña 6
            document.getElementById('inv-inicial-prod').value = datos.inv_inicial_prod;
            document.getElementById('inv-final-1').value = datos.inv_final_a1;
            document.getElementById('inv-final-2').value = datos.inv_final_a2;
            document.getElementById('inv-final-3').value = datos.inv_final_a3;
            document.getElementById('inv-final-4').value = datos.inv_final_a4;
            document.getElementById('inv-final-5').value = datos.inv_final_a5;

            // Pestaña 8
            document.getElementById('inv-inicial-mp').value = datos.inv_inicial_mp;
            document.getElementById('inv-final-mp-pct').value = datos.inv_final_mp_pct;

            // Pestaña 10
            document.getElementById('tiempo-unidad').value = datos.tiempo_unidad_mo;
            document.getElementById('costo-hora').value = datos.costo_hora_mo;
            document.getElementById('inversion-inicial').value = datos.inversion_inicial;
            document.getElementById('saldo-inicial').value = datos.saldo_inicial;
            document.getElementById('inflacion-anual').value = datos.inflacion_anual;

            // Campos nuevos guardados en JSON
            let extra = {};
            try { extra = typeof datos.parametros_extra === 'string' ? JSON.parse(datos.parametros_extra) : (datos.parametros_extra || {}); } catch (e) { extra = {}; }
            aplicarParametrosExtra(extra);

            // === RELLENAR TODAS LAS LISTAS DINÁMICAS ===
            document.getElementById('inversiones-container').innerHTML = ''; // Limpia el default
            if (datos.inversiones && datos.inversiones.length > 0) {
                datos.inversiones.forEach(inversion => agregarInversion(inversion));
            } else {
                agregarInversion(); // Agrega una fila vacía si no hay datos
            }

            document.getElementById('receta-container').innerHTML = ''; // Limpia el default
            if (datos.materias_primas && datos.materias_primas.length > 0) {
                datos.materias_primas.forEach(mp => agregarMateriaPrima(mp));
            } else {
                agregarMateriaPrima(); // Agrega una fila vacía
            }

            document.getElementById('gastos-admin-container').innerHTML = ''; // Limpia el default
            if (datos.gastos_admin && datos.gastos_admin.length > 0) {
                const tipos = extra.tipos_gasto_admin || [];
                datos.gastos_admin.forEach((gasto, idx) => agregarGastoAdmin({ ...gasto, tipo: tipos[idx] }));
            } else {
                agregarGastoAdmin(); // Agrega una fila vacía
            }

            document.getElementById('gastos-ventas-container').innerHTML = ''; // Limpia el default
            if (datos.gastos_ventas && datos.gastos_ventas.length > 0) {
                datos.gastos_ventas.forEach(gasto => agregarGastoVentas(gasto));
            } else {
                agregarGastoVentas(); // Agrega una fila vacía
            }

            // --- CORRECCIÓN: CARGAR GASTOS INDIRECTOS ---
            document.getElementById('gastos-fijos-container').innerHTML = '';
            if (datos.gastos_fijos && datos.gastos_fijos.length > 0) {
                datos.gastos_fijos.forEach(gasto => agregarGastoFijo(gasto));
            } else {
                agregarGastoFijo();
            }

            document.getElementById('gastos-variables-container').innerHTML = '';
            if (datos.gastos_variables && datos.gastos_variables.length > 0) {
                datos.gastos_variables.forEach(gasto => agregarGastoVariable(gasto));
            } else {
                agregarGastoVariable();
            }

            // ======================================================
            // === ¡LA SOLUCIÓN! RECALCULAR TODO DESPUÉS DE CARGAR ===
            // ======================================================

            // Recalcula todo con los datos cargados (incluye los costos de MP guardados)
            _firmaMP = null;
            actualizarCostosMP(datos.materias_primas);

            verificarCompletitudSecciones();
            mostrarToast(`Proyecto "${datos.nombre_proyecto}" cargado correctamente.`, 'success');
        })
        .catch(error => {
            if (error.message === 'Sesión no iniciada') return;
            console.error('Error al cargar el proyecto:', error);
            mostrarToast('No se pudo cargar la información del proyecto.', 'error');
        });
}
// Función para eliminar un proyecto
async function borrarProyecto(id) {
    // 1. Confirmación de seguridad (modal propio en vez del confirm() nativo del navegador)
    const confirmado = await mostrarConfirmacion('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.');
    if (!confirmado) {
        return;
    }

    // 2. Llamada a la API
    fetch('/api/borrar_proyecto.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ id })
    })
        .then(response => {
            if (manejarSesionExpirada(response)) {
                return Promise.reject(new Error('Sesión no iniciada'));
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                mostrarToast('Proyecto eliminado correctamente.', 'success');

                // Si el proyecto borrado es el que teníamos abierto, limpiamos la pantalla
                const idActual = document.getElementById('id_proyecto_actual').value;
                if (idActual == id) {
                    nuevoProyecto();
                }

                // Recargamos la lista para que desaparezca
                cargarListaDeProyectos();
            } else {
                mostrarToast('Error al eliminar: ' + (data.message || 'Desconocido'), 'error');
            }
        })
        .catch(error => {
            if (error.message === 'Sesión no iniciada') return;
            console.error('Error:', error);
            mostrarToast('Error de conexión al intentar borrar.', 'error');
        });
}

// ===========================
// INICIALIZACIÓN (ÚNICA)
// ===========================
document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'p':
                e.preventDefault();
                imprimirReporte();
                break;
            case 's':
                e.preventDefault();
                guardarProyecto(); // Cambiado de exportarDatos a guardarProyecto
                break;
        }
    }
});

window.addEventListener('resize', checkMobile);

document.addEventListener('DOMContentLoaded', function () {
    checkMobile();
    verificarSesion(); // Muestra login o carga los proyectos del usuario, según corresponda

    // Agrega listeners a los inputs de Mercado Meta para que calculen al cargar la página si tienen valores
    document.getElementById('poblacion-total').addEventListener('change', calcularPlan);
    document.getElementById('porcentaje-mujeres').addEventListener('change', calcularPlan);
    document.getElementById('rango-edad').addEventListener('change', calcularPlan);
    document.getElementById('poblacion-ocupada').addEventListener('change', calcularPlan);
    document.getElementById('concentracion-mercado').addEventListener('change', calcularPlan);

    ['inversiones-container', 'receta-container', 'gastos-admin-container', 'gastos-ventas-container', 'gastos-fijos-container', 'gastos-variables-container', 'productos-container']
        .forEach(id => { const c = document.getElementById(id); if (c) c.innerHTML = ''; });
    agregarInversion();
    agregarMateriaPrima();
    agregarGastoAdmin();
    agregarGastoVentas();
    agregarGastoFijo();
    agregarGastoVariable();
    agregarProducto();
    recalcularTodo();

    console.log('Sistema de Análisis Financiero v3.0 FINAL Cargado y Limpio');
});

// ===========================
// WEBSOCKET - TIPO DE CAMBIO
// ===========================

function iniciarSocket() {
    if (conn) conn.close();
    // Antes: 'ws://localhost:8081' fijo, que solo funciona si front y back
    // corren en la misma máquina. Ahora se arma con el host real donde esté
    // cargada la página (funciona igual en localhost, en la IP de Oracle,
    // o detrás de un dominio si más adelante se agrega HTTPS/wss).
    // Puerto 8083: es el puerto del HOST mapeado en docker-compose.yml hacia
    // el 8081 interno del contenedor (remapeado para convivir con el otro
    // proyecto en la misma instancia de Oracle).
    const wsProtocolo = location.protocol === 'https:' ? 'wss://' : 'ws://';
    conn = new WebSocket(wsProtocolo + location.hostname + ':8083');

    conn.onopen = function (e) {
        console.log("✅ Conexión establecida con el Socket!");
        const status = document.getElementById('status-socket');
        if (status) status.className = "w-3 h-3 bg-green-500 rounded-full";
        pedirTipoCambio();
    };

    conn.onmessage = function (e) {
        const datos = JSON.parse(e.data);

        if (datos.tipo === 'tipo_cambio_actualizado') {
            console.log("💰 Cambio recibido:", datos);
            const tasaNueva = parseFloat(datos.valor);

            // 1. LÓGICA DE CONVERSIÓN DE MONEDA (YA LA TENÍAS)
            if (conversionPendiente) {
                const factor = tasaActualVsMXN / tasaNueva;
                realizarConversion(factor);
                conversionPendiente = false;
                mostrarToast(`Valores convertidos a ${datos.moneda_base}.`, 'success');
            }

            tasaActualVsMXN = tasaNueva;

            // 2. ACTUALIZAR WIDGET DE PRECIO (YA LO TENÍAS)
            const precioFmt = tasaNueva.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
            const label = document.getElementById('label-moneda');
            if (label) label.innerText = `1 ${datos.moneda_base}`;
            const valor = document.getElementById('valor-dolar');
            if (valor) valor.innerText = `${precioFmt} MXN (Act: ${datos.fecha})`;

            // (La inflación ya no se llena desde el servidor: la captura el usuario.)
        }
    };

    conn.onclose = function (e) {
        console.log("❌ Socket desconectado");
        const status = document.getElementById('status-socket');
        if (status) status.className = "w-3 h-3 bg-red-500 rounded-full";
    };
}

function pedirTipoCambio() {
    if (conn && conn.readyState === WebSocket.OPEN) {
        const mensaje = JSON.stringify({
            accion: 'pedir_tipo_cambio',
            moneda: monedaActual
        });
        conn.send(mensaje);
    } else {
        // Si no está conectado, intentamos reconectar
        iniciarSocket();
    }
}

// --- ESTA ES LA FUNCIÓN QUE FALTABA ---
function realizarConversion(factor) {
    // 1. Lista de TODOS los campos de dinero que deben cambiar
    const selectoresDinero = [
        '#precio-unitario-base',
        '#costo-hora',
        '#inversion-inicial',
        '#saldo-inicial',       // <--- ¡ESTE FALTABA!
        '.inv-monto',           // Montos de inversiones
        '.costo-mp',            // Costos materia prima
        '.gasto-fijo-monto',    // Gastos fijos
        '.gasto-var-unidad',    // Gastos variables
        '.gasto-admin-monto',   // Gastos administrativos
        '#inv-inicial-pt',      // Costo unitario del inventario inicial de PT
        '#inv-capital-trabajo', // Inventario de capital de trabajo
        '.prod-precio',         // Precios de productos
        '.prod-costo'           // Costos de productos
    ];

    // 2. Convertimos los valores matemáticamente
    selectoresDinero.forEach(selector => {
        document.querySelectorAll(selector).forEach(input => {
            const valorActual = parseFloat(input.value);
            if (!isNaN(valorActual)) {
                // Convertimos y limitamos a 2 decimales
                input.value = (valorActual * factor).toFixed(2);
            }
        });
    });

    // 3. Recalculamos todo con la nueva moneda
    recalcularTodo();
}
// ===========================
// FUNCIONES AUXILIARES (FALTANTES)
// ===========================

function exportarDatos() {
    const data = {
        timestamp: new Date().toISOString(),
        globalData: globalData,
        inputs: {}
    };

    document.querySelectorAll('input, select').forEach(input => {
        if (input.id || input.className) {
            const key = input.id || `${input.className}_${input.dataset.index || ''}`;
            data.inputs[key] = input.value;
        }
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analisis_financiero.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    mostrarToast('Datos exportados exitosamente', 'success');
}

function imprimirReporte() {
    window.print();
}

function checkMobile() {
    if (window.innerWidth < 768) {
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.add('text-xs', 'px-2', 'py-1');
            btn.classList.remove('px-3', 'py-2');
        });
    } else {
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.remove('text-xs', 'px-2', 'py-1');
            btn.classList.add('px-3', 'py-2');
        });
    }
}

// Inicialización de atajos de teclado
document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'p':
                e.preventDefault();
                imprimirReporte();
                break;
            case 's':
                e.preventDefault();
                exportarDatos();
                break;
        }
    }
});

window.addEventListener('resize', checkMobile);
// ===========================
// LÓGICA DE GRÁFICOS (CHART.JS)
// ===========================

let chartInstance1 = null;
let chartInstance2 = null;
let chartInstance3 = null;

function mostrarGraficos() {
    const modal = document.getElementById('modal-graficos');
    modal.style.display = 'flex';

    // Destruir gráficos anteriores si existen para evitar sobreescritura
    if (chartInstance1) chartInstance1.destroy();
    if (chartInstance2) chartInstance2.destroy();
    if (chartInstance3) chartInstance3.destroy();

    // 1. Gráfico de Barras: Ventas vs Costos
    const ctx1 = document.getElementById('graficoVentasCostos').getContext('2d');
    chartInstance1 = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Año 1', 'Año 2', 'Año 3', 'Año 4', 'Año 5'],
            datasets: [
                {
                    label: 'Ingresos',
                    data: globalData.ventasProyeccion,
                    backgroundColor: 'rgba(34, 197, 94, 0.6)', // Verde
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Costo Total',
                    data: globalData.costoVendido.map((c, i) => c + (globalData.gastosOperacion[i] || 0) + (globalData.depreciacion[i] || 0)),
                    backgroundColor: 'rgba(239, 68, 68, 0.6)', // Rojo
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    // 2. Gráfico de Línea: Flujo de Efectivo Acumulado
    // Calculamos el acumulado
    let acumulado = -(globalData.inversionTotal || 0);
    const datosFlujo = [];
    for (let i = 0; i < 5; i++) {
        acumulado += (globalData.flujoProyecto && globalData.flujoProyecto[i]) || 0;
        datosFlujo.push(acumulado);
    }

    const ctx2 = document.getElementById('graficoFlujo').getContext('2d');
    chartInstance2 = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: ['Inicio', 'Año 1', 'Año 2', 'Año 3', 'Año 4', 'Año 5'],
            datasets: [{
                label: 'Dinero en Caja (Acumulado)',
                // Agregamos el punto inicial negativo
                data: [-(globalData.inversionTotal || 0), ...datosFlujo],
                borderColor: '#6366f1', // Indigo
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 0,
                            yMax: 0,
                            borderColor: 'black',
                            borderWidth: 2,
                        }
                    }
                }
            }
        }
    });

    // 3. Gráfico de Pastel: Estructura de Costos (Año 1)
    const mp = (globalData.mpUtilizada && globalData.mpUtilizada[0]) || 0;
    const mo = globalData.costoMO[0] || 0;
    const ind = globalData.gastosIndirectos[0] || 0;
    const op = globalData.gastosOperacion[0] || 0;

    const ctx3 = document.getElementById('graficoPastel').getContext('2d');
    chartInstance3 = new Chart(ctx3, {
        type: 'doughnut',
        data: {
            labels: ['Materia Prima', 'Mano de Obra', 'Gastos Indirectos', 'Gastos Operación'],
            datasets: [{
                data: [mp, mo, ind, op],
                backgroundColor: [
                    '#3b82f6', // Azul
                    '#f59e0b', // Amarillo
                    '#10b981', // Verde
                    '#8b5cf6'  // Morado
                ]
            }]
        },
        options: { responsive: true }
    });
}