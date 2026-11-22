// ---------- Íconos ----------
const mkIcono = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICONOS = {
  wallet: mkIcono('<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>'),
  card: mkIcono('<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>'),
  coins: mkIcono('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>'),
  calendar: mkIcono('<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  bars: mkIcono('<path d="M12 20V10M18 20V4M6 20v-4"/>'),
  grid: mkIcono('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>'),
  trend: mkIcono('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>'),
  home: mkIcono('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
  plus: mkIcono('<path d="M12 5v14M5 12h14"/>'),
  target: mkIcono('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
  pie: mkIcono('<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>'),
  gear: mkIcono('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>')
};
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = ICONOS[el.dataset.icon] || ''; });

// ---------- Navegación ----------
const vistas = document.querySelectorAll('.vista');
function irA(v) {
  vistas.forEach(x => x.classList.toggle('activa', x.id === v));
  document.querySelectorAll('[data-vista]').forEach(b => b.classList.toggle('activo', b.dataset.vista === v));
  window.scrollTo(0, 0);
}
document.querySelectorAll('[data-vista]').forEach(b => {
  b.addEventListener('click', () => irA(b.dataset.vista));
});

// ---------- Datos ----------
const guardar = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const leer = (k, def) => JSON.parse(localStorage.getItem(k)) ?? def;

// Métodos de pago (puedes agregar más, por ejemplo 'Plin')
const METODOS = ['Efectivo', 'Yape/Tarjeta'];
// Los métodos antiguos "Yape" y "Tarjeta" se unifican en "Yape/Tarjeta"
const unificar = m => (m === 'Yape' || m === 'Tarjeta') ? 'Yape/Tarjeta' : m;
const metodoDe = m => unificar(m.metodo) || 'Sin especificar';

// Colores e íconos de los gráficos
const PALETA = ['#e11d2e', '#ff8a95', '#9f1239', '#f97316', '#6b7280', '#fbbf24', '#be123c', '#a78bfa'];
const COLOR_OTROS = '#6b7280';
const COLOR_METODO = { 'Efectivo': '#ff8a95', 'Yape/Tarjeta': '#e11d2e', 'Sin especificar': '#6b7280' };
const COLOR_BORDE = { 'Efectivo': '#22c55e', 'Yape/Tarjeta': '#e11d2e', 'Sin especificar': '#6b7280' };
const ICONO_METODO = { 'Efectivo': ICONOS.wallet, 'Yape/Tarjeta': ICONOS.card, 'Sin especificar': ICONOS.coins };
const LINEA_ROJA = '#ff4d5e';
const LINEA_VERDE = '#22c55e';

let movimientos = leer('movimientos', []);
let etiquetas = leer('etiquetas', ['Comida', 'Transporte', 'Universidad', 'Ocio', 'Deportes']);
let presupuestos = leer('presupuestos', {}); // { etiqueta: límite mensual }
let recurrentes = leer('recurrentes', []);
let metas = leer('metas', []);

const soles = n => 'S/ ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fechaStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hoy = () => fechaStr(new Date());

// ---------- Conexión con la nube (sync.js) ----------
function guardarConfig() {
  guardar('etiquetas', etiquetas);
  guardar('presupuestos', presupuestos);
  guardar('recurrentes', recurrentes);
  guardar('metas', metas);
  window.nube?.guardarConfig?.({ etiquetas, presupuestos, recurrentes, metas });
}
const nubeGuardarMov = m => window.nube?.guardarMov?.(m);
const nubeBorrarMov = id => window.nube?.borrarMov?.(id);

function migrarMetodos() {
  let cambioMov = false, cambioRec = false;
  movimientos.forEach(m => {
    if (m.metodo && unificar(m.metodo) !== m.metodo) {
      m.metodo = unificar(m.metodo);
      cambioMov = true;
      nubeGuardarMov(m);
    }
  });
  recurrentes.forEach(r => {
    if (r.metodo && unificar(r.metodo) !== r.metodo) {
      r.metodo = unificar(r.metodo);
      cambioRec = true;
    }
  });
  if (cambioMov) guardar('movimientos', movimientos);
  if (cambioRec) guardarConfig();
}

window.obtenerDatos = () => ({ movimientos, etiquetas, presupuestos, recurrentes, metas });

window.aplicarNube = function (d) {
  if (d.movimientos) {
    movimientos = d.movimientos;
    guardar('movimientos', movimientos);
  }
  if (d.config) {
    const c = d.config;
    if (c.etiquetas && c.etiquetas.length) etiquetas = c.etiquetas;
    presupuestos = c.presupuestos || {};
    recurrentes = c.recurrentes || [];
    metas = c.metas || [];
    guardar('etiquetas', etiquetas);
    guardar('presupuestos', presupuestos);
    guardar('recurrentes', recurrentes);
    guardar('metas', metas);
    pintarEtiquetas();
  }
  migrarMetodos();
  pintar();
};

window.alIniciarNube = function () {
  migrarMetodos();
  generarRecurrentes();
  pintar();
};

// ---------- Periodo ----------
let periodo = 'mes';
let ref = new Date();

function rango(d0 = ref) {
  const d = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate());
  let ini, fin;
  if (periodo === 'dia') { ini = fin = d; }
  else if (periodo === 'semana') {
    const dif = (d.getDay() + 6) % 7;
    ini = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dif);
    fin = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + 6);
  } else if (periodo === 'mes') {
    ini = new Date(d.getFullYear(), d.getMonth(), 1);
    fin = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  } else {
    ini = new Date(d.getFullYear(), 0, 1);
    fin = new Date(d.getFullYear(), 11, 31);
  }
  return [ini, fin];
}

function rotulo(ini, fin) {
  const f = (d, o) => d.toLocaleDateString('es-PE', o);
  if (periodo === 'dia') return f(ini, { day: 'numeric', month: 'short', year: 'numeric' });
  if (periodo === 'semana') return f(ini, { day: 'numeric', month: 'short' }) + ' – ' + f(fin, { day: 'numeric', month: 'short', year: 'numeric' });
  if (periodo === 'mes') return f(ini, { month: 'long', year: 'numeric' });
  return String(ini.getFullYear());
}

function desplazar(d, dir) {
  if (periodo === 'dia') d.setDate(d.getDate() + dir);
  else if (periodo === 'semana') d.setDate(d.getDate() + 7 * dir);
  else if (periodo === 'mes') d.setMonth(d.getMonth() + dir, 1);
  else d.setFullYear(d.getFullYear() + dir);
}

function mover(dir) {
  desplazar(ref, dir);
  pintar();
}

function buckets() {
  const [ini, fin] = rango();
  const out = [];
  if (periodo === 'anio') {
    for (let m = 0; m < 12; m++) {
      out.push([fechaStr(new Date(ini.getFullYear(), m, 1)), fechaStr(new Date(ini.getFullYear(), m + 1, 0))]);
    }
  } else {
    const dias = periodo === 'mes' ? fin.getDate() : 7;
    const desde = periodo === 'dia' ? new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() - 6) : ini;
    for (let i = 0; i < dias; i++) {
      const f = fechaStr(new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + i));
      out.push([f, f]);
    }
  }
  return out;
}

document.querySelectorAll('.periodos button').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.periodos button').forEach(x => x.classList.remove('activo'));
    b.classList.add('activo');
    periodo = b.dataset.p;
    pintar();
  });
});
document.getElementById('prev').addEventListener('click', () => mover(-1));
document.getElementById('next').addEventListener('click', () => mover(1));

// ---------- Elementos ----------
const form = document.getElementById('formMov');
const selEtiqueta = document.getElementById('etiqueta');
const selMetodo = document.getElementById('metodo');
const selPresEtiqueta = document.getElementById('presEtiqueta');
const selRecEtiqueta = document.getElementById('recEtiqueta');
const selRecMetodo = document.getElementById('recMetodo');
const lista = document.getElementById('lista');
const btnGuardarMov = document.getElementById('btnGuardarMov');
const btnCancelarEdicion = document.getElementById('btnCancelarEdicion');
const avisoEdicion = document.getElementById('avisoEdicion');
document.getElementById('fecha').value = hoy();

document.getElementById('btnNuevo').addEventListener('click', () => {
  irA('inicio');
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => document.getElementById('monto').focus(), 400);
});

// ---------- Etiquetas y métodos ----------
function pintarEtiquetas() {
  const opciones = etiquetas.map(e => `<option>${e}</option>`).join('');
  [selEtiqueta, selPresEtiqueta, selRecEtiqueta].forEach(s => {
    const previa = s.value;
    s.innerHTML = opciones;
    if (etiquetas.includes(previa)) s.value = previa;
  });
}

function pintarMetodos(extra) {
  let opciones = METODOS.map(m => `<option>${m}</option>`).join('');
  if (extra === '') opciones = '<option value="">Sin especificar</option>' + opciones;
  else if (extra && !METODOS.includes(extra)) opciones = `<option>${extra}</option>` + opciones;
  selMetodo.innerHTML = opciones;
  selRecMetodo.innerHTML = METODOS.map(m => `<option>${m}</option>`).join('');
}

document.getElementById('btnNuevaEtiqueta').addEventListener('click', () => {
  const nueva = prompt('Nombre de la nueva etiqueta:');
  if (nueva && !etiquetas.includes(nueva.trim())) {
    etiquetas.push(nueva.trim());
    guardarConfig();
    pintarEtiquetas();
    selEtiqueta.value = nueva.trim();
  }
});

function actualizarCampos() {
  const esIngreso = form.tipo.value === 'ingreso';
  document.getElementById('filaEtiqueta').style.display = esIngreso ? 'none' : '';
  const esIngresoRec = document.querySelector('input[name="tiporec"]:checked').value === 'ingreso';
  selRecEtiqueta.style.display = esIngresoRec ? 'none' : '';
}
document.querySelectorAll('input[name="tipo"], input[name="tiporec"]').forEach(r => {
  r.addEventListener('change', actualizarCampos);
});

// ---------- Movimientos ----------
let editandoId = null;

function terminarEdicion() {
  editandoId = null;
  form.reset();
  document.getElementById('fecha').value = hoy();
  pintarEtiquetas();
  pintarMetodos();
  actualizarCampos();
  btnGuardarMov.textContent = 'Guardar';
  btnCancelarEdicion.hidden = true;
  avisoEdicion.hidden = true;
}

function editarMov(id) {
  const m = movimientos.find(x => String(x.id) === String(id));
  if (!m) return;

  irA('inicio');

  editandoId = String(m.id);
  const metodoActual = unificar(m.metodo);
  pintarEtiquetas();
  pintarMetodos(metodoActual ? (METODOS.includes(metodoActual) ? undefined : metodoActual) : '');

  form.querySelector(`input[name="tipo"][value="${m.tipo}"]`).checked = true;
  actualizarCampos();
  document.getElementById('monto').value = m.monto;
  if (m.tipo === 'gasto') {
    if (!etiquetas.includes(m.etiqueta)) {
      selEtiqueta.insertAdjacentHTML('beforeend', `<option>${m.etiqueta}</option>`);
    }
    selEtiqueta.value = m.etiqueta;
  }
  selMetodo.value = metodoActual || '';
  document.getElementById('fecha').value = m.fecha;
  document.getElementById('nota').value = m.nota || '';

  btnGuardarMov.textContent = 'Guardar cambios';
  btnCancelarEdicion.hidden = false;
  avisoEdicion.hidden = false;
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

btnCancelarEdicion.addEventListener('click', terminarEdicion);

form.addEventListener('submit', e => {
  e.preventDefault();
  const tipo = form.tipo.value;
  const datos = {
    tipo,
    monto: parseFloat(document.getElementById('monto').value),
    etiqueta: tipo === 'ingreso' ? 'Ingreso' : selEtiqueta.value,
    metodo: selMetodo.value,
    fecha: document.getElementById('fecha').value,
    nota: document.getElementById('nota').value
  };

  let mov;
  const i = editandoId ? movimientos.findIndex(x => String(x.id) === editandoId) : -1;
  if (i >= 0) {
    movimientos[i] = { ...movimientos[i], ...datos };
    mov = movimientos[i];
  } else {
    mov = { id: String(Date.now()), ...datos };
    movimientos.push(mov);
  }

  guardar('movimientos', movimientos);
  nubeGuardarMov(mov);
  terminarEdicion();
  pintar();
  avisarPresupuesto(mov);
});

function eliminar(id) {
  if (editandoId && String(id) === editandoId) terminarEdicion();
  movimientos = movimientos.filter(m => String(m.id) !== String(id));
  guardar('movimientos', movimientos);
  nubeBorrarMov(id);
  pintar();
}

// ---------- Presupuestos ----------
function gastadoMes(etiqueta, ym) {
  return movimientos
    .filter(m => m.tipo === 'gasto' && m.etiqueta === etiqueta && m.fecha.startsWith(ym))
    .reduce((s, m) => s + m.monto, 0);
}

function avisarPresupuesto(mov) {
  if (mov.tipo !== 'gasto' || !presupuestos[mov.etiqueta]) return;
  const limite = presupuestos[mov.etiqueta];
  const gastado = gastadoMes(mov.etiqueta, mov.fecha.slice(0, 7));
  const pct = Math.round(gastado / limite * 100);
  if (gastado > limite) {
    alert(`⚠️ Superaste el presupuesto de ${mov.etiqueta}: ${soles(gastado)} de ${soles(limite)} (${pct}%).`);
  } else if (pct >= 80) {
    alert(`Atención: llevas ${pct}% del presupuesto de ${mov.etiqueta} (${soles(gastado)} de ${soles(limite)}).`);
  }
}

document.getElementById('formPres').addEventListener('submit', e => {
  e.preventDefault();
  presupuestos[selPresEtiqueta.value] = parseFloat(document.getElementById('presMonto').value);
  guardarConfig();
  document.getElementById('presMonto').value = '';
  pintarPresupuestos();
});

function borrarPresupuesto(etiqueta) {
  delete presupuestos[etiqueta];
  guardarConfig();
  pintarPresupuestos();
}

function pintarPresupuestos() {
  const ym = hoy().slice(0, 7);
  const mesTxt = new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  document.getElementById('presTitulo').textContent = 'Presupuestos de ' + mesTxt;

  const filas = Object.entries(presupuestos);
  document.getElementById('presLista').innerHTML = filas.length ? filas.map(([et, limite]) => {
    const gastado = gastadoMes(et, ym);
    const pct = Math.round(gastado / limite * 100);
    const estado = gastado > limite ? 'excedido' : pct >= 80 ? 'alerta' : 'ok';
    const restante = limite - gastado;
    const msg = estado === 'excedido'
      ? `<span class="msg-excedido">Excedido por ${soles(-restante)}</span>`
      : estado === 'alerta'
        ? `<span class="msg-alerta">Te quedan ${soles(restante)}</span>`
        : `<span>Te quedan ${soles(restante)}</span>`;
    return `
      <div class="pres">
        <div class="top">
          <strong>${et}</strong>
          <button onclick="borrarPresupuesto('${et.replace(/'/g, "\\'")}')" title="Quitar">×</button>
        </div>
        <div class="fondo"><div class="relleno ${estado}" style="width:${Math.min(pct, 100)}%"></div></div>
        <div class="detalle">
          <span>${soles(gastado)} de ${soles(limite)} · ${pct}%</span>
          ${msg}
        </div>
      </div>`;
  }).join('') : '<p class="vacio">Aún no tienes presupuestos. Crea el primero arriba.</p>';
}

// ---------- Recurrentes ----------
function generarRecurrentes() {
  const hoyStr = hoy();
  const ahora = new Date();
  let hubo = false;

  recurrentes.forEach(r => {
    let y = parseInt(r.inicio.slice(0, 4)), m = parseInt(r.inicio.slice(5, 7)) - 1;
    while (y < ahora.getFullYear() || (y === ahora.getFullYear() && m <= ahora.getMonth())) {
      const dd = Math.min(r.dia, new Date(y, m + 1, 0).getDate());
      const fecha = fechaStr(new Date(y, m, dd));
      const ym = fecha.slice(0, 7);
      if (fecha >= r.inicio && fecha <= hoyStr && ym > (r.ultimo || '')) {
        const mov = {
          id: `r${r.id}_${ym}`,
          tipo: r.tipo,
          monto: r.monto,
          etiqueta: r.etiqueta,
          metodo: unificar(r.metodo) || '',
          fecha,
          nota: (r.nota || 'Recurrente') + ' ↻'
        };
        if (!movimientos.some(x => String(x.id) === mov.id)) {
          movimientos.push(mov);
          nubeGuardarMov(mov);
        }
        r.ultimo = ym;
        hubo = true;
      }
      m++;
      if (m > 11) { m = 0; y++; }
    }
  });

  if (hubo) {
    guardar('movimientos', movimientos);
    guardarConfig();
  }
}

document.getElementById('formRec').addEventListener('submit', e => {
  e.preventDefault();
  const tipo = document.querySelector('input[name="tiporec"]:checked').value;
  recurrentes.push({
    id: Date.now(),
    tipo,
    monto: parseFloat(document.getElementById('recMonto').value),
    etiqueta: tipo === 'ingreso' ? 'Ingreso' : selRecEtiqueta.value,
    metodo: selRecMetodo.value,
    dia: parseInt(document.getElementById('recDia').value),
    nota: document.getElementById('recNota').value,
    inicio: hoy(),
    ultimo: ''
  });
  guardarConfig();
  e.target.reset();
  actualizarCampos();
  generarRecurrentes();
  pintar();
});

function borrarRecurrente(id) {
  recurrentes = recurrentes.filter(r => r.id !== id);
  guardarConfig();
  pintarRecurrentes();
}

function pintarRecurrentes() {
  document.getElementById('recLista').innerHTML = recurrentes.length ? recurrentes.map(r => `
    <div class="rec">
      <div>
        <strong>${r.etiqueta}</strong>
        <small>Cada mes, día ${r.dia}${r.metodo ? ' · ' + unificar(r.metodo) : ''}${r.nota ? ' · ' + r.nota : ''}</small>
      </div>
      <div>
        <span class="${r.tipo}-monto">${r.tipo === 'gasto' ? '-' : '+'}${soles(r.monto)}</span>
        <button onclick="borrarRecurrente(${r.id})" title="Quitar">×</button>
      </div>
    </div>`).join('') : '<p class="vacio">Aún no tienes recurrentes.</p>';
}

// ---------- Metas de ahorro ----------
document.getElementById('formMeta').addEventListener('submit', e => {
  e.preventDefault();
  metas.push({
    id: Date.now(),
    nombre: document.getElementById('metaNombre').value.trim(),
    objetivo: parseFloat(document.getElementById('metaObjetivo').value),
    ahorrado: 0,
    fecha: document.getElementById('metaFecha').value
  });
  guardarConfig();
  e.target.reset();
  pintarMetas();
});

function aportarMeta(id) {
  const txt = prompt('¿Cuánto quieres aportar? (usa un número negativo para retirar)');
  const n = parseFloat(txt);
  if (!txt || isNaN(n)) return;
  const meta = metas.find(m => m.id === id);
  meta.ahorrado = Math.max(0, meta.ahorrado + n);
  guardarConfig();
  pintarMetas();
}

function borrarMeta(id) {
  if (!confirm('¿Eliminar esta meta?')) return;
  metas = metas.filter(m => m.id !== id);
  guardarConfig();
  pintarMetas();
}

function pintarMetas() {
  document.getElementById('metasLista').innerHTML = metas.length ? metas.map(m => {
    const pct = Math.round(m.ahorrado / m.objetivo * 100);
    const completa = m.ahorrado >= m.objetivo;
    const faltan = Math.max(0, m.objetivo - m.ahorrado);
    return `
      <div class="pres meta">
        <div class="top">
          <strong>${m.nombre}</strong>
          <button onclick="borrarMeta(${m.id})" title="Eliminar">×</button>
        </div>
        <div class="fondo"><div class="relleno ${completa ? 'completa' : ''}" style="width:${Math.min(pct, 100)}%"></div></div>
        <div class="detalle">
          <span>${soles(m.ahorrado)} de ${soles(m.objetivo)} · ${pct}%</span>
          <span>${completa ? '🎉 ¡Meta lograda!' : 'Faltan ' + soles(faltan)}</span>
        </div>
        ${m.fecha ? `<small>Fecha límite: ${m.fecha}</small>` : ''}
        <div class="acciones">
          <button class="aportar" onclick="aportarMeta(${m.id})">+ Aportar</button>
        </div>
      </div>`;
  }).join('') : '<p class="vacio">Aún no tienes metas. Crea la primera arriba.</p>';
}

// ---------- Exportar y respaldo ----------
function descargar(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const movsOrdenados = () => [...movimientos].sort((a, b) => a.fecha.localeCompare(b.fecha) || String(a.id).localeCompare(String(b.id)));

document.getElementById('btnCSV').addEventListener('click', () => {
  if (!movimientos.length) return alert('No hay movimientos para exportar.');
  const celda = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const filas = [['Fecha', 'Tipo', 'Etiqueta', 'Método de pago', 'Monto (S/)', 'Nota']]
    .concat(movsOrdenados().map(m => [m.fecha, m.tipo === 'gasto' ? 'Gasto' : 'Ingreso', m.etiqueta, unificar(m.metodo) || '', m.monto.toFixed(2), m.nota]));
  const csv = '\ufeff' + filas.map(f => f.map(celda).join(',')).join('\r\n');
  descargar(`mis-gastos-${hoy()}.csv`, csv, 'text/csv;charset=utf-8');
});

document.getElementById('btnExcel').addEventListener('click', () => {
  if (typeof XLSX === 'undefined') return alert('No se pudo cargar la librería de Excel. Recarga la página.');
  if (!movimientos.length) return alert('No hay movimientos para exportar.');

  const hojaMov = [['Fecha', 'Tipo', 'Etiqueta', 'Método de pago', 'Monto (S/)', 'Nota']]
    .concat(movsOrdenados().map(m => [m.fecha, m.tipo === 'gasto' ? 'Gasto' : 'Ingreso', m.etiqueta, unificar(m.metodo) || '', m.monto, m.nota || '']));
  const wsMov = XLSX.utils.aoa_to_sheet(hojaMov);
  wsMov['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 30 }];

  const ym = hoy().slice(0, 7);
  const hojaPres = [['Etiqueta', 'Límite mensual (S/)', 'Gastado este mes (S/)', 'Restante (S/)']]
    .concat(Object.entries(presupuestos).map(([et, lim]) => {
      const g = gastadoMes(et, ym);
      return [et, lim, g, lim - g];
    }));
  const wsPres = XLSX.utils.aoa_to_sheet(hojaPres);
  wsPres['!cols'] = [{ wch: 16 }, { wch: 20 }, { wch: 22 }, { wch: 14 }];

  const hojaMetas = [['Meta', 'Objetivo (S/)', 'Ahorrado (S/)', 'Avance (%)', 'Fecha límite']]
    .concat(metas.map(m => [m.nombre, m.objetivo, m.ahorrado, Math.round(m.ahorrado / m.objetivo * 100), m.fecha || '']));
  const wsMetas = XLSX.utils.aoa_to_sheet(hojaMetas);
  wsMetas['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsMov, 'Movimientos');
  XLSX.utils.book_append_sheet(wb, wsPres, 'Presupuestos');
  XLSX.utils.book_append_sheet(wb, wsMetas, 'Metas');
  XLSX.writeFile(wb, `mis-gastos-${hoy()}.xlsx`);
});

document.getElementById('btnRespaldo').addEventListener('click', () => {
  const datos = { app: 'mis-gastos', version: 1, fecha: hoy(), movimientos, etiquetas, presupuestos, recurrentes, metas };
  descargar(`respaldo-mis-gastos-${hoy()}.json`, JSON.stringify(datos, null, 2), 'application/json');
});

document.getElementById('btnRestaurar').addEventListener('click', () => {
  document.getElementById('archivoRespaldo').click();
});

document.getElementById('archivoRespaldo').addEventListener('change', e => {
  const archivo = e.target.files[0];
  if (!archivo) return;
  const lector = new FileReader();
  lector.onload = async () => {
    let d;
    try {
      d = JSON.parse(lector.result);
      if (d.app !== 'mis-gastos' || !Array.isArray(d.movimientos)) throw new Error('formato');
    } catch (err) {
      alert('El archivo no es un respaldo válido de Mis Gastos.');
      return;
    }
    const aviso = window.nube?.activo ? ' y de tu nube' : ' de este dispositivo';
    if (!confirm(`Este respaldo tiene ${d.movimientos.length} movimientos. Se reemplazarán los datos actuales${aviso}. ¿Continuar?`)) return;

    const cfg = {
      etiquetas: d.etiquetas && d.etiquetas.length ? d.etiquetas : etiquetas,
      presupuestos: d.presupuestos || {},
      recurrentes: d.recurrentes || [],
      metas: d.metas || []
    };
    guardar('movimientos', d.movimientos);
    guardar('etiquetas', cfg.etiquetas);
    guardar('presupuestos', cfg.presupuestos);
    guardar('recurrentes', cfg.recurrentes);
    guardar('metas', cfg.metas);

    if (window.nube?.activo) {
      try { await window.nube.reemplazarTodo(d.movimientos, cfg); } catch (err) { console.error(err); }
    }
    location.reload();
  };
  lector.readAsText(archivo);
  e.target.value = '';
});

// ---------- Gráficos ----------
function dona(filas, total, colorDe) {
  if (!colorDe && filas.length > PALETA.length) {
    const resto = filas.slice(PALETA.length - 1).reduce((s, f) => s + f[1], 0);
    filas = filas.slice(0, PALETA.length - 1).concat([['Otros', resto]]);
  }
  let acum = 0;
  const trozos = [];
  const items = [];
  filas.forEach(([nombre, monto], i) => {
    const color = colorDe ? colorDe(nombre) : (nombre === 'Otros' ? COLOR_OTROS : PALETA[i % PALETA.length]);
    const pct = monto / total * 100;
    const fin = i === filas.length - 1 ? 100 : acum + pct;
    trozos.push(`${color} ${acum}% ${fin}%`);
    acum += pct;
    items.push(`
      <div class="item-leyenda">
        <span class="punto" style="background:${color}"></span>
        <span>${nombre}</span>
        <span class="monto">${soles(monto)}<small>${Math.round(pct)}%</small></span>
      </div>`);
  });
  return `
    <div class="grafico">
      <div class="dona" style="background:conic-gradient(${trozos.join(',')})">
        <div class="dona-centro"><small>Total</small><strong>${soles(total)}</strong></div>
      </div>
      <div class="leyenda-lista">${items.join('')}</div>
    </div>`;
}

let sparkId = 0;
function spark(vals, color) {
  if (!vals.length) vals = [0, 0];
  if (vals.length < 2) vals = [vals[0], vals[0]];
  const W = 120, H = 40, pad = 5;
  const min = Math.min(...vals), max = Math.max(...vals);
  const pts = vals.map((v, i) => [
    i / (vals.length - 1) * W,
    max === min ? H / 2 : H - pad - (v - min) / (max - min) * (H - 2 * pad)
  ]);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }
  const id = 'sp' + (++sparkId);
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${color}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${d} L ${W} ${H} L 0 ${H} Z" fill="url(#${id})"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

function tendencia(actual, previo, subeEsBueno) {
  if (!previo) return ['', ''];
  const pct = Math.round((actual - previo) / previo * 100);
  if (pct === 0) return ['→ 0%', 'neutra'];
  const bueno = (pct > 0) === subeEsBueno;
  return [`${pct > 0 ? '↑ +' : '↓ '}${pct}%`, bueno ? 'bien' : 'mal'];
}

// ---------- Pintar inicio ----------
function pintar() {
  const [ini, fin] = rango();
  const desde = fechaStr(ini), hasta = fechaStr(fin);
  document.getElementById('rotulo').textContent = rotulo(ini, fin);

  const delPeriodo = movimientos.filter(m => m.fecha >= desde && m.fecha <= hasta);
  const ordenados = [...delPeriodo].sort((a, b) => b.fecha.localeCompare(a.fecha) || String(b.id).localeCompare(String(a.id)));

  lista.innerHTML = ordenados.length ? ordenados.map(m => `
    <li>
      <div class="info">
        <strong>${m.etiqueta}</strong>
        <small>${m.fecha}${m.metodo ? ' · ' + unificar(m.metodo) : ''}${m.nota ? ' · ' + m.nota : ''}</small>
      </div>
      <div>
        <span class="${m.tipo}-monto">${m.tipo === 'gasto' ? '-' : '+'}${soles(m.monto)}</span>
        <button onclick="editarMov('${m.id}')" title="Editar">✎</button>
        <button onclick="eliminar('${m.id}')" title="Eliminar">×</button>
      </div>
    </li>`).join('') : '<p class="vacio">Sin movimientos en este periodo</p>';

  const ing = delPeriodo.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0);
  const gastos = delPeriodo.filter(m => m.tipo === 'gasto');
  const gas = gastos.reduce((s, m) => s + m.monto, 0);

  const hastaAhora = movimientos.filter(m => m.fecha <= hasta);
  const saldoAcumulado = hastaAhora.reduce((s, m) => s + (m.tipo === 'ingreso' ? m.monto : -m.monto), 0);

  document.getElementById('totalIngresos').textContent = soles(ing);
  document.getElementById('totalGastos').textContent = soles(gas);
  document.getElementById('saldo').textContent = soles(saldoAcumulado);

  const refAnt = new Date(ref);
  desplazar(refAnt, -1);
  const [aIni, aFin] = rango(refAnt);
  const anterior = movimientos.filter(m => m.fecha >= fechaStr(aIni) && m.fecha <= fechaStr(aFin));
  const ingAnt = anterior.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0);
  const gasAnt = anterior.filter(m => m.tipo === 'gasto').reduce((s, m) => s + m.monto, 0);
  const [tI, cI] = tendencia(ing, ingAnt, true);
  const [tG, cG] = tendencia(gas, gasAnt, false);
  const elTI = document.getElementById('tendIngresos');
  const elTG = document.getElementById('tendGastos');
  elTI.textContent = tI; elTI.className = 'tend ' + cI; elTI.title = 'Frente al periodo anterior';
  elTG.textContent = tG; elTG.className = 'tend ' + cG; elTG.title = 'Frente al periodo anterior';

  const serie = buckets().map(([a, b]) => {
    const en = movimientos.filter(m => m.fecha >= a && m.fecha <= b);
    const sm = {};
    METODOS.forEach(k => { sm[k] = 0; });
    let saldo = 0;
    movimientos.filter(m => m.fecha <= b).forEach(m => {
      const v = m.tipo === 'ingreso' ? m.monto : -m.monto;
      saldo += v;
      const k = metodoDe(m);
      sm[k] = (sm[k] || 0) + v;
    });
    return {
      ing: en.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0),
      gas: en.filter(m => m.tipo === 'gasto').reduce((s, m) => s + m.monto, 0),
      saldo,
      sm
    };
  });
  document.getElementById('sparkIngresos').innerHTML = spark(serie.map(s => s.ing), LINEA_ROJA);
  document.getElementById('sparkGastos').innerHTML = spark(serie.map(s => s.gas), LINEA_ROJA);
  document.getElementById('sparkSaldo').innerHTML = spark(serie.map(s => s.saldo), LINEA_ROJA);

  const porEtiq = {};
  gastos.forEach(m => porEtiq[m.etiqueta] = (porEtiq[m.etiqueta] || 0) + m.monto);
  const filas = Object.entries(porEtiq).sort((a, b) => b[1] - a[1]);
  document.getElementById('porEtiqueta').innerHTML = filas.length
    ? dona(filas, gas)
    : '<p class="vacio">Sin gastos en este periodo</p>';

  const porMet = {};
  gastos.forEach(m => { const k = metodoDe(m); porMet[k] = (porMet[k] || 0) + m.monto; });
  const filasMet = Object.entries(porMet).sort((a, b) => b[1] - a[1]);
  document.getElementById('porMetodo').innerHTML = filasMet.length
    ? dona(filasMet, gas, n => COLOR_METODO[n] || COLOR_OTROS)
    : '<p class="vacio">Sin gastos en este periodo</p>';

  const saldoMet = {};
  METODOS.forEach(k => { saldoMet[k] = 0; });
  hastaAhora.forEach(m => {
    const k = metodoDe(m);
    saldoMet[k] = (saldoMet[k] || 0) + (m.tipo === 'ingreso' ? m.monto : -m.monto);
  });
  document.getElementById('saldoMetodos').innerHTML = Object.entries(saldoMet)
    .filter(([k, v]) => METODOS.includes(k) || Math.abs(v) > 0.004)
    .map(([k, v]) => `
      <div class="metodo-card" style="--color:${COLOR_BORDE[k] || COLOR_OTROS}">
        <div class="metodo-icono">${ICONO_METODO[k] || ICONOS.coins}</div>
        <div class="metodo-datos">
          <span class="nombre">${k}</span>
          <span class="valor ${v < 0 ? 'neg' : 'pos'}">${soles(v)}</span>
        </div>
        <div class="metodo-spark">${spark(serie.map(s => s.sm[k] || 0), v < 0 ? '#ff6b78' : LINEA_VERDE)}</div>
      </div>`)
    .join('');

  pintarCalendario();
  pintarPresupuestos();
  pintarRecurrentes();
  pintarMetas();
}

// ---------- Calendario ----------
let calRef = new Date();
let diaSel = hoy();

function pintarCalendario() {
  const anio = calRef.getFullYear(), mes = calRef.getMonth();
  document.getElementById('calRotulo').textContent =
    new Date(anio, mes, 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });

  const totales = {};
  movimientos.filter(m => m.tipo === 'gasto').forEach(m => {
    totales[m.fecha] = (totales[m.fecha] || 0) + m.monto;
  });

  const diasMes = new Date(anio, mes + 1, 0).getDate();
  const vals = [];
  for (let d = 1; d <= diasMes; d++) {
    const t = totales[fechaStr(new Date(anio, mes, d))];
    if (t) vals.push(t);
  }
  const max = Math.max(...vals, 0);

  const offset = (new Date(anio, mes, 1).getDay() + 6) % 7;
  let html = '<div class="cal-dia vacio-dia"></div>'.repeat(offset);
  for (let d = 1; d <= diasMes; d++) {
    const f = fechaStr(new Date(anio, mes, d));
    const t = totales[f] || 0;
    let nivel = 0;
    if (t > 0) nivel = Math.min(4, Math.ceil(t / max * 4));
    const cls = ['cal-dia', nivel ? 'nivel' + nivel : '', f === hoy() ? 'hoy' : '', f === diaSel ? 'sel' : ''].join(' ');
    html += `<button class="${cls}" onclick="selDia('${f}')">${d}${t ? `<small>${Math.round(t)}</small>` : ''}</button>`;
  }
  document.getElementById('calGrid').innerHTML = html;
  pintarDetalleDia();
}

function pintarDetalleDia() {
  const delDia = movimientos.filter(m => m.fecha === diaSel);
  const gas = delDia.filter(m => m.tipo === 'gasto').reduce((s, m) => s + m.monto, 0);
  document.getElementById('calDetalleTitulo').textContent = `${diaSel} · Gastado: ${soles(gas)}`;
  document.getElementById('calDetalle').innerHTML = delDia.length ? delDia.map(m => `
    <li>
      <div class="info"><strong>${m.etiqueta}</strong><small>${[unificar(m.metodo), m.nota].filter(Boolean).join(' · ')}</small></div>
      <div>
        <span class="${m.tipo}-monto">${m.tipo === 'gasto' ? '-' : '+'}${soles(m.monto)}</span>
        <button onclick="editarMov('${m.id}')" title="Editar">✎</button>
      </div>
    </li>`).join('') : '<p class="vacio">Sin movimientos este día</p>';
}

function selDia(f) { diaSel = f; pintarCalendario(); }

document.getElementById('calPrev').addEventListener('click', () => { calRef.setMonth(calRef.getMonth() - 1, 1); pintarCalendario(); });
document.getElementById('calNext').addEventListener('click', () => { calRef.setMonth(calRef.getMonth() + 1, 1); pintarCalendario(); });

// ---------- Inicio ----------
migrarMetodos();
pintarEtiquetas();
pintarMetodos();
actualizarCampos();
generarRecurrentes();
pintar();
