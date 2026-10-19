# Selector de millas · Tienda Volar (Itaú)

Prototipo navegable del nuevo selector de millas en la ficha de producto, el carrito y el paso de Entrega del checkout.

**Abrir el prototipo:** <https://imasdev-org.github.io/selector-millas-itau/>

**Reglas para desarrollo:** [docs/especificacion.md](docs/especificacion.md)

## Cómo se usa

La barra de arriba controla el prototipo. Con la flecha de la derecha se pliega a una solapa chica; tocando la solapa vuelve.

| Control | Qué hace |
|---|---|
| **Paso** | Salta a Ficha, Carrito o Entrega. También se puede recorrer tocando la pantalla (Agregar al Carrito, ícono del carrito, Pagar, Ver Carrito Completo, Proceder al Pago, Continuar). **Entrega arranca solo con la consulta de dirección**: al elegir una dirección en el selector aparecen el envío, «Tus millas», «Tu pedido» y el resto, como en el sitio |
| **Vista** | Desktop o Mobile (las dos con envío a domicilio) |
| **Cliente** | Personal Bank o cliente común |
| **Saldo de millas** | Millas disponibles del cliente: 100.000, o 3.000 para ver en Entrega el máximo limitado por el saldo |
| **Notas para desarrollo** | Muestra pines numerados sobre la pantalla y un panel con las reglas de cada parte |

Tocando un lugar de la pantalla que no hace nada se marcan por un momento las zonas que sí responden.

El salteo de Forma de pago (millas que cubren todo con entrega sin costo) no se ve en este recorrido, porque el envío a domicilio cuesta $ 150; está descrito en la especificación.

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

GitHub Pages deja los archivos en la caché del navegador hasta 10 minutos. Antes de cada commit que cambie `css/`, `js/` o `pantallas/`, correr `node herramientas/subir-version.js`: le pone una versión nueva (`?v=fecha-hora`) a los archivos que carga `index.html` para que se descarguen de nuevo.
