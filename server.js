'use strict';

/**
 * Servidor de Pueblo Cero.
 *
 * Hace dos cosas y nada más: sirve el juego y reparte las posiciones de quienes
 * están conectados. No simula el mundo, no valida el movimiento, no guarda nada.
 *
 * Eso es a propósito para este prototipo: la pregunta que hay que responder es
 * si dos personas se ven y se sienten en el mismo lugar. Un servidor con
 * autoridad sobre las posiciones —el que hace falta cuando hay dinero y robos
 * de por medio— es mucho más trabajo y no responde esa pregunta más rápido.
 *
 * Consecuencia que conviene saber desde ahora: cualquiera podría trucar su
 * posición. Da igual mientras se prueba entre conocidos; cuando el juego tenga
 * economía, el servidor tiene que pasar a decidir él dónde está cada uno.
 */

const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const servidor = http.createServer(app);
const io = new Server(servidor, {
  // El juego se sirve desde este mismo servidor, así que no hace falta abrir
  // el origen a nadie más.
  cors: { origin: false }
});

const PUERTO = process.env.PORT || 3000;
const MAX_JUGADORES = 30;

// Cada cuánto se reparte el estado. 15 veces por segundo alcanza de sobra:
// el cliente suaviza entre un aviso y el siguiente, así que mandar 60 sólo
// gastaría datos del teléfono sin que nadie note la diferencia.
const HZ = 15;

app.use(express.static(path.join(__dirname, 'public'), { maxAge: '5m' }));

// Para saber si el servidor está vivo sin abrir el juego.
app.get('/salud', (_req, res) => {
  res.json({ ok: true, jugadores: jugadores.size, tope: MAX_JUGADORES });
});

/** id -> { nombre, color, x, y, z, rumbo, visto } */
const jugadores = new Map();

const COLORES = [
  0x2f6ea8, 0xa8442f, 0x2f8a5c, 0x8a6a2f,
  0x6a2f8a, 0x2f8a8a, 0xa82f6e, 0x4a4a4a
];

function limpiarNombre(valor) {
  if (typeof valor !== 'string') return 'Alguien';
  // Sin saltos de línea ni nombres larguísimos: el nombre se dibuja arriba de
  // la cabeza de todos, así que un nombre de 200 caracteres le arruina la
  // pantalla al resto, no a quien lo eligió.
  const limpio = valor.replace(/\s+/g, ' ').trim().slice(0, 16);
  return limpio.length ? limpio : 'Alguien';
}

/** Un número que sea un número. Descarta NaN, infinitos y textos. */
function numero(valor, tope) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-tope, Math.min(tope, n));
}

io.on('connection', (socket) => {
  if (jugadores.size >= MAX_JUGADORES) {
    socket.emit('lleno', { tope: MAX_JUGADORES });
    socket.disconnect(true);
    return;
  }

  const color = COLORES[jugadores.size % COLORES.length];

  socket.on('entrar', (datos) => {
    if (jugadores.has(socket.id)) return;      // ya entró
    jugadores.set(socket.id, {
      nombre: limpiarNombre(datos && datos.nombre),
      color,
      x: 0, y: 0, z: 16, rumbo: Math.PI,
      visto: Date.now()
    });
    socket.emit('bienvenida', { id: socket.id, color });
    console.log('entró', socket.id, '· conectados:', jugadores.size);
  });

  socket.on('mover', (d) => {
    const j = jugadores.get(socket.id);
    if (!j || !d) return;
    // Los topes son los mismos que los del mundo. No es antitrampas —para eso
    // haría falta un servidor con autoridad— pero evita que un cliente roto
    // mande coordenadas absurdas y rompa la pantalla de todos los demás.
    j.x = numero(d.x, 120);
    j.y = numero(d.y, 60);
    j.z = numero(d.z, 120);
    j.rumbo = numero(d.rumbo, 10);
    j.caminando = !!d.caminando;
    j.visto = Date.now();
  });

  socket.on('disconnect', () => {
    jugadores.delete(socket.id);
    io.emit('sale', socket.id);
    console.log('salió', socket.id, '· conectados:', jugadores.size);
  });
});

/* Reparto periódico. Se manda todo el estado en cada vuelta, en vez de sólo
   lo que cambió: con treinta jugadores son unos pocos kilobytes por segundo, y
   evita que alguien quede desincronizado para siempre por haberse perdido un
   único aviso. */
setInterval(() => {
  if (!jugadores.size) return;

  const estado = [];
  for (const [id, j] of jugadores) {
    estado.push([id, j.nombre, j.color, +j.x.toFixed(2), +j.y.toFixed(2), +j.z.toFixed(2), +j.rumbo.toFixed(2), j.caminando ? 1 : 0]);
  }
  io.emit('estado', estado);
}, 1000 / HZ);

/* Barrido de fantasmas. Si un teléfono se queda sin señal, el socket puede
   tardar en cerrarse y su muñeco quedaría parado en el mapa. */
setInterval(() => {
  const ahora = Date.now();
  for (const [id, j] of jugadores) {
    if (ahora - j.visto > 30000) {
      jugadores.delete(id);
      io.emit('sale', id);
      console.log('fantasma quitado', id);
    }
  }
}, 10000);

servidor.listen(PUERTO, () => {
  console.log('Pueblo Cero escuchando en el puerto ' + PUERTO);
});
