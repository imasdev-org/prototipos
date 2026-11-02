# Plantilla de prototipos · instrucciones para el asistente

Este repositorio es la base de los prototipos navegables. Para una feature nueva se clona (ver README.md) y se completa.

## Qué se toca y qué no

| Archivo | Qué hacer |
|---|---|
| `js/nucleo.js`, `css/nucleo.css` | **No se editan.** Son la barra, la solapa, la vista Desktop/Mobile con el marco de la pantalla, las notas y la pista de zonas. Si algo del núcleo tiene que cambiar, se cambia acá, en la plantilla, y se lleva a los prototipos que lo necesiten. |
| `js/prototipo.js` | Se reemplaza entero: configuración, pantallas y notas de la feature. |
| `css/prototipo.css` | Se reemplaza: estilos de las pantallas de la feature. Se carga dentro del marco de la pantalla (va en `estilos` de la configuración), no en `index.html`. |
| `index.html` | Solo `<title>` y `<meta name="description">` con el nombre de la feature, y los `<script>` que agregue la feature (por ejemplo `js/reglas.js` o `pantallas/*.js`), siempre **antes** de `js/prototipo.js`. |

## Reglas

1. **Título:** `titulo` en la configuración es el nombre de la feature (se ve en la barra y en la pestaña). El mismo nombre va en el `<title>` de `index.html`.
2. **Barra:** **Vista** (Desktop / Mobile) va siempre primero; la pone el núcleo, no se declara. Con una ventana de menos de 700 px arranca en Mobile; si no, en `vistaInicial`. Mobile tiene el ancho de un teléfono (`mobile.ancho`, 390) y en una ventana de 600 px o menos ocupa todo el ancho: no se agrega un control para elegir el ancho. Después, en `controles`, el **Paso** del recorrido primero y luego los demás controles de la feature (cliente, saldo, etc.). Las opciones se guardan como texto en `estado[id]`: si un valor es un número, convertirlo con `Number()` al usarlo. Un control que cambia algo solo en algunos pasos, vistas o combinaciones lleva `mostrar(estado)`: la barra lo muestra solo cuando devuelve `true` (un control que no hace nada en la pantalla que se ve confunde); oculto, conserva su valor. Lo mismo vale para cada opción: `[valor, rótulo, mostrar(estado)]` la muestra solo cuando devuelve `true` (por ejemplo, un paso que existe solo en Mobile); si el valor actual queda en una opción oculta, pasa a la primera visible. Un control con menos de dos opciones visibles no se muestra. Los controles que prueban **variantes de diseño** (no los del recorrido ni los datos del ejemplo) llevan `variante: true`: van juntos al final de la barra, en un recuadro «Variantes de diseño». A medida que se decide una variante, se saca su control y queda fija la elegida.
3. **Notas para desarrollo:** si la configuración tiene la propiedad `notas`, **hay que completarlas**, no dejar las del ejemplo.
   - Una lista por paso (la clave es el valor del primer control; se puede cambiar con `claveNotas(estado)`).
   - Cada regla, cálculo, medida, color o comportamiento que desarrollo tiene que implementar, con su pin en desktop (`d`) y en mobile (`m`): un selector CSS del elemento (el pin va en su esquina superior izquierda) o `[selector, dx, dy]` para correrlo. `null` si no va en esa vista. Si el selector no encuentra un elemento visible, el pin no se muestra.
   - Verificar cada número contra el código del prototipo antes de escribirlo; lo que no está verificado se marca *a confirmar*.
   - Las notas las puede leer el cliente: sin códigos de issue, sin detalles internos innecesarios.
   - Si la feature no lleva notas, borrar la propiedad `notas`: el botón desaparece de la barra.
4. **Zonas tocables:** todo lo que responde a un toque se marca con `tocable(elemento, etiqueta, acción)`, así aparece en la pista azul que se ve al tocar un lugar vacío. Los demás enlaces y botones de la pantalla no navegan. La pista marca solo lo que se puede tocar en ese momento (dentro de la vista y sin otra capa encima: un diálogo, un panel, la cabecera fija). Lo que se marca tiene que hacer algo en cada estado en que se pueda tocar: si en algún estado no hace nada (por ejemplo, abrir un panel que ya está abierto), ahí no se marca, así tocarlo muestra la pista.
5. **Navegación:** desde un elemento tocable, `Prototipo.ir('paso', 'valor')` cambia de paso; `Prototipo.render()` repinta tras cambiar el estado; `Prototipo.aviso(título, texto, botones)` muestra un aviso, por ejemplo el fin del recorrido.
6. **Pantallas fluidas:** el contenido ocupa todo el ancho hasta un máximo de `desktop.anchoContenido` (1200), centrado: clase `contenido` o `var(--contenido)`. Cada pantalla se dibuja dentro de un marco (iframe) del ancho de la vista, así sus media queries responden a Desktop o Mobile como en un navegador de verdad. Nada de coordenadas fijas ni zoom.
   - `pantalla(estado)` devuelve `{ nodo }` o `{ html }` (el contenido del `<body>`), y si hace falta `cabeza` (los `<link>` y `<style>` propios de esa pantalla), `claseHtml`, `claseCuerpo` y `despues(doc)`, que recibe el documento del marco ya armado para ajustarlo.
   - `estilos` de la configuración: las hojas que se cargan en todas las pantallas, después de `cabeza` (por lo menos `css/prototipo.css`).
   - Si las pantallas salen del HTML real de un sitio: sus estilos e imágenes se copian al clon (por ejemplo, en `sitio/`) para no depender del sitio, y se sacan los scripts, los campos ocultos y los datos personales.
7. **Versión:** activar el hook una vez por clon (`git config core.hooksPath .githooks`). Antes de cada commit pone `?v=fecha-hora` en los archivos de `index.html`, para que GitHub Pages no sirva versiones viejas.
8. **Sin narración por voz:** los prototipos no llevan la pestaña de narración (solo la llevan las explicaciones visuales).
9. **Verificar** en el navegador, en desktop y en mobile y con varios anchos de ventana: la barra (plegar y desplegar), cada paso, las notas con sus pines y la pista de zonas.
