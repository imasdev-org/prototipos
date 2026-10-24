# Selector de millas · Tienda Volar (Itaú)

Prototipo navegable de las millas en la ficha de producto (precio en millas, sin selector, en dos diseños), el carrito y el paso de Entrega del checkout (selector de millas).

**Abrir el prototipo:** <https://imasdev-org.github.io/selector-millas-itau/>

**Reglas para desarrollo:** [docs/especificacion.md](docs/especificacion.md)


## Cómo se usa

La barra de arriba controla el prototipo. Con la flecha de la derecha se pliega a una solapa chica; tocando la solapa vuelve.

| Control | Qué hace |
|---|---|
| **Vista** | Desktop o Mobile. En Entrega, «Retiro» y «Envío a domicilio» se eligen con los botones de la pantalla |
| **Paso** | Salta a Ficha, Carrito o Entrega. También se puede recorrer tocando la pantalla (Agregar al Carrito, ícono del carrito, Pagar, Ver Carrito Completo, Proceder al Pago, Continuar). **Entrega arranca solo con la consulta de dirección**: al elegir una dirección en el selector aparecen el envío, «Tus millas», «Tu pedido» y el resto, como en el sitio |
| **Diseño de la ficha** | Solo en el paso Ficha: **En la línea del precio · recomendada** («$ 375  o 720 millas» y, debajo del botón, «Combiná pesos y millas al pagar») o **Recuadro** («Equivale a 720 millas»). El link lleva el elegido: `?ficha=linea` o `?ficha=recuadro` |
| **Cliente** | Personal Bank o cliente común |
| **Saldo de millas** | Millas disponibles del cliente: 100.000, o 3.000 para ver en Entrega el máximo limitado por el saldo |
| **Notas para desarrollo** | Muestra pines numerados sobre la pantalla y un panel con las reglas de cada parte |

Tocando un lugar de la pantalla que no hace nada se marcan por un momento las zonas que sí responden.

**Salteo de Forma de pago** (millas que cubren todo con entrega sin costo): en Entrega tocá «Retiro», elegí la sucursal y tocá «Usar el máximo». La pestaña FORMA DE PAGO se oculta, CONFIRMACIÓN pasa a su lugar y el botón dice «Continuar a Confirmación». Con envío a domicilio no pasa: el envío siempre va con tarjeta.

## Correrlo localmente

Abrir `index.html` en el navegador (no necesita build).

En la vista mobile no hay barra de desplazamiento: se desplaza con el dedo, la rueda o arrastrando con el mouse.

## Estructura

| Carpeta | Contenido |
|---|---|
| `pantallas/` | Pantallas generadas desde Penpot (HTML real: textos, cajas y vectores) |
| `assets/img/` | Fotos de producto y logos del sitio que usan las pantallas |
| `assets/icons/` | Logo Volar del tirador e ícono de la pestaña |
| `js/reglas.js` | Reglas de cálculo (máximo, valor inicial, ahorro, Resumen, salteo del pago) |
| `js/app.js` | Componentes vivos, notas para desarrollo y barra del prototipo |
| `css/prototipo.css` | Estilos de los componentes y del prototipo |
| `docs/especificacion.md` | Especificación para desarrollo |
| `herramientas/` | Exportación desde Penpot y generador de `pantallas/` |

## Regenerar las pantallas desde Penpot

1. Levantar un receptor local en `http://127.0.0.1:8766` que guarde el cuerpo de cada `POST /save?f=<ruta>`.
2. Con la página «WI-13915 · Propuesta» abierta en Penpot, ejecutar `herramientas/penpot-exportar.js` en el plugin (por ejemplo con el MCP de Penpot). Deja un `.json` por tablero y sus imágenes.
3. Copiar los `.json` a `herramientas/penpot/` y correr `node herramientas/construir.js <carpeta con las imágenes>`.

`herramientas/construir.js` define, por pantalla, qué partes reemplaza el prototipo por componentes vivos.

## Publicar

GitHub Pages deja los archivos en la caché del navegador hasta 10 minutos. Para que cada publicación se descargue de nuevo, `index.html` carga los archivos con una versión (`?v=fecha-hora`). Un hook de git la actualiza solo en cada commit; se activa **una vez por clon** con `git config core.hooksPath .githooks` (también se puede correr a mano: `node herramientas/subir-version.js`). La versión cargada se ve en el título de la pestaña. Si la pestaña muestra una versión vieja, falta la caché del propio `index.html` (hasta 10 minutos): recargar con Ctrl + F5.
