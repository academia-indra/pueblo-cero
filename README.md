# Pueblo Cero — servidor

Prototipo multijugador. El servidor sirve el juego y reparte las posiciones de
quienes están conectados.

## Probar en tu computadora

```bash
npm install
npm start
```

Abrí `http://localhost:3000`. Para probar de a dos sin otra persona, abrí una
segunda pestaña en incógnito.

## Subir a Railway

1. Subí esta carpeta a un repositorio de GitHub.
2. En railway.com: **New Project** → **Deploy from GitHub repo** → elegí el repo.
3. Railway detecta Node solo y corre `npm start`. No hay variables que cargar:
   el puerto lo toma de `PORT`, que Railway define por su cuenta.
4. En **Settings → Networking**, si no hay dominio público, tocá
   **Generate Domain**.

El enlace que te da Railway es el que compartís. Cualquiera lo abre desde el
celular, sin instalar nada.

Para comprobar que está vivo sin abrir el juego: `TU-DOMINIO/salud`

## Probar la lógica del servidor

```bash
node test-servidor.js
```

Conecta jugadores falsos y comprueba nombres, topes, entradas, salidas y datos
basura. No necesita red.

## Qué hace y qué no

El servidor **reparte** posiciones: no simula el mundo ni valida el movimiento.
Para un prototipo entre conocidos alcanza, pero significa que alguien podría
trucar su posición. Cuando el juego tenga economía y robos, el servidor tiene
que pasar a decidir él dónde está cada uno.
