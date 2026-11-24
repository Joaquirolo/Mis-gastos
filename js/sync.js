import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, deleteDoc, getDoc, getDocs, onSnapshot, writeBatch
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkdhzLlv0CLp1ezG4XcF4wYPQ1mH0cn4Y",
  authDomain: "mis-gastos-5a2ab.firebaseapp.com",
  projectId: "mis-gastos-5a2ab",
  storageBucket: "mis-gastos-5a2ab.firebasestorage.app",
  messagingSenderId: "313704549993",
  appId: "1:313704549993:web:cc7a7b351ec20240f9dcf8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

const estado = document.getElementById('nubeEstado');
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');

let uid = null;
let desuscribir = [];

const limpiar = o => JSON.parse(JSON.stringify(o));
const refMovs = () => collection(db, 'usuarios', uid, 'movimientos');
const refConfig = () => doc(db, 'usuarios', uid, 'app', 'config');
const refRespaldos = () => collection(db, 'usuarios', uid, 'respaldos');
const refRespaldoMeta = () => doc(db, 'usuarios', uid, 'app', 'respaldo');

function lotes(ops) {
  const promesas = [];
  for (let i = 0; i < ops.length; i += 400) {
    const b = writeBatch(db);
    ops.slice(i, i + 400).forEach(op => op(b));
    promesas.push(b.commit());
  }
  return Promise.all(promesas);
}

window.nube = {
  activo: false,
  guardarMov(m) {
    if (!uid) return;
    setDoc(doc(refMovs(), String(m.id)), limpiar(m)).catch(console.error);
  },
  borrarMov(id) {
    if (!uid) return;
    deleteDoc(doc(refMovs(), String(id))).catch(console.error);
  },
  guardarConfig(c) {
    if (!uid) return;
    setDoc(refConfig(), { ...limpiar(c), actualizado: Date.now() }).catch(console.error);
  },
  async reemplazarTodo(movs, cfg) {
    if (!uid) return;
    let enNube = [];
    try { enNube = (await getDocs(refMovs())).docs; } catch (e) { console.error(e); }
    const ids = new Set(movs.map(m => String(m.id)));
    const ops = [];
    enNube.forEach(d => { if (!ids.has(d.id)) ops.push(b => b.delete(d.ref)); });
    movs.forEach(m => ops.push(b => b.set(doc(refMovs(), String(m.id)), limpiar(m))));
    ops.push(b => b.set(refConfig(), { ...limpiar(cfg), actualizado: Date.now() }));
    await Promise.race([lotes(ops), new Promise(r => setTimeout(r, 4000))]);
  },
  async necesitaRespaldoSemanal() {
    if (!uid) return false;
    try {
      const snap = await getDoc(refRespaldoMeta());
      const ultimo = snap.exists() ? snap.data().ultimo : null;
      if (!ultimo) return true;
      const dias = (Date.now() - new Date(ultimo).getTime()) / 86400000;
      return dias >= 7;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  async guardarRespaldoSemanal(datos) {
    if (!uid) return;
    try {
      const fecha = new Date().toISOString().slice(0, 10);
      await setDoc(doc(refRespaldos(), fecha), { ...limpiar(datos), fecha, creado: Date.now() });
      await setDoc(refRespaldoMeta(), { ultimo: fecha });
    } catch (e) {
      console.error(e);
    }
  },
  async obtenerUltimoRespaldo() {
    if (!uid) return null;
    try {
      const snap = await getDoc(refRespaldoMeta());
      if (!snap.exists() || !snap.data().ultimo) return null;
      const docSnap = await getDoc(doc(refRespaldos(), snap.data().ultimo));
      return docSnap.exists() ? docSnap.data() : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
};

function fusionarConfig(local, nube) {
  if (!nube) return local;
  const porId = (a = [], b = []) => {
    const m = new Map();
    a.forEach(x => m.set(x.id, x));
    b.forEach(x => m.set(x.id, x));
    return [...m.values()];
  };
  return {
    etiquetas: [...new Set([...(nube.etiquetas || []), ...(local.etiquetas || [])])],
    presupuestos: { ...local.presupuestos, ...(nube.presupuestos || {}) },
    recurrentes: porId(local.recurrentes, nube.recurrentes),
    metas: porId(local.metas, nube.metas)
  };
}

async function primeraFusion() {
  const clave = 'sync_ok_' + uid;
  if (localStorage.getItem(clave)) return true;
  if (!navigator.onLine) return false;
  try {
    const [snapMovs, snapCfg] = await Promise.all([getDocs(refMovs()), getDoc(refConfig())]);
    const enNube = new Set(snapMovs.docs.map(d => d.id));
    const datos = window.obtenerDatos();

    const ops = datos.movimientos
      .filter(m => !enNube.has(String(m.id)))
      .map(m => b => b.set(doc(refMovs(), String(m.id)), limpiar(m)));

    const cfg = fusionarConfig(
      { etiquetas: datos.etiquetas, presupuestos: datos.presupuestos, recurrentes: datos.recurrentes, metas: datos.metas },
      snapCfg.exists() ? snapCfg.data() : null
    );
    ops.push(b => b.set(refConfig(), { ...limpiar(cfg), actualizado: Date.now() }));

    lotes(ops).catch(console.error);
    localStorage.setItem(clave, '1');
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

function marcar(meta) {
  const base = 'Conectado: ' + (auth.currentUser?.email || '');
  estado.textContent = meta.hasPendingWrites ? base + ' · subiendo cambios…'
    : meta.fromCache ? base + ' · sin conexión'
    : base + ' · sincronizado ✓';
}

function escuchar() {
  let listoM = false, listoC = false, avisado = false;
  const avisar = () => {
    if (listoM && listoC && !avisado) { avisado = true; window.alIniciarNube?.(); }
  };

  desuscribir.push(onSnapshot(refMovs(), snap => {
    if (!(snap.empty && snap.metadata.fromCache)) {
      window.aplicarNube({ movimientos: snap.docs.map(d => d.data()) });
    }
    listoM = true;
    marcar(snap.metadata);
    avisar();
  }, err => { console.error(err); estado.textContent = 'Error de sincronización: ' + err.code; }));

  desuscribir.push(onSnapshot(refConfig(), snap => {
    if (snap.exists()) window.aplicarNube({ config: snap.data() });
    listoC = true;
    avisar();
  }, err => console.error(err)));
}

async function iniciar(user) {
  desuscribir.forEach(f => f());
  desuscribir = [];
  uid = user.uid;
  window.nube.activo = true;
  btnLogin.hidden = true;
  btnLogout.hidden = false;
  estado.textContent = 'Sincronizando…';
  const ok = await primeraFusion();
  if (ok) escuchar();
  else estado.textContent = 'Sin conexión. Se sincronizará al reconectar.';
}

onAuthStateChanged(auth, user => {
  if (!user) {
    desuscribir.forEach(f => f());
    desuscribir = [];
    uid = null;
    window.nube.activo = false;
    estado.textContent = 'Sin sesión: tus datos están solo en este dispositivo.';
    btnLogin.hidden = false;
    btnLogout.hidden = true;
    return;
  }
  iniciar(user);
});

window.addEventListener('online', () => {
  if (auth.currentUser && !desuscribir.length) iniciar(auth.currentUser);
});

btnLogin.addEventListener('click', async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (e) {
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
      alert('No se pudo iniciar sesión: ' + e.code);
    }
  }
});

btnLogout.addEventListener('click', async () => {
  if (confirm('¿Cerrar sesión? Tus datos seguirán guardados en este dispositivo.')) {
    await signOut(auth);
  }
});
