# Selector de millas · Tienda Volar (Itaú)

Prototipo navegable del nuevo selector de millas en la ficha de producto, el carrito y el paso de Entrega del checkout.

**Abrir el prototipo:** <https://imasdev-org.github.io/selector-millas-itau/>

**Reglas para desarrollo:** [docs/especificacion.md](docs/especificacion.md)

## Cómo se usa

La barra de arriba controla el prototipo. Con la flecha de la derecha se pliega a una solapa chica; tocando la solapa vuelve.

| Control | Qué hace |
|---|---|
| **Paso** | Salta a Ficha, Carrito o Entrega. También se puede recorrer tocando la pantalla (Agregar al Carrito, ícono del carrito, Pagar, Ver Carrito Completo, Proceder al Pago, Continuar) |
| **Vista** | Desktop (retiro) o Mobile (envío a domicilio) |
| **Cliente** | Personal Bank o cliente común |
| **Saldo de millas** | Millas disponibles del cliente: 100.000, o 3.000 para ver el tope por saldo |
| **Millas elegidas en las fichas → aplicadas al pedido** | Cuántas millas eligió el cliente, sumando las fichas de los productos que tiene en el carrito, y cuántas aplica el pedido. «2.000 → 2.000»: se aplican todas. «6.000 → 4.861 (tope)»: supera el máximo y el pedido aplica solo el máximo (con saldo 3.000, «6.000 → 3.000»). Aparece solo donde tiene efecto (carrito y Entrega) |
| **Notas para desarrollo** | Muestra pines numerados sobre la pantalla y un panel con las reglas de cada parte |

Tocando un lugar de la pantalla que no hace nada se marcan por un momento las zonas que sí responden.

Para probar el salteo de Forma de pago: Vista **Desktop** → **Entrega** → «Usar el máximo».

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
