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
    fetch('https://de90-187-188-63-54.ngrok-free.app/api/sesion_actual.php', {
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

    fetch('https://de90-187-188-63-54.ngrok-free.app/api/login.php', {
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

    fetch('https://de90-187-188-63-54.ngrok-free.app/api/registro.php', {
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
    fetch('https://de90-187-188-63-54.ngrok-free.app/api/logout.php', {
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
        const campos = tab.querySelectorAll('input[type="number"], input[type="text"]:not([readonly])');
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
// 3. LÓGICA DE CÁLCULOS (PESTAÑAS)
// ===========================

// PESTAÑA 1: MERCADO META
function calcularPlan() {
    const poblacionTotal = parseFloat(document.getElementById('poblacion-total').value) || 0;
    const porcentajeMujeres = parseFloat(document.getElementById('porcentaje-mujeres').value) || 0;
    const rangoEdad = parseFloat(document.getElementById('rango-edad').value) || 0;
    const poblacionOcupada = parseFloat(document.getElementById('poblacion-ocupada').value) || 0;
    const concentracion = parseFloat(document.getElementById('concentracion-mercado').value) || 0;

    const mercadoMeta = poblacionTotal * (porcentajeMujeres / 100) * (rangoEdad / 100) * (poblacionOcupada / 100);
    const mercadoConcentrado = mercadoMeta * (concentracion / 100);

    globalData.mercadoMeta = mercadoMeta;
    globalData.porcentajeConcentracion = concentracion;

    document.getElementById('mercado-meta').textContent = Math.round(mercadoMeta).toLocaleString('es-MX');
    document.getElementById('mercado-concentrado').textContent = Math.round(mercadoConcentrado).toLocaleString('es-MX');
}

// PESTAÑA 2: PROYECCIÓN DE VENTAS
function calcularFactSensibil() {
    const participacionMercado = parseFloat(document.getElementById('participacion-mercado').value) || 0;
    const incrementoPoblacion = parseFloat(document.getElementById('incremento-poblacion').value) || 0;
    const incrementoProducto = parseFloat(document.getElementById('incremento-producto').value) || 0;
    const penetracionInicial = parseFloat(document.getElementById('penetracion-inicial').value) || 0;
    const incrementoPenetracion = parseFloat(document.getElementById('incremento-penetracion').value) || 0;

    const mercadoBase = globalData.mercadoMeta;

    if (mercadoBase === 0 && (participacionMercado > 0 || penetracionInicial > 0)) {
        document.getElementById('proyeccion-mercado').innerHTML = '<p class="text-ink-400 italic">Completa la sección de Mercado Meta para ver la proyección aquí.</p>';
        return;
    }

    globalData.incrementoUnidades = incrementoProducto;

    let html = '<div class="space-y-2">';
    let mercadoPotencial = mercadoBase * (participacionMercado / 100);
    let penetracion = penetracionInicial;

    for (let i = 1; i <= 5; i++) {
        if (i > 1) {
            mercadoPotencial *= (1 + (incrementoPoblacion + incrementoProducto) / 100);
            penetracion += incrementoPenetracion;
        }
        const clientesPotenciales = Math.round(mercadoPotencial * (penetracion / 100));
        globalData.penetracionMercado[i - 1] = penetracion;
        html += `<div class="flex justify-between border-b pb-1"><span class="font-medium">Año ${i}:</span><span class="text-indigo-600 font-semibold">${clientesPotenciales.toLocaleString('es-MX')} personas (${penetracion.toFixed(1)}% penetración)</span></div>`;
    }
    html += '</div>';
    document.getElementById('proyeccion-mercado').innerHTML = html;
}

// PESTAÑA 3: INGRESOS
function calcularPptoVtas() {
    const precioBase = parseFloat(document.getElementById('precio-unitario-base').value) || 0;
    const incrementoPrecio = parseFloat(document.getElementById('incremento-precio').value) || 0;
    let html = '<div class="space-y-2">';

    for (let i = 1; i <= 5; i++) {
        const precio = precioBase * Math.pow(1 + incrementoPrecio / 100, i - 1);
        globalData.precioUnitario[i - 1] = precio;
        const unidades = parseFloat(document.getElementById(`unidades-${i}`).value) || 0;
        globalData.unidadesVenta[i - 1] = unidades;
        const ventasAnuales = unidades * precio;
        globalData.ventasProyeccion[i - 1] = ventasAnuales;
        // Usa formato de moneda dinámico
        html += `<div class="flex justify-between border-b pb-1"><span class="font-medium">Año ${i}: ${unidades.toLocaleString('es-MX')} × ${precio.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</span><span class="text-green-600 font-semibold">${ventasAnuales.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</span></div>`;
    }
    html += '</div>';
    document.getElementById('ventas-proyeccion').innerHTML = html;
    calcularPptoProd();
    calcularGastosOperacion();
    calcularCondicionesComerciales();
}

// PESTAÑA 4: CONDICIONES
function calcularCondicionesComerciales() {
    const diasCreditoVentas = parseFloat(document.getElementById('dias-credito-ventas').value) || 0;
    const diasCreditoCompras = parseFloat(document.getElementById('dias-credito-compras').value) || 0;
    const descuento = parseFloat(document.getElementById('descuento-pronto-pago').value) || 0;

    globalData.diasCredito.ventas = diasCreditoVentas;
    globalData.diasCredito.compras = diasCreditoCompras;
    globalData.descuentoProntoPago = descuento;

    let html = '<div class="space-y-3">';
    for (let año = 0; año < 5; año++) {
        const ventasAnuales = globalData.ventasProyeccion[año] || 0;
        const comprasAnuales = globalData.comprasMP[año] || 0;
        const cuentasPorCobrar = ventasAnuales * (diasCreditoVentas / 360);
        const cuentasPorPagar = comprasAnuales * (diasCreditoCompras / 360);
        const descuentoObtenido = comprasAnuales * (descuento / 100);

        const cxc = cuentasPorCobrar.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
        const cxp = cuentasPorPagar.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
        const desc = descuentoObtenido.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });

        html += `<div class="border-b pb-2"><div class="font-semibold">Año ${año + 1}</div><div class="text-sm text-gray-600">Cuentas por Cobrar: ${cxc}</div><div class="text-sm text-gray-600">Cuentas por Pagar: ${cxp}</div><div class="text-sm text-green-600">Descuento obtenido: ${desc}</div></div>`;
    }
    html += '</div>';
    document.getElementById('condiciones-comerciales-resultado').innerHTML = html;
    calcularEstadoResultados();
}
// PESTAÑA 5: INVERSIONES
function agregarInversion(inversion = null) {
    const container = document.getElementById('inversiones-container');
    const newRow = document.createElement('div');
    newRow.className = 'inversion-item grid grid-cols-5 gap-2 mb-2 items-center';
    const nombre = inversion ? inversion.nombre_activo : '';
    const monto = inversion ? inversion.monto : '';
    const vida = inversion ? inversion.vida_util_anios : '';
    const tipo = inversion ? inversion.metodo_depreciacion : 'lineal';
    newRow.innerHTML = `<input type="text" placeholder="Nombre Activo" class="inv-nombre text-sm col-span-1" value="${nombre || ''}"><input type="number" placeholder="Monto" class="inv-monto text-sm col-span-1" step="0.01" value="${monto || ''}"><input type="number" placeholder="Vida útil" class="inv-vida text-sm col-span-1" value="${vida || ''}"><select class="inv-tipo text-sm col-span-1"><option value="lineal" ${tipo === 'lineal' ? 'selected' : ''}>Lineal</option><option value="acelerada" ${tipo === 'acelerada' ? 'selected' : ''}>Acelerada</option></select><button onclick="calcularInversiones()" class="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs col-span-1">Calcular</button>`;
    container.appendChild(newRow);
}

function calcularInversiones() {
    const nombres = document.querySelectorAll('.inv-nombre');
    const montos = document.querySelectorAll('.inv-monto');
    const vidas = document.querySelectorAll('.inv-vida');
    const tipos = document.querySelectorAll('.inv-tipo');
    globalData.inversionesActivo = [];
    globalData.depreciacion = [0, 0, 0, 0, 0];
    let html = '<div class="space-y-4">';

    for (let i = 0; i < nombres.length; i++) {
        const nombre = nombres[i].value.trim();
        const monto = parseFloat(montos[i].value) || 0;
        const vidaUtil = parseFloat(vidas[i].value) || 1;
        const tipo = tipos[i].value;

        if (nombre && monto > 0) {
            const inversion = { nombre, monto, vidaUtil, tipo, depreciacionAnual: [] };
            const montoFmt = monto.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });

            html += `<div class="border-b pb-3"><div class="font-semibold text-gray-700">${nombre} - ${montoFmt}</div>`;
            for (let año = 0; año < 5; año++) {
                let depreciacion = 0;
                if (tipo === 'lineal') {
                    depreciacion = año < vidaUtil ? monto / vidaUtil : 0;
                } else {
                    const factor = 2 / vidaUtil;
                    let valorLibros = monto;
                    for (let a = 0; a < año; a++) { valorLibros -= valorLibros * factor; }
                    depreciacion = (año < vidaUtil && valorLibros > 0) ? Math.min(valorLibros, valorLibros * factor) : 0;
                }
                inversion.depreciacionAnual[año] = depreciacion;
                globalData.depreciacion[año] += depreciacion;
                const depFmt = depreciacion.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
                html += `<div class="text-sm text-gray-600">Año ${año + 1}: ${depFmt}</div>`;
            }
            html += '</div>';
            globalData.inversionesActivo.push(inversion);
        }
    }
    html += '<div class="font-bold text-lg text-blue-600 mt-4">Depreciación Total por Año:</div>';
    for (let año = 0; año < 5; año++) {
        const depTotalFmt = globalData.depreciacion[año].toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
        html += `<div class="flex justify-between text-lg"><span>Año ${año + 1}:</span><span class="font-bold">${depTotalFmt}</span></div>`;
    }
    html += '</div>';
    document.getElementById('inversiones-resultado').innerHTML = html;
    calcularEstadoResultados();
}

// PESTAÑA 6: PRODUCCIÓN
function calcularPptoProd() {
    const invInicial = parseFloat(document.getElementById('inv-inicial-prod').value) || 0;
    let html = '<div class="space-y-2">';
    for (let i = 1; i <= 5; i++) {
        const ventasProyectadas = globalData.unidadesVenta[i - 1] || 0;
        const invFinal = parseFloat(document.getElementById(`inv-final-${i}`).value) || 0;
        const invInicialAnual = i === 1 ? invInicial : (parseFloat(document.getElementById(`inv-final-${i - 1}`).value) || 0);
        const produccionRequerida = ventasProyectadas + invFinal - invInicialAnual;
        globalData.unidadesProduccion[i - 1] = Math.max(0, produccionRequerida);
        html += `<div class="flex justify-between border-b pb-1"><span class="font-medium">Año ${i}:</span><span class="text-blue-600 font-semibold">${Math.max(0, produccionRequerida).toLocaleString('es-MX')} unidades</span></div>`;
    }
    html += '</div>';
    document.getElementById('produccion-proyeccion').innerHTML = html;
    calcularPptoMtp();
    calcularPptoMO();
}

// PESTAÑA 7: MATERIA PRIMA
function agregarMateriaPrima(mp = null) {
    const container = document.getElementById('receta-container');
    const newRow = document.createElement('div');
    newRow.className = 'mp-item grid grid-cols-3 gap-2 mb-2';
    const nombre = mp ? mp.nombre_mp : '';
    const cantidad = mp ? mp.cantidad_por_unidad_prod : '';
    const unidad = mp ? mp.unidad_medida : '';
    newRow.innerHTML = `<input type="text" placeholder="Materia Prima" class="receta-mp text-sm" onchange="calcularPptoMtp()" value="${nombre || ''}"><input type="number" placeholder="Cantidad por unidad" class="receta-cant text-sm" step="0.001" onchange="calcularPptoMtp()" value="${cantidad || ''}"><input type="text" placeholder="Unidad" class="receta-unidad text-sm" value="${unidad || ''}">`;
    container.appendChild(newRow);
}

function calcularPptoMtp() {
    const materiasPrimas = document.querySelectorAll('.receta-mp');
    const cantidades = document.querySelectorAll('.receta-cant');
    const unidades = document.querySelectorAll('.receta-unidad');
    globalData.materiaPrima = [];
    let html = '<div class="space-y-3">';
    for (let i = 0; i < materiasPrimas.length; i++) {
        const nombreMP = materiasPrimas[i].value.trim();
        const cantidadPorUnidad = parseFloat(cantidades[i].value) || 0;
        const unidad = unidades[i].value.trim();
        if (nombreMP && cantidadPorUnidad > 0) {
            const mpData = { nombre: nombreMP, cantidadPorUnidad, unidad: unidad || 'unidad', consumoAnual: [] };
            globalData.materiaPrima.push(mpData);
            html += `<div class="border-b pb-3"><div class="font-semibold text-gray-700 mb-1">${nombreMP}</div>`;
            for (let año = 0; año < 5; año++) {
                const consumoTotal = globalData.unidadesProduccion[año] * cantidadPorUnidad;
                mpData.consumoAnual[año] = consumoTotal;
                html += `<div class="text-sm text-gray-600">Año ${año + 1}: ${consumoTotal.toLocaleString('es-MX', { minimumFractionDigits: 3 })} ${unidad || 'unidad'}</div>`;
            }
            html += '</div>';
        }
    }
    html += '</div>';
    document.getElementById('consumo-mp').innerHTML = html;
    actualizarCostosMP();
    calcularComprasMP();
}

// PESTAÑA 8: COMPRAS MP
function actualizarCostosMP(materiasPrimasCargadas = null) {
    const container = document.getElementById('costos-mp-container');

    // Si no hay materias primas, mostramos mensaje y salimos
    if (globalData.materiaPrima.length === 0) {
        container.innerHTML = `
            <h4 class="font-semibold text-gray-700 mb-3">Costos Unitarios de Materia Prima</h4>
            <p class="text-sm text-gray-600">Configure primero las materias primas</p>
        `;
        calcularComprasMP();
        return;
    }

    let html = '<h4 class="font-semibold text-gray-700 mb-3">Costos Unitarios de Materia Prima</h4>';

    for (let i = 0; i < globalData.materiaPrima.length; i++) {
        const mp = globalData.materiaPrima[i];

        // --- CORRECCIÓN IMPORTANTE ---
        // Primero intentamos usar el valor que ya tenemos en memoria (globalData)
        // Si no existe, usamos 0.
        let costo = globalData.costoMP[i] || 0;

        // Solo si estamos cargando un proyecto guardado (materiasPrimasCargadas), sobrescribimos con ese dato
        if (materiasPrimasCargadas) {
            const mpCargada = materiasPrimasCargadas.find(m => m.nombre_mp === mp.nombre);
            if (mpCargada) {
                costo = mpCargada.costo_unitario;
            }
        }

        html += `
            <div class="costo-mp-item grid grid-cols-2 gap-2 mb-2">
                <span class="text-sm text-gray-700 py-2">${mp.nombre} (${mp.unidad})</span>
                <input type="number" class="costo-mp text-sm" data-index="${i}" placeholder="Costo por ${mp.unidad}" step="0.01" onchange="calcularComprasMP()" value="${costo || ''}">
            </div>
        `;
    }

    container.innerHTML = html;
    // Importante: No llamamos a calcularComprasMP() aquí para evitar bucles infinitos o re-cálculos prematuros
    // calcularComprasMP(); <--- Esta línea a veces causa problemas, mejor la quitamos de aquí o la dejamos al final si es necesario, pero con cuidado.
    // Para tu caso, dejémosla comentada o al final solo si es inicialización.
    // Mejor dejémosla activa pero sabiendo que ya tenemos el valor correcto en 'value'.
    calcularComprasMP();
}

function calcularComprasMP() {
    const costosMP = document.querySelectorAll('.costo-mp');
    globalData.costoMP = [];
    globalData.comprasMP = [0, 0, 0, 0, 0]; // Reiniciamos

    // Guardamos los costos unitarios
    for (let i = 0; i < costosMP.length; i++) {
        globalData.costoMP[i] = parseFloat(costosMP[i].value) || 0;
    }

    const invInicialMP = parseFloat(document.getElementById('inv-inicial-mp').value) || 0;
    const invFinalMPPct = parseFloat(document.getElementById('inv-final-mp-pct').value) || 10;

    let html = '<div class="space-y-4">';
    let totalCompras = [0, 0, 0, 0, 0];

    for (let mpIndex = 0; mpIndex < globalData.materiaPrima.length; mpIndex++) {
        const mp = globalData.materiaPrima[mpIndex];
        const costoUnitario = globalData.costoMP[mpIndex] || 0;

        if (costoUnitario > 0) {
            html += `<div class="border-b pb-3"><div class="font-semibold text-gray-700 mb-2">${mp.nombre}</div>`;

            for (let año = 0; año < 5; año++) {
                // 1. Lo que necesitamos consumir para producir
                const requerimiento = mp.consumoAnual[año] || 0;

                // 2. Lo que queremos que sobre al final (Inventario Final)
                const invFinalMP = requerimiento * (invFinalMPPct / 100);

                // 3. Lo que ya tenemos al principio (Inventario Inicial)
                let invInicialEsteAno = 0;
                if (año === 0) {
                    // Año 1: Usamos lo que pusiste en la casilla
                    invInicialEsteAno = invInicialMP;
                } else {
                    // Años 2-5: El inicial es lo que sobró del año pasado
                    // (Consumo Año Anterior * %)
                    const consumoAnterior = mp.consumoAnual[año - 1] || 0;
                    invInicialEsteAno = consumoAnterior * (invFinalMPPct / 100);
                }

                // 4. Fórmula: (Lo que necesito + Lo que quiero guardar) - Lo que ya tengo
                let comprasRequeridas = requerimiento + invFinalMP - invInicialEsteAno;

                // Si el resultado es negativo (tengo de sobra), no compro nada (0)
                comprasRequeridas = Math.max(0, comprasRequeridas);

                const costoCompras = comprasRequeridas * costoUnitario;

                // Sumamos al total anual
                totalCompras[año] += costoCompras;

                // Formato de moneda correcto
                const costoFmt = costoCompras.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });

                html += `<div class="text-sm text-gray-600">Año ${año + 1}: ${costoFmt}</div>`;
            }
            html += '</div>';
        }
    }

    html += '<div class="font-bold text-lg text-indigo-600 mt-4">Total de Compras por Año:</div>';
    for (let año = 0; año < 5; año++) {
        const totalFmt = totalCompras[año].toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
        html += `<div class="flex justify-between text-lg"><span>Año ${año + 1}:</span><span class="font-bold">${totalFmt}</span></div>`;
    }
    html += '</div>';

    globalData.comprasMP = totalCompras;
    document.getElementById('compras-mp-resultado').innerHTML = html;

    // Actualizamos las cadenas dependientes
    calcularCostoProduccion();
    calcularCondicionesComerciales();
}

// PESTAÑA 10: MANO DE OBRA
function calcularPptoMO() {
    const tiempoPorUnidad = parseFloat(document.getElementById('tiempo-unidad').value) || 0;
    const costoPorHora = parseFloat(document.getElementById('costo-hora').value) || 0;
    let html = '<div class="space-y-2">';
    for (let i = 0; i < 5; i++) {
        const unidadesProducir = globalData.unidadesProduccion[i] || 0;
        const horasRequeridas = unidadesProducir * tiempoPorUnidad;
        const costoMO = horasRequeridas * costoPorHora;
        globalData.costoMO[i] = costoMO;
        const costoFmt = costoMO.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
        html += `<div class="flex justify-between border-b pb-2"><div><div class="font-medium">Año ${i + 1}</div><div class="text-sm text-gray-600">${horasRequeridas.toLocaleString('es-MX', { minimumFractionDigits: 1 })} horas</div></div><div class="text-right"><div class="text-lg font-semibold text-blue-600">${costoFmt}</div></div></div>`;
    }
    html += '</div>';
    document.getElementById('costo-mo').innerHTML = html;
    calcularCostoProduccion();
}

// PESTAÑA 11: GASTOS INDIRECTOS
function agregarGastoFijo(gasto = null) {
    const container = document.getElementById('gastos-fijos-container');
    const newRow = document.createElement('div');
    newRow.className = 'gasto-fijo-item grid grid-cols-2 gap-2 mt-2';
    const concepto = gasto ? gasto.concepto : '';
    const monto = gasto ? gasto.monto_anual : '';
    newRow.innerHTML = `<input type="text" placeholder="Concepto" class="gasto-fijo-concepto text-sm" value="${concepto || ''}"><input type="number" placeholder="Monto anual" class="gasto-fijo-monto text-sm" step="0.01" onchange="calcularGastosIndirectos()" value="${monto || ''}">`;
    container.appendChild(newRow);
}

function agregarGastoVariable(gasto = null) {
    const container = document.getElementById('gastos-variables-container');
    const newRow = document.createElement('div');
    newRow.className = 'gasto-var-item grid grid-cols-3 gap-2 mt-2';
    const concepto = gasto ? gasto.concepto : '';
    const porUnidad = gasto ? gasto.por_unidad : '';
    const unidad = gasto ? gasto.unidad : '';
    newRow.innerHTML = `<input type="text" placeholder="Concepto" class="gasto-var-concepto text-sm" value="${concepto || ''}"><input type="number" placeholder="Por unidad" class="gasto-var-unidad text-sm" step="0.001" onchange="calcularGastosIndirectos()" value="${porUnidad || ''}"><input type="text" placeholder="Unidad" class="gasto-var-tipo text-sm" value="${unidad || ''}">`;
    container.appendChild(newRow);
}

function calcularGastosIndirectos() {
    const gastosFijos = document.querySelectorAll('.gasto-fijo-monto');
    const gastosVariables = document.querySelectorAll('.gasto-var-unidad');
    const inflacion = parseFloat(document.getElementById('inflacion-anual').value) || 0;
    let html = '<div class="space-y-3">';

    for (let año = 0; año < 5; año++) {
        let totalFijos = 0;
        gastosFijos.forEach(input => { totalFijos += (parseFloat(input.value) || 0) * Math.pow(1 + inflacion / 100, año); });
        let totalVariables = 0;
        gastosVariables.forEach(input => { totalVariables += (parseFloat(input.value) || 0) * (globalData.unidadesProduccion[año] || 0); });

        const totalGastosIndirectos = totalFijos + totalVariables;
        globalData.gastosIndirectos[año] = totalGastosIndirectos;

        const totalFmt = totalGastosIndirectos.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
        html += `<div class="flex justify-between border-b pb-2"><div><div class="font-medium">Año ${año + 1}</div><div class="text-xs text-gray-500">Fijos: ${totalFijos.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</div><div class="text-xs text-gray-500">Variables: ${totalVariables.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</div></div><div class="text-lg font-semibold text-purple-600">${totalFmt}</div></div>`;
    }
    html += '</div>';
    document.getElementById('gastos-indirectos-resultado').innerHTML = html;
    calcularCostoProduccion();
}

// PESTAÑA 12: COSTO VENDIDO
function calcularCostoProduccion() {
    let html = '<div class="space-y-2">';
    let htmlVendido = '<div class="space-y-2">';
    const invInicialPT = parseFloat(document.getElementById('inv-inicial-pt').value) || 0;
    for (let año = 0; año < 5; año++) {
        const costoMP = globalData.comprasMP[año] || 0;
        const costoMO = globalData.costoMO[año] || 0;
        const gastosInd = globalData.gastosIndirectos[año] || 0;
        const costoProduccionTotal = costoMP + costoMO + gastosInd;
        globalData.costoProduccion[año] = costoProduccionTotal;
        const unidadesProducidas = globalData.unidadesProduccion[año] || 0;
        const costoUnitario = unidadesProducidas > 0 ? costoProduccionTotal / unidadesProducidas : 0;
        globalData.costoUnitarioProduccion[año] = costoUnitario;
        if (año === 0) { document.getElementById('costo-unitario-pt').value = costoUnitario.toFixed(2); }
        const invFinalPT = parseFloat(document.getElementById(`inv-final-${año + 1}`).value) || 0;
        const invInicialPTAnual = año === 0 ? invInicialPT * costoUnitario : parseFloat(document.getElementById(`inv-final-${año}`).value) * costoUnitario;
        const costoVendido = invInicialPTAnual + costoProduccionTotal - (invFinalPT * costoUnitario);
        globalData.costoVendido[año] = Math.max(0, costoVendido);

        const prodFmt = costoProduccionTotal.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
        const vendFmt = globalData.costoVendido[año].toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });

        html += `<div class="flex justify-between border-b pb-2"><div><div class="font-medium">Año ${año + 1}</div><div class="text-xs text-gray-500">MP: ${costoMP.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</div><div class="text-xs text-gray-500">MO: ${costoMO.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</div><div class="text-xs text-gray-500">GI: ${gastosInd.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</div></div><div class="text-lg font-semibold text-green-600">${prodFmt}</div></div>`;
        htmlVendido += `<div class="flex justify-between border-b pb-2"><span class="font-medium">Año ${año + 1}</span><span class="text-lg font-semibold text-red-600">${vendFmt}</span></div>`;
    }
    html += '</div>';
    htmlVendido += '</div>';
    document.getElementById('costo-produccion-anual').innerHTML = html;
    document.getElementById('costo-vendido-anual').innerHTML = htmlVendido;
    calcularEstadoResultados();
    calcularValuacionInv();
}

// PESTAÑA 13: GASTOS OPERACIÓN
function agregarGastoAdmin(gasto = null) {
    const container = document.getElementById('gastos-admin-container');
    const newRow = document.createElement('div');
    newRow.className = 'gasto-admin-item grid grid-cols-2 gap-2 mb-2';
    const concepto = gasto ? gasto.concepto : '';
    const monto = gasto ? gasto.monto_mensual : '';
    newRow.innerHTML = `<input type="text" placeholder="Concepto" class="gasto-admin-concepto text-sm" value="${concepto || ''}"><input type="number" placeholder="Monto mensual" class="gasto-admin-monto text-sm" step="0.01" onchange="calcularGastosOperacion()" value="${monto || ''}">`;
    container.appendChild(newRow);
}

function agregarGastoVentas(gasto = null) {
    const container = document.getElementById('gastos-ventas-container');
    const newRow = document.createElement('div');
    newRow.className = 'gasto-ventas-item grid grid-cols-2 gap-2 mb-2';
    const concepto = gasto ? gasto.concepto : '';
    const porcentaje = gasto ? gasto.porcentaje_sobre_ventas : '';
    newRow.innerHTML = `<input type="text" placeholder="Concepto" class="gasto-ventas-concepto text-sm" value="${concepto || ''}"><input type="number" placeholder="% de ventas" class="gasto-ventas-pct text-sm" step="0.1" onchange="calcularGastosOperacion()" value="${porcentaje || ''}">`;
    container.appendChild(newRow);
}

function calcularGastosOperacion() {
    const gastosAdmin = document.querySelectorAll('.gasto-admin-monto');
    const gastosVentas = document.querySelectorAll('.gasto-ventas-pct');
    let html = '<div class="space-y-2">';
    for (let año = 0; año < 5; año++) {
        let totalAdmin = 0;
        gastosAdmin.forEach(input => { totalAdmin += (parseFloat(input.value) || 0) * 12; });
        let totalVentas = 0;
        const ventasAnuales = globalData.ventasProyeccion[año] || 0;
        gastosVentas.forEach(input => { totalVentas += ventasAnuales * (parseFloat(input.value) || 0) / 100; });
        const totalGastosOp = totalAdmin + totalVentas;
        globalData.gastosOperacion[año] = totalGastosOp;

        const totalOpFmt = totalGastosOp.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
        html += `<div class="flex justify-between border-b pb-2"><div><div class="font-medium">Año ${año + 1}</div><div class="text-xs text-gray-500">Admin: ${totalAdmin.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</div><div class="text-xs text-gray-500">Ventas: ${totalVentas.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</div></div><div class="text-lg font-semibold text-orange-600">${totalOpFmt}</div></div>`;
    }
    html += '</div>';
    document.getElementById('gastos-operacion-resultado').innerHTML = html;
    calcularEstadoResultados();
}

// PESTAÑA 9: VALUACIÓN INV.
function calcularValuacionInv() {
    const invFinalMPPct = parseFloat(document.getElementById('inv-final-mp-pct').value) || 10;
    let html_mp = '<div class="space-y-4" style="max-height: 400px; overflow-y: auto;">';
    let html_pt = '<div class="space-y-4">';
    let totalValuacionMP = [0, 0, 0, 0, 0];
    for (let mpIndex = 0; mpIndex < globalData.materiaPrima.length; mpIndex++) {
        const mp = globalData.materiaPrima[mpIndex];
        const costoUnitario = globalData.costoMP[mpIndex] || 0;
        html_mp += `<div class="border-b pb-3"><div class="font-semibold text-gray-700 mb-2">${mp.nombre}</div>`;
        for (let año = 0; año < 5; año++) {
            const requerimiento = mp.consumoAnual[año] || 0;
            const invFinalUnidades = requerimiento * (invFinalMPPct / 100);
            const valorInventario = invFinalUnidades * costoUnitario;
            totalValuacionMP[año] += valorInventario;

            const valFmt = valorInventario.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
            const costFmt = costoUnitario.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });

            html_mp += `<div class="text-sm text-gray-600">Año ${año + 1}: ${invFinalUnidades.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${mp.unidad} × ${costFmt} = ${valFmt}</div>`;
        }
        html_mp += '</div>';
    }
    html_mp += '<div class="font-bold text-lg text-indigo-600 mt-4">Total Valuación MP:</div>';
    for (let año = 0; año < 5; año++) {
        const totalFmt = totalValuacionMP[año].toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
        html_mp += `<div class="flex justify-between text-lg"><span>Año ${año + 1}:</span><span class="font-bold">${totalFmt}</span></div>`;
    }
    html_mp += '</div>';
    document.getElementById('valuacion-mp').innerHTML = html_mp;

    html_pt += '<div class="font-bold text-lg text-green-600 mt-4">Total Valuación PT:</div>';
    for (let año = 0; año < 5; año++) {
        const invFinalUnidades = parseFloat(document.getElementById(`inv-final-${año + 1}`).value) || 0;
        const costoUnitario = globalData.costoUnitarioProduccion[año] || 0;
        const valorInventario = invFinalUnidades * costoUnitario;

        const valFmt = valorInventario.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
        const costFmt = costoUnitario.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });

        html_pt += `<div class="flex justify-between text-lg border-b pb-2"><span>Año ${año + 1}:</span><span class="font-bold">${valFmt}</span></div>`;
        html_pt += `<div class="text-sm text-gray-600">${invFinalUnidades.toLocaleString('es-MX')} unidades × ${costFmt} c/u</div>`;
    }
    html_pt += '</div>';
    document.getElementById('valuacion-pt').innerHTML = html_pt;
}

// PESTAÑA 14: ESTADO DE RESULTADOS
function calcularEstadoResultados() {
    let html = '<div class="overflow-x-auto"><table class="min-w-full text-sm"><thead class="table-header"><tr><th class="px-3 py-2">Concepto</th>';
    for (let año = 1; año <= 5; año++) { html += `<th class="px-3 py-2">Año ${año}</th>`; }
    html += '</tr></thead><tbody>';

    html += '<tr class="table-row bg-green-50"><td class="px-3 py-2 font-bold">INGRESOS</td>';
    for (let año = 0; año < 5; año++) {
        const ingFmt = (globalData.ventasProyeccion[año] || 0).toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
        html += `<td class="px-3 py-2 font-semibold text-green-600">${ingFmt}</td>`;
    }
    html += '</tr>';

    html += '<tr class="table-row"><td class="px-3 py-2">(-) Costo de lo Vendido</td>';
    for (let año = 0; año < 5; año++) {
        const costFmt = (globalData.costoVendido[año] || 0).toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
        html += `<td class="px-3 py-2 text-red-600">${costFmt}</td>`;
    }
    html += '</tr>';

    html += '<tr class="table-row bg-blue-50"><td class="px-3 py-2 font-bold">UTILIDAD BRUTA</td>';
    let utilidadBruta = [];
    for (let año = 0; año < 5; año++) {
        const ub = (globalData.ventasProyeccion[año] || 0) - (globalData.costoVendido[año] || 0);
        utilidadBruta[año] = ub;
        const ubFmt = ub.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
        html += `<td class="px-3 py-2 font-semibold">${ubFmt}</td>`;
    }
    html += '</tr>';

    // ... (Resto de ERI simplificado con formato) ...
    // Gastos Operacion
    html += '<tr class="table-row"><td class="px-3 py-2">(-) Gastos de Operación</td>';
    for (let a = 0; a < 5; a++) {
        const gastoFmt = (globalData.gastosOperacion[a] || 0).toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
        html += `<td class="px-3 py-2 text-red-600">${gastoFmt}</td>`;
    }
    html += '</tr>';

    // Depreciacion
    html += '<tr class="table-row"><td class="px-3 py-2">(-) Depreciación</td>';
    for (let a = 0; a < 5; a++) {
        const depFmt = (globalData.depreciacion[a] || 0).toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });
        html += `<td class="px-3 py-2 text-red-600">${depFmt}</td>`;
    }
    html += '</tr>';

    // U. Operacion
    html += '<tr class="table-row bg-yellow-50"><td class="px-3 py-2 font-bold">UTILIDAD DE OPERACIÓN</td>';
    let utilidadOperacion = [];
    for (let a = 0; a < 5; a++) {
        const uo = utilidadBruta[a] - (globalData.gastosOperacion[a] || 0) - (globalData.depreciacion[a] || 0);
        utilidadOperacion[a] = uo;
        html += `<td class="px-3 py-2 font-semibold">${uo.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</td>`;
    }
    html += '</tr>';

    // ISR
    html += '<tr class="table-row"><td class="px-3 py-2">(-) ISR (30%)</td>';
    for (let a = 0; a < 5; a++) {
        const isr = Math.max(0, utilidadOperacion[a] * 0.30);
        html += `<td class="px-3 py-2 text-red-600">${isr.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</td>`;
    }
    html += '</tr>';

    // U. Neta
    html += '<tr class="table-row bg-green-100"><td class="px-3 py-2 font-bold">UTILIDAD NETA</td>';
    for (let a = 0; a < 5; a++) {
        const isr = Math.max(0, utilidadOperacion[a] * 0.30);
        const un = utilidadOperacion[a] - isr;
        globalData.utilidadNeta[a] = un;
        const colorClass = un >= 0 ? 'text-green-700' : 'text-red-700';
        html += `<td class="px-3 py-2 font-bold ${colorClass}">${un.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</td>`;
    }
    html += '</tr></tbody></table></div>';
    document.getElementById('estado-resultados').innerHTML = html;
    calcularEstadoSituacion();
}

// PESTAÑA 15: BALANCE
function calcularEstadoSituacion() {
    const inversionInicial = parseFloat(document.getElementById('inversion-inicial').value) || 0;
    let html = '<div class="overflow-x-auto"><table class="min-w-full text-sm"><thead class="table-header"><tr><th class="px-3 py-2">Concepto</th>';
    for (let año = 1; año <= 5; año++) { html += `<th class="px-3 py-2">Año ${año}</th>`; }
    html += '</tr></thead><tbody>';

    // Helper para celdas
    const row = (label, data) => {
        let r = `<tr class="table-row"><td class="px-3 py-2">${label}</td>`;
        data.forEach(v => r += `<td class="px-3 py-2">${v.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</td>`);
        return r + '</tr>';
    };

    // Calcular arrays
    const efectivo = globalData.utilidadNeta.map(u => u * 0.3);
    const cxc = globalData.ventasProyeccion.map(v => v * (globalData.diasCredito.ventas / 360));

    const activoFijo = [];
    let totalInversion = globalData.inversionesActivo.reduce((s, i) => s + i.monto, 0);
    let depAcum = 0;
    for (let a = 0; a < 5; a++) {
        depAcum += (globalData.depreciacion[a] || 0);
        activoFijo.push(Math.max(0, totalInversion - depAcum));
    }

    const cxp = globalData.comprasMP.map(c => c * (globalData.diasCredito.compras / 360));
    const capSocial = Array(5).fill(inversionInicial);

    let utilAcum = 0;
    const utilRetenida = [];
    for (let a = 0; a < 5; a++) {
        utilAcum += (globalData.utilidadNeta[a] || 0);
        utilRetenida.push(utilAcum);
    }

    html += '<tr class="bg-blue-100"><td colspan="6" class="px-3 py-2 font-bold">ACTIVOS</td></tr>';
    html += row('Efectivo', efectivo);
    html += row('Cuentas por Cobrar', cxc);
    html += row('Activo Fijo Neto', activoFijo);

    html += '<tr class="bg-red-100"><td colspan="6" class="px-3 py-2 font-bold">PASIVOS</td></tr>';
    html += row('Cuentas por Pagar', cxp);

    html += '<tr class="bg-green-100"><td colspan="6" class="px-3 py-2 font-bold">CAPITAL CONTABLE</td></tr>';
    html += row('Capital Social', capSocial);
    html += row('Utilidades Retenidas', utilRetenida);

    html += '</tbody></table></div>';
    document.getElementById('estado-situacion').innerHTML = html;
}

// PESTAÑA 16: FLUJO EFECTIVO
function calcularFlujoEfectivo() {
    const inversionInicial = parseFloat(document.getElementById('inversion-inicial').value) || 0;
    const saldoInicial = parseFloat(document.getElementById('saldo-inicial').value) || 0;
    const pctCobroEfectivo = parseFloat(document.getElementById('pct-cobro-efectivo').value) || 80;

    let html = '<div class="overflow-x-auto"><table class="min-w-full text-sm"><thead class="table-header"><tr><th class="px-3 py-2">Concepto</th>';
    for (let año = 1; año <= 5; año++) { html += `<th class="px-3 py-2">Año ${año}</th>`; }
    html += '</tr></thead><tbody>';

    html += '<tr class="table-row"><td class="px-3 py-2 font-semibold">INGRESOS</td>';
    let ingresosPorAño = [];
    for (let año = 0; año < 5; año++) {
        const ventasEfectivo = (globalData.ventasProyeccion[año] || 0) * (pctCobroEfectivo / 100);
        ingresosPorAño[año] = ventasEfectivo;
        html += `<td class="px-3 py-2 text-green-600 font-semibold">${ventasEfectivo.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</td>`;
    }
    html += '</tr>';

    html += '<tr class="table-row"><td class="px-3 py-2 font-semibold">EGRESOS</td>';
    let egresosPorAño = [];
    for (let año = 0; año < 5; año++) {
        const egresos = (globalData.comprasMP[año] || 0) +
            (globalData.costoMO[año] || 0) +
            (globalData.gastosIndirectos[año] || 0) +
            (globalData.gastosOperacion[año] || 0);
        egresosPorAño[año] = egresos;
        html += `<td class="px-3 py-2 text-red-600 font-semibold">${egresos.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</td>`;
    }
    html += '</tr>';

    // ... (Flujo neto, saldo inicial, final siguen lógica similar) ...
    // Por brevedad, usaremos el formato estándar en el resto de la tabla
    html += '<tr class="table-row bg-blue-50"><td class="px-3 py-2 font-bold">FLUJO NETO</td>';
    let flujoNeto = [];
    for (let a = 0; a < 5; a++) {
        const f = ingresosPorAño[a] - egresosPorAño[a];
        flujoNeto[a] = f;
        html += `<td class="px-3 py-2 font-bold ${f >= 0 ? 'text-green-700' : 'text-red-700'}">${f.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</td>`;
    }
    html += '</tr>';

    html += '<tr class="table-row"><td class="px-3 py-2">Saldo Inicial</td>';
    let saldoAnterior = saldoInicial - inversionInicial;
    for (let a = 0; a < 5; a++) {
        html += `<td class="px-3 py-2">${saldoAnterior.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</td>`;
        saldoAnterior += flujoNeto[a];
    }
    html += '</tr>';

    html += '<tr class="table-row bg-yellow-50"><td class="px-3 py-2 font-bold">SALDO FINAL</td>';
    saldoAnterior = saldoInicial - inversionInicial;
    for (let a = 0; a < 5; a++) {
        saldoAnterior += flujoNeto[a];
        html += `<td class="px-3 py-2 font-bold ${saldoAnterior >= 0 ? 'text-green-700' : 'text-red-700'}">${saldoAnterior.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual })}</td>`;
    }
    html += '</tr></tbody></table></div>';

    document.getElementById('flujo-efectivo-resultado').innerHTML = html;
    generarResumenEjecutivo();
}

function generarResumenEjecutivo() {
    const inversionInicial = parseFloat(document.getElementById('inversion-inicial').value) || 0;
    const ventasTotal = (globalData.ventasProyeccion || []).reduce((a, b) => a + b, 0);
    const utilidadBruta5Años = (globalData.ventasProyeccion || []).reduce((total, venta, index) => {
        return total + venta - (globalData.costoVendido[index] || 0);
    }, 0);

    const utilidadNeta5Años = (globalData.utilidadNeta || []).reduce((a, b) => a + b, 0);

    const margenPromedio = ventasTotal > 0 ? (utilidadBruta5Años / ventasTotal * 100) : 0;
    const roiProyectado = inversionInicial > 0 ? (utilidadNeta5Años / inversionInicial * 100) : 0;

    // Formateadores
    const fmt = (v) => v.toLocaleString(culturaActual, { style: 'currency', currency: monedaActual });

    let html = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-green-100 p-3 rounded-lg text-center">
                <div class="text-2xl font-bold text-green-700">${fmt(ventasTotal)}</div>
                <div class="text-sm text-green-600">Ingresos Totales (5 años)</div>
            </div>
            <div class="bg-blue-100 p-3 rounded-lg text-center">
                <div class="text-2xl font-bold text-blue-700">${fmt(utilidadNeta5Años)}</div>
                <div class="text-sm text-blue-600">Utilidad Neta (5 años)</div>
            </div>
            <div class="bg-purple-100 p-3 rounded-lg text-center">
                <div class="text-2xl font-bold text-purple-700">${margenPromedio.toFixed(1)}%</div>
                <div class="text-sm text-purple-purple-600">Margen Bruto Promedio</div>
            </div>
            <div class="bg-yellow-100 p-3 rounded-lg text-center">
                <div class="text-2xl font-bold text-yellow-700">${roiProyectado.toFixed(1)}%</div>
                <div class="text-sm text-yellow-600">ROI Proyectado</div>
            </div>
        </div>
        <div class="mt-4 text-sm text-gray-600">
            <p><strong>Punto de Equilibrio:</strong> Se alcanza cuando los ingresos igualan los costos totales.</p>
            <p><strong>Recomendación:</strong> ${margenPromedio > 20 ? 'Proyecto viable con buen margen de rentabilidad.' : 'Revisar costos para mejorar rentabilidad.'}</p>
            <p><strong>Análisis de Penetración:</strong> Año 1: ${(globalData.penetracionMercado[0] || 0).toFixed(1)}% → Año 5: ${(globalData.penetracionMercado[4] || 0).toFixed(1)}%</p>
        </div>
    `;

    document.getElementById('resumen-ejecutivo').innerHTML = html;
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

    // Llama a las funciones principales para limpiar los paneles de resultados
    calcularPlan();
    calcularFactSensibil();
    calcularPptoVtas();
    calcularInversiones();
    calcularGastosOperacion();
    calcularFlujoEfectivo();

    verificarCompletitudSecciones();

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
        inv_inicial_pt: document.getElementById('inv-inicial-pt').value,
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
        pct_cobro_efectivo: document.getElementById('pct-cobro-efectivo').value,
        inflacion_anual: document.getElementById('inflacion-anual').value
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
    fetch('https://de90-187-188-63-54.ngrok-free.app/api/guardar_proyecto.php', {
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
    fetch('https://de90-187-188-63-54.ngrok-free.app/api/cargar_proyectos.php', {
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
    fetch(`https://de90-187-188-63-54.ngrok-free.app/api/obtener_proyecto.php?id=${id}`, {
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
            document.getElementById('inv-inicial-pt').value = datos.inv_inicial_pt;
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
            document.getElementById('pct-cobro-efectivo').value = datos.pct_cobro_efectivo;
            document.getElementById('inflacion-anual').value = datos.inflacion_anual;

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
                datos.gastos_admin.forEach(gasto => agregarGastoAdmin(gasto));
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

            // Pestaña 1
            calcularPlan();

            // Pestaña 2
            calcularFactSensibil();

            // Pestaña 3 (Esto llama en cadena a Producción, MTP, MO, CostoVendido y ERI)
            calcularPptoVtas();

            // Pestaña 5
            calcularInversiones();

            // Pestaña 8 (Costos de MP)
            // 1. Actualiza los costos unitarios con los datos cargados
            actualizarCostosMP(datos.materias_primas);
            // 2. Vuelve a correr el cálculo de compras con esos costos
            calcularComprasMP();

            // Pestaña 11
            calcularGastosIndirectos(); // (Asegúrate de tener esta función si existe)

            // Pestaña 13
            calcularGastosOperacion();

            // Pestaña 16 (Esta llama a Resumen Ejecutivo)
            calcularFlujoEfectivo();

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
    fetch('https://de90-187-188-63-54.ngrok-free.app/api/borrar_proyecto.php', {
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

    console.log('Sistema de Análisis Financiero v3.0 FINAL Cargado y Limpio');
});

// ===========================
// WEBSOCKET - TIPO DE CAMBIO
// ===========================

function iniciarSocket() {
    if (conn) conn.close();
    conn = new WebSocket('ws://localhost:8081');//aqui llama al socket

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

            // 3. NUEVA LÓGICA: ACTUALIZAR INFLACIÓN AUTOMÁTICAMENTE
            if (datos.inflacion) {
                const inputInflacion = document.getElementById('inflacion-anual');
                if (inputInflacion) {
                    // Ponemos el valor nuevo en la casilla
                    inputInflacion.value = datos.inflacion;

                    // Forzamos el recálculo de Gastos Indirectos para ver el efecto
                    calcularGastosIndirectos();

                    console.log("📉 Inflación actualizada a:", datos.inflacion + "%");
                }
            }
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
        '.gasto-admin-monto'    // Gastos administrativos
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

    // 3. ¡IMPORTANTE! Forzamos el recálculo de TODAS las pestañas
    // Esto hará que las tablas de resultados se vuelvan a dibujar con la nueva moneda
    calcularComprasMP();
    calcularPlan();
    calcularFactSensibil();
    calcularPptoVtas();        // Actualiza Ingresos
    calcularInversiones();
    calcularGastosIndirectos();
    calcularGastosOperacion();
    calcularCondicionesComerciales(); // Actualiza Condiciones
    calcularCostoProduccion(); // Actualiza Costos
    calcularFlujoEfectivo();   // Actualiza Flujo y Balance
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
                    data: globalData.costoProduccion.map((c, i) => c + (globalData.gastosOperacion[i] || 0)),
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
    let acumulado = -parseFloat(document.getElementById('inversion-inicial').value || 0);
    const datosFlujo = [];
    for (let i = 0; i < 5; i++) {
        // Flujo neto aprox = Utilidad Neta + Depreciación (simplificado)
        const flujoAnual = (globalData.utilidadNeta[i] || 0) + (globalData.depreciacion[i] || 0);
        acumulado += flujoAnual;
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
                data: [-parseFloat(document.getElementById('inversion-inicial').value || 0), ...datosFlujo],
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
    const mp = globalData.comprasMP[0] || 0;
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