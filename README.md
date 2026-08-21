# Pueblo Cero

Prototipo del mundo 3D. Un solo archivo, sin dependencias que instalar:
Three.js se carga desde un CDN.

## Jugar

Abrí `index.html` en cualquier navegador, o entrá a la dirección de GitHub Pages.

Se juega en **horizontal**. Al tocar «Entrar» se pide pantalla completa y bloqueo
de orientación; si el navegador no lo permite (iPhone, por ejemplo), aparece un
cartel pidiendo girar el teléfono.

- **Mitad izquierda:** caminar. La palanca aparece donde ponés el dedo.
- **Mitad derecha:** girar la cámara. Mirá al cielo, al piso y alrededor.
- **Computadora:** WASD o flechas para caminar, arrastrar con el ratón para mirar.

La cámara la manejás sólo vos: caminar no la mueve. Si vas hacia atrás, el muñeco
gira el cuerpo y camina para atrás, pero la vista se queda donde la dejaste.

## Qué hay en este prototipo

El Centro (zona segura, comida y ropa gratis), ocho lotes vacíos alrededor y los
caminos que los unen.

Alrededor, un bosque generado: árboles frondosos y pinos, en seis tonos de verde
mezclados entre sí y en alturas muy distintas. El terreno ondula, hay dos lagunas
con orillas de arena, y el pasto tiene manchones más claros y más oscuros.

Nada de esto usa modelos ni texturas descargadas: todo se genera con formas
básicas. El bosque es siempre el mismo porque el azar tiene semilla fija.

## Qué NO hay todavía, a propósito

Economía, elecciones, tesoro, robo y otros jugadores. Todo eso es lógica de
servidor y se construye después.

Este prototipo responde una sola pregunta, que es la que conviene responder antes
de gastar meses: **¿se siente bien caminar por este pueblo en un teléfono?**
