'use strict';
/**
 * Prueba del servidor sin red.
 *
 * Reemplaza express y socket.io por sustitutos mínimos y conecta jugadores
 * falsos. Comprueba lo que escribí yo —nombres, topes, entradas y salidas,
 * fantasmas— que es donde puede haber errores míos; no comprueba las
 * librerías, que ya están probadas por sus autores.
 *
 *   node test-servidor.js
 */

const assert = require('assert');
const { Server } = require('socket.io');

// server.js llama a listen(); se anula para que la prueba no se quede colgada.
const http = require('http');
const crearOriginal = http.createServer;
http.createServer = function () {
  const s = crearOriginal.apply(this, arguments);
  s.listen = function (_p, cb) { if (cb) cb(); return s; };
  return s;
};

const io = new Server();
// server.js crea su propio Server; se intercepta para quedarse con esa instancia.
let ioReal = null;
const ServerOriginal = Server;
require('socket.io').Server = class extends ServerOriginal {
  constructor(...a) { super(...a); ioReal = this; }
};

require('./server.js');

function clienteFalso(id) {
  const manejadores = {};
  return {
    id: id,
    recibidos: [],
    on(ev, fn) { manejadores[ev] = fn; },
    emit(ev, datos) { this.recibidos.push([ev, datos]); },
    disconnect() { this.desconectado = true; },
    disparar(ev, datos) { if (manejadores[ev]) manejadores[ev](datos); },
    tiene(ev) { return !!manejadores[ev]; }
  };
}

let ok = 0;
function comprobar(nombre, cond) {
  console.log((cond ? '  OK  ' : '  MAL ') + nombre);
  if (cond) ok++;
  else process.exitCode = 1;
}

function ultimoEstado() {
  for (let i = ioReal.emitidos.length - 1; i >= 0; i--) {
    if (ioReal.emitidos[i][0] === 'estado') return ioReal.emitidos[i][1];
  }
  return null;
}

console.log('\nServidor de Pueblo Cero\n');

/* ── Entrada ─────────────────────────────────────────────────────────────── */
const a = clienteFalso('aaa');
ioReal.alConectar(a);
a.disparar('entrar', { nombre: '  Emma  nuel  ' });

const bienvenida = a.recibidos.find(r => r[0] === 'bienvenida');
comprobar('quien entra recibe su id y su color', !!bienvenida && bienvenida[1].id === 'aaa');

/* ── Nombres ─────────────────────────────────────────────────────────────── */
a.disparar('mover', { x: 5, y: 0, z: 5, rumbo: 1 });
// Forzar un reparto leyendo el intervalo: se espera un ciclo.
setTimeout(() => {
  const est = ultimoEstado();
  comprobar('el estado incluye al jugador', !!est && est.length === 1);
  comprobar('el nombre se limpia de espacios de más', est[0][1] === 'Emma nuel');

  /* ── Números basura ────────────────────────────────────────────────────── */
  a.disparar('mover', { x: 'hola', y: NaN, z: Infinity, rumbo: undefined });
  setTimeout(() => {
    const e2 = ultimoEstado()[0];
    comprobar('un texto como coordenada no rompe nada', Number.isFinite(e2[3]));
    comprobar('NaN no se propaga', Number.isFinite(e2[4]));
    comprobar('Infinity queda acotado al tamaño del mundo', Math.abs(e2[5]) <= 120);

    /* ── Fuera de rango ──────────────────────────────────────────────────── */
    a.disparar('mover', { x: 99999, y: 0, z: -99999, rumbo: 0 });
    setTimeout(() => {
      const e3 = ultimoEstado()[0];
      comprobar('no se puede teletransportar fuera del mundo',
        Math.abs(e3[3]) <= 120 && Math.abs(e3[5]) <= 120);

      /* ── Nombre vacío ──────────────────────────────────────────────────── */
      const b = clienteFalso('bbb');
      ioReal.alConectar(b);
      b.disparar('entrar', { nombre: '   ' });
      setTimeout(() => {
        const est2 = ultimoEstado();
        comprobar('hay dos jugadores', est2.length === 2);
        const suB = est2.find(x => x[0] === 'bbb');
        comprobar('un nombre vacío recibe uno por defecto', suB[1] === 'Alguien');
        comprobar('dos jugadores reciben colores distintos', est2[0][2] !== est2[1][2]);

        /* ── Entrar dos veces ────────────────────────────────────────────── */
        b.disparar('entrar', { nombre: 'otro' });
        setTimeout(() => {
          comprobar('entrar dos veces no duplica al jugador', ultimoEstado().length === 2);

          /* ── Salida ──────────────────────────────────────────────────────── */
          a.disparar('disconnect');
          setTimeout(() => {
            const est3 = ultimoEstado();
            comprobar('al desconectarse desaparece del estado',
              est3.length === 1 && est3[0][0] === 'bbb');
            const aviso = ioReal.emitidos.filter(r => r[0] === 'sale').pop();
            comprobar('se avisa a los demás quién salió', aviso && aviso[1] === 'aaa');

            /* ── Tope de jugadores ───────────────────────────────────────── */
            const extras = [];
            for (let i = 0; i < 40; i++) {
              const c = clienteFalso('c' + i);
              ioReal.alConectar(c);
              c.disparar('entrar', { nombre: 'j' + i });
              extras.push(c);
            }
            setTimeout(() => {
              const est4 = ultimoEstado();
              comprobar('el tope de 30 jugadores se respeta', est4.length <= 30);
              const rechazado = extras.some(c => c.recibidos.some(r => r[0] === 'lleno'));
              comprobar('a quien sobra se le avisa que está lleno', rechazado);
              const cortado = extras.some(c => c.desconectado);
              comprobar('a quien sobra se lo desconecta', cortado);

              console.log('\n' + ok + ' comprobaciones correctas\n');
              process.exit(process.exitCode || 0);
            }, 90);
          }, 90);
        }, 90);
      }, 90);
    }, 90);
  }, 90);
}, 90);
