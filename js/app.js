// ---------- Navegación ----------
const botones = document.querySelectorAll('nav button');
const vistas = document.querySelectorAll('.vista');
botones.forEach(btn => {
  btn.addEventListener('click', () => {
    botones.forEach(b => b.classList.remove('activo'));
    vistas.forEach(v => v.classList.remove('activa'));
    btn.classList.add('activo');
    document.getElementById(btn.dataset.vista).classList.add('activa');
  });
});

// ---------- Datos ----------
const guardar = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const leer = (k, def) => JSON.parse(localStorage.getItem(k)) ?? def;

// Métodos de pago (puedes agregar más, por ejemplo 'Plin')
const METODOS = ['Efectivo', 'Yape', 'Tarjeta'];
const metodoDe = m => m.metodo || 'Sin especificar';

let movimientos = leer('movimientos', []);
let etiquetas = leer('etiquetas', ['Comida', 'Transporte', 'Universidad', 'Ocio', 'Deportes']);
let presupuestos = leer('presupuestos', {}); // { etiqueta: límite mensual }
let recurrentes = leer('recurrentes', []);
let metas = leer('metas', []);

const soles = n => 'S/ ' + n.toFixed(2);
const fechaStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hoy = () => fechaStr(new Date());

// ---------- Conexión con la nube (sync.js) ----------
// Guarda la configuración en el dispositivo y, si hay sesión, también en la nube
function guardarConfig() {
  guardar('etiquetas', etiquetas);
  guardar('presupuestos', presupuestos);
  guardar('recurrentes', recurrentes);
  guardar('metas', metas);
  window.nube?.guardarConfig?.({ etiquetas, presupuestos, recurrentes, metas });
}
const nubeGuardarMov = m => window.nube?.guardarMov?.(m);
const nubeBorrarMov = id => window.nube?.borrarMov?.(id);

window.obtenerDatos = () => ({ movimientos, etiquetas, presupuestos, recurrentes, metas });

// sync.js llama a esto cuando llegan datos de la nube
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
  pintar();
};

// sync.js llama a esto cuando termina de cargar todo desde la nube
window.alIniciarNube = function () {
  generarRecurrentes();
  pintar();
};

// ---------- Periodo ----------
let periodo = 'mes';
let ref = new Date();

function rango() {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  let ini, fin;
  if (periodo === 'dia') { ini = fin = d; }
  else if (periodo === 'semana') {
    const dif = (d.getDay() + 6) % 7; // semana inicia lunes
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

function mover(dir) {
  if (periodo === 'dia') ref.setDate(ref.getDate() + dir);
  else if (periodo === 'semana') ref.setDate(ref.getDate() + 7 * dir);
  else if (periodo === 'mes') ref.setMonth(ref.getMonth() + dir, 1);
  else ref.setFullYear(ref.getFullYear() + dir);
  pintar();
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

// ---------- Etiquetas y métodos ----------
function pintarEtiquetas() {
  const opciones = etiquetas.map(e => `<option>${e}</option>`).join('');
  [selEtiqueta, selPresEtiqueta, selRecEtiqueta].forEach(s => {
    const previa = s.value;
    s.innerHTML = opciones;
    if (etiquetas.includes(previa)) s.value = previa;
  });
}

// extra: se usa al editar un movimiento antiguo ('' = sin método, o un método que ya no está en la lista)
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

// Los ingresos no llevan etiqueta: se oculta ese campo cuando se elige "Ingreso"
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

// Carga un movimiento en el formulario para modificarlo
function editarMov(id) {
  const m = movimientos.find(x => String(x.id) === String(id));
  if (!m) return;

  // Ir a Inicio, donde está el formulario
  document.querySelector('nav button[data-vista="inicio"]').click();

  editandoId = String(m.id);
  pintarEtiquetas();
  pintarMetodos(m.metodo ? (METODOS.includes(m.metodo) ? undefined : m.metodo) : '');

  form.querySelector(`input[name="tipo"][value="${m.tipo}"]`).checked = true;
  actualizarCampos();
  document.getElementById('monto').value = m.monto;
  if (m.tipo === 'gasto') {
    if (!etiquetas.includes(m.etiqueta)) {
      selEtiqueta.insertAdjacentHTML('beforeend', `<option>${m.etiqueta}</option>`);
    }
    selEtiqueta.value = m.etiqueta;
  }
  selMetodo.value = m.metodo || '';
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
    // Edición: se conserva el mismo id, así la nube lo actualiza en vez de duplicarlo
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
// Genera los movimientos de los meses que aún no se han registrado.
// El id es fijo (recurrente + mes) para que dos dispositivos no dupliquen el mismo cobro.
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
          metodo: r.metodo || '',
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
        <small>Cada mes, día ${r.dia}${r.metodo ? ' · ' + r.metodo : ''}${r.nota ? ' · ' + r.nota : ''}</small>
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
    .concat(movsOrdenados().map(m => [m.fecha, m.tipo === 'gasto' ? 'Gasto' : 'Ingreso', m.etiqueta, m.metodo || '', m.monto.toFixed(2), m.nota]));
  const csv = '\ufeff' + filas.map(f => f.map(celda).join(',')).join('\r\n');
  descargar(`mis-gastos-${hoy()}.csv`, csv, 'text/csv;charset=utf-8');
});

document.getElementById('btnExcel').addEventListener('click', () => {
  if (typeof XLSX === 'undefined') return alert('No se pudo cargar la librería de Excel. Recarga la página.');
  if (!movimientos.length) return alert('No hay movimientos para exportar.');

  const hojaMov = [['Fecha', 'Tipo', 'Etiqueta', 'Método de pago', 'Monto (S/)', 'Nota']]
    .concat(movsOrdenados().map(m => [m.fecha, m.tipo === 'gasto' ? 'Gasto' : 'Ingreso', m.etiqueta, m.metodo || '', m.monto, m.nota || '']));
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

// ---------- Pintar inicio ----------
function barras(filas, total) {
  return filas.map(([nombre, monto]) => `
    <div class="barra">
      <div class="top"><span>${nombre}</span><span>${soles(monto)} · ${Math.round(monto / total * 100)}%</span></div>
      <div class="fondo"><div class="relleno" style="width:${monto / total * 100}%"></div></div>
    </div>`).join('');
}

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
        <small>${m.fecha}${m.metodo ? ' · ' + m.metodo : ''}${m.nota ? ' · ' + m.nota : ''}</small>
      </div>
      <div>
        <span class="${m.tipo}-monto">${m.tipo === 'gasto' ? '-' : '+'}${soles(m.monto)}</span>
        <button onclick="editarMov('${m.id}')" title="Editar">✎</button>
        <button onclick="eliminar('${m.id}')" title="Eliminar">×</button>
      </div>
    </li>`).join('') : '<p class="vacio">Sin movimientos en este periodo</p>';

  // Ingresos y gastos: solo del periodo que estás viendo
  const ing = delPeriodo.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0);
  const gastos = delPeriodo.filter(m => m.tipo === 'gasto');
  const gas = gastos.reduce((s, m) => s + m.monto, 0);

  // Saldo: acumulado de todo lo registrado hasta el final del periodo
  const hastaAhora = movimientos.filter(m => m.fecha <= hasta);
  const saldoAcumulado = hastaAhora.reduce((s, m) => s + (m.tipo === 'ingreso' ? m.monto : -m.monto), 0);

  document.getElementById('totalIngresos').textContent = soles(ing);
  document.getElementById('totalGastos').textContent = soles(gas);
  document.getElementById('saldo').textContent = soles(saldoAcumulado);

  // Gastos por etiqueta
  const porEtiq = {};
  gastos.forEach(m => porEtiq[m.etiqueta] = (porEtiq[m.etiqueta] || 0) + m.monto);
  const filas = Object.entries(porEtiq).sort((a, b) => b[1] - a[1]);
  document.getElementById('porEtiqueta').innerHTML = filas.length
    ? barras(filas, gas)
    : '<p class="vacio">Sin gastos en este periodo</p>';

  // Gastos por método de pago
  const porMet = {};
  gastos.forEach(m => { const k = metodoDe(m); porMet[k] = (porMet[k] || 0) + m.monto; });
  const filasMet = Object.entries(porMet).sort((a, b) => b[1] - a[1]);
  document.getElementById('porMetodo').innerHTML = filasMet.length
    ? barras(filasMet, gas)
    : '<p class="vacio">Sin gastos en este periodo</p>';

  // Saldo por método (acumulado hasta el final del periodo)
  const saldoMet = {};
  METODOS.forEach(k => { saldoMet[k] = 0; });
  hastaAhora.forEach(m => {
    const k = metodoDe(m);
    saldoMet[k] = (saldoMet[k] || 0) + (m.tipo === 'ingreso' ? m.monto : -m.monto);
  });
  document.getElementById('saldoMetodos').innerHTML = Object.entries(saldoMet)
    .filter(([k, v]) => METODOS.includes(k) || Math.abs(v) > 0.004)
    .map(([k, v]) => `<div class="caja"><span>${k}</span><strong>${soles(v)}</strong></div>`)
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

  const offset = (new Date(anio, mes, 1).getDay() + 6) % 7; // lunes primero
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
      <div class="info"><strong>${m.etiqueta}</strong><small>${[m.metodo, m.nota].filter(Boolean).join(' · ')}</small></div>
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
pintarEtiquetas();
pintarMetodos();
actualizarCampos();
generarRecurrentes();
pintar();
