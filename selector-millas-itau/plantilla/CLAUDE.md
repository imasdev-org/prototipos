# Plantilla de prototipos · instrucciones para el asistente

Esta carpeta es la base de los prototipos navegables. Para una feature nueva se copia la carpeta entera y se completa.

## Qué se toca y qué no

| Archivo | Qué hacer |
|---|---|
| `js/nucleo.js`, `css/nucleo.css` | **No se editan.** Son la barra, la solapa, la vista Desktop/Mobile, las notas y la pista de zonas. Si algo del núcleo tiene que cambiar, se cambia acá, en la plantilla, y se lleva a los prototipos que lo necesiten. |
| `js/prototipo.js` | Se reemplaza entero: configuración, pantallas y notas de la feature. |
| `css/prototipo.css` | Se reemplaza: estilos de las pantallas de la feature. |
| `index.html` | Solo `<title>` y `<meta name="description">` con el nombre de la feature, y los `<script>` que agregue la feature (por ejemplo `js/reglas.js` o `pantallas/*.js`), siempre **antes** de `js/prototipo.js`. |

## Reglas

1. **Título:** `titulo` en la configuración es el nombre de la feature (se ve en la barra y en la pestaña). El mismo nombre va en el `<title>` de `index.html`.
2. **Barra:** **Vista** (Desktop / Mobile) va siempre primero; la pone el núcleo, no se declara. Después, en `controles`, el **Paso** del recorrido primero y luego los demás controles de la feature (cliente, saldo, etc.). Las opciones se guardan como texto en `estado[id]`: si un valor es un número, convertirlo con `Number()` al usarlo.
3. **Notas para desarrollo:** si la configuración tiene la propiedad `notas`, **hay que completarlas**, no dejar las del ejemplo.
   - Una lista por paso (la clave es el valor del primer control; se puede cambiar con `claveNotas(estado)`).
   - Cada regla, cálculo, medida, color o comportamiento que desarrollo tiene que implementar, con su pin en desktop (`d`) y en mobile (`m`), en coordenadas del diseño. `null` si no va en esa vista.
   - Verificar cada número contra el código del prototipo antes de escribirlo; lo que no está verificado se marca *a confirmar*.
   - Las notas las puede leer el cliente: sin códigos de issue, sin detalles internos innecesarios.
   - Si la feature no lleva notas, borrar la propiedad `notas`: el botón desaparece de la barra.
4. **Zonas tocables:** todo lo que responde a un toque se arma con `zona(x, y, w, h, etiqueta, acción)` o lleva la clase `interactivo` (con posición propia), así aparece en la pista azul que se ve al tocar un lugar vacío.
5. **Navegación:** desde una zona, `Prototipo.ir('paso', 'valor')` cambia de paso; `Prototipo.render()` repinta tras cambiar el estado; `Prototipo.aviso(título, texto, botones)` muestra un aviso, por ejemplo el fin del recorrido.
6. **Pantallas:** `pantalla(estado)` devuelve `{ nodo, alto, bandas }` en coordenadas del diseño (desktop `anchoDiseno` × alto con el contenido en `anchoContenido` centrado; mobile `mobile.ancho`). `bandas` son franjas que en desktop llegan a los bordes de la ventana.
7. **Versión:** activar el hook una vez por clon (`git config core.hooksPath .githooks`). Antes de cada commit pone `?v=fecha-hora` en los archivos de `index.html`, para que GitHub Pages no sirva versiones viejas.
8. **Verificar** en el navegador, en desktop y en mobile: la barra (plegar y desplegar), cada paso, las notas con sus pines y la pista de zonas.
