# Carritos por tienda · Tienda Inglesa (web)

Prototipo navegable para que el cliente sepa que cada tienda (Super, Express, TiendaFarma) tiene su propio carrito (WI-13898). El carrito dice de qué tienda es y avisa si hay productos en las otras («Tenés otro carrito en…»). Si el cliente va a otra tienda desde ese aviso, se le pide confirmar el cambio. La lista de tiendas de mobile muestra cuántos productos tiene el carrito de cada una.

**Abrir el prototipo:** <https://imasdev-org.github.io/carritos-por-tienda/>

**Reglas para desarrollo:** en el prototipo, con «Notas para desarrollo» (pines numerados sobre cada pantalla).

## Cómo se usa

La barra de arriba controla el prototipo. Con la flecha de la derecha se pliega a una solapa chica; tocando la solapa vuelve. Cada control aparece solo en las pantallas donde cambia algo.

| Control | Qué hace |
|---|---|
| **Vista** | Desktop o Mobile |
| **Paso** | Lista de tiendas y Menú lateral (solo mobile), Carrito lateral, Página del carrito, Checkout y Confirmar cambio de tienda. También se recorre tocando la pantalla: el logo, el ícono del carrito, Ver Carrito Completo, Pagar, Proceder al Pago y las fichas del aviso |
| **Tienda actual** | Super, Express o TiendaFarma: cambian los colores, los logos y los íconos de la cabecera |
| **Tienda a la que cambia** | En la confirmación, a qué tienda se va (una de las del aviso) |
| **Otras tiendas con productos** | 0, 1 o 2. Con Super como tienda actual se suma primero Express y después TiendaFarma |
| **Notas para desarrollo** | Muestra pines numerados sobre la pantalla y un panel con las reglas de cada parte |

Tocando un lugar de la pantalla que no hace nada se marcan por un momento las zonas que sí responden.

## Qué muestra

- **Carrito lateral y página del carrito:** el título «Tu carrito de &lt;tienda&gt;» y, si otra tienda tiene productos, «Tenés otro carrito en» (o «otros carritos») con una ficha por tienda: isotipo, nombre y cantidad de productos. La ficha lleva al carrito de esa tienda, después de confirmar.
- **Checkout (desktop):** el mismo aviso, en un bloque con el color claro de la tienda debajo del resumen. El checkout mobile no lo lleva.
- **Confirmación del cambio de tienda:** «¿Ir a &lt;tienda&gt;?», «Vas a cambiar de tienda. Tu carrito de &lt;tienda actual&gt; queda guardado.», con «Ir a &lt;tienda&gt;» y «Cancelar». Diálogo en desktop y hoja inferior en mobile. Desde el selector de tiendas (cabecera, lista del logo o menú) el cambio es directo, sin confirmación.
- **Lista de tiendas y menú lateral (mobile):** una pastilla con el ícono del carrito de cada tienda y su cantidad de productos. La tienda actual lleva el ✓ sobre el ícono, el nombre en negrita y el borde del ícono, igual en las dos listas.

Las pantallas son capturas del ambiente de demo, con datos de ejemplo.

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | La página del prototipo |
| `js/prototipo.js` | Las pantallas, los controles y las notas para desarrollo |
| `css/prototipo.css` | Los estilos nuevos (aviso, fichas, confirmación, pastillas) |
| `pantallas/` | Las pantallas capturadas de demo |
| `sitio/` | Hojas de estilo, imágenes, íconos y fuentes del sitio que usan las pantallas |
| `js/nucleo.js`, `css/nucleo.css` | La barra, el marco de la pantalla, las notas y la pista de zonas (de la plantilla de prototipos) |
| `herramientas/` | La captura de las pantallas de demo y el número de versión de los archivos |
