# Selector de millas · Tienda Volar (Itaú)

Prototipo navegable del nuevo selector de millas en la ficha de producto, el carrito y el checkout.

**Abrir el prototipo:** <https://imasdev-org.github.io/selector-millas-itau/>

**Reglas para desarrollo:** [docs/especificacion.md](docs/especificacion.md)

## Cómo se usa

La barra de arriba controla el prototipo:

| Control | Qué hace |
|---|---|
| **Paso** | Salta a Ficha, Carrito, Entrega, Forma de pago o Confirmación. También se puede recorrer tocando la pantalla (Agregar al Carrito, ícono del carrito, Pagar, Continuar, una tarjeta guardada, Confirmar Pedido) |
| **Vista** | Desktop (retiro) o Mobile (envío a domicilio) |
| **Cliente** | Personal Bank o cliente común (aplica a las pantallas del checkout) |
| **Fichas** | Suma de las millas elegidas en las fichas: 2.000, o 6.000 para ver el tope |
| **Notas para desarrollo** | Muestra pines numerados sobre la pantalla y un panel con las reglas de cada parte |
| **Reiniciar** | Vuelve al estado inicial |

Para probar el salteo de Forma de pago: Vista **Desktop** → **Entrega** → «Usar el máximo» → «Continuar a Confirmación».

## Correrlo localmente

Abrir `index.html` en el navegador (no necesita build). Si se prefiere un servidor:

```powershell
npx --yes http-server -p 8080 .
```

## Estructura

| Carpeta | Contenido |
|---|---|
| `assets/screens/` | Capturas de las pantallas diseñadas (Penpot, página «Propuesta») |
| `assets/icons/` | Logo Volar del tirador y chanchito (Lucide `piggy-bank`, licencia ISC) |
| `js/reglas.js` | Reglas de cálculo (máximo, valor inicial, ahorro, Resumen, salteo del pago) |
| `js/app.js` | Componentes, pantallas, notas para desarrollo y barra del prototipo |
| `css/prototipo.css` | Estilos de los componentes nuevos y del prototipo |
| `docs/especificacion.md` | Especificación para desarrollo |
