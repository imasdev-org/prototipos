# Selector de millas · Tienda Volar (Itaú) — especificación para desarrollo

Prototipo navegable: <https://imasdev-org.github.io/selector-millas-itau/>

Este documento acompaña al prototipo. El prototipo muestra **cómo se ve y se comporta**; acá están las **reglas** con sus fórmulas. Lo que figura como *a confirmar* todavía no está decidido.

## 1. Qué cambia

| Lugar | Hoy | Propuesta |
|---|---|---|
| Ficha de producto | Control de millas con «Usar disponibles» | Mismo control, botón **«Usar el máximo»** que funciona como interruptor y escala «0 … Máximo para este producto: N». Sigue siendo un **semi-simulador** |
| Carrito lateral y carrito completo | Suma lo elegido en las fichas **sin tope** | Misma suma, **con tope** (saldo y máximo del pedido) |
| Checkout · Entrega | — | Tarjeta nueva **«Tus millas»** antes de «Tu pedido»: control, campo, «Usar el máximo» y etiqueta «Ahorrás $ X» |
| Resumen del carrito completo y del checkout (desktop) | Se va con el scroll | **Fijo al hacer scroll** (`position: sticky`) |
| Checkout · Forma de pago | Siempre | **Se saltea** si las millas cubren todo y la entrega no tiene costo |

## 2. Reglas de cálculo

Referencia ejecutable: [`js/reglas.js`](../js/reglas.js) (el prototipo calcula todos sus números con esas funciones).

| Concepto | Regla | Ejemplo del prototipo |
|---|---|---|
| Cotización | 1,92 millas por peso | $ 50 = 96 millas |
| Máximo en la **ficha** | `round(precio sin promoción × 1,92)` — en la ficha no se conocen los descuentos | $ 417 → **801** |
| Valor por defecto en la ficha | La mitad del máximo (sin cambios respecto de hoy) | 400 |
| Precio en la ficha | `max(0, round(precio sin promoción − millas ÷ 1,92))` | 400 millas → **$ 209** |
| Máximo del **pedido** | `min(saldo, floor(total de productos con descuentos × 1,92))` | $ 2.532 → **4.861** (cliente común $ 2.542 → 4.880) |
| Valor inicial en el checkout | `min(suma de lo elegido en las fichas, máximo del pedido)` | 2.000 → 2.000 · «Usar el máximo» en las tres fichas: 4.880 → **4.861** |
| Orden | Las millas se aplican **después** de los descuentos (no pagan promociones y así no se usan de más) | — |
| Envío / preparación | **No** se paga con millas (por ahora) | — |
| Ahorro | `round(millas ÷ 1,92)` | 2.000 → **$ 1.042** |
| Mínimo de canje | No hay | — |

### Resumen de compra (mismo cálculo que hoy)

- **SubTotal** = productos antes de descuentos − valor en pesos de las millas (los descuentos se restan en su propia fila).
- **Descuentos** en su fila; **Millas aplicadas** en su fila, con la cantidad (no en pesos). Hoy ese rótulo dice «millas»; el nuevo va con mayúscula como el resto de las filas y explica por qué el SubTotal ya viene descontado. Aplica al Resumen del carrito y del checkout.
- **Total** = SubTotal − Descuentos + entrega.
- Con todo cubierto por millas: **SubTotal $ 0** y **sin fila de Descuentos**.

Ejemplo (Personal Bank, envío a domicilio): 2.000 millas → SubTotal $ 1.500 · Descuentos $ -10 · Gastos de Envío $ 150 · Millas aplicadas 2.000 · **Total $ 1.640**.

Con envío a domicilio, el título del Resumen dice «Con $ X más el envío es gratis», como hoy en el sitio, en lugar de «RESUMEN». En una captura del sitio se ve «Con $ 3.000 más» con SubTotal $ 0, de donde sale X = $ 3.000 − SubTotal (ya descontadas las millas). *Umbral y cálculo inferidos de esa captura: a confirmar.*

### Cuándo se saltea Forma de pago

Solo si **las millas cubren todo** y **la entrega cuesta $ 0**. En ese caso:

- la pestaña FORMA DE PAGO se oculta **como hoy**: `wCheckout` pone la clase `PaymentTabHidden` y `ItauWeb.css` tiene `.PaymentTabHidden .PaymentTab { display: none; }` *(verificado en la KB, 15/10)*;
- la pestaña CONFIRMACIÓN pasa al lugar de FORMA DE PAGO, como hoy en el sitio *(captura del sitio del 16/10)*;
- el botón de Entrega dice **«Continuar a Confirmación»** y lleva directo a Confirmación.

Con envío a domicilio el envío siempre se paga con tarjeta: **no se saltea**.

## 3. Pantalla por pantalla

**Tipografía:** todos los textos del sitio van en **Myriad Pro**, como hoy (`MyriadPro-Regular`, `-Light`, `-Semibold` y `-Bold`, declaradas con `@font-face` en `webapp/Itau/static/hanoi.sass`). En Penpot los textos están en Source Sans 3 porque Penpot no tiene Myriad Pro; el prototipo usa Myriad Pro si está instalada en el equipo y, si no, Source Sans 3.

**Campo de millas en foco** (ficha y Entrega): el borde y una aureola difuminada toman el mismo color, el naranja de los botones con transparencia: `border-color: rgba(255, 98, 0, .2); box-shadow: 0 0 6px 3px rgba(255, 98, 0, .2)`.

### Ficha de producto

- Precio en vivo «$ X + N millas» (26/700 y 17/600): en Personal Bank todo en azul marino `#000D3C`; en cliente común los pesos en naranja `#FF6200` y las millas en gris `#5F6062`, como hoy para quien no es Personal Bank.
- Control, campo y botón **sincronizados**; el valor se acota entre 0 y 801.
- **«Usar el máximo»** es un interruptor: al activarlo guarda el valor anterior y pone el máximo; al desactivarlo vuelve al valor anterior. Si se mueve el control o se edita el campo, se desactiva.
  - Normal: fondo blanco, borde 1 px `#FF6200`, texto `#DE5500`.
  - Activo: fondo `#FEEEE3`, borde 2 px `#DE5500` y texto en semibold (600), como hoy. `aria-pressed="true"`.
  - La frase **no cambia de ancho** al activarse: el estado normal lleva `letter-spacing: .017em`, que en Myriad Pro 14 px la lleva de 89,7 a 93 px, lo mismo que mide en semibold. Sin esa compensación, la frase se ensancha un 3,7 % y se mueve.
- Título «ELEGÍ LAS MILLAS A USAR»: 12 px, `font-weight: 600`, `#464646`, `letter-spacing: .04em`. Subtítulo «Tus millas disponibles: **N**»: 12 px `#767676` con el número en 600 `#464646` (mismo criterio que «Millas disponibles» en Entrega).
- Orden del selector: «ELEGÍ LAS MILLAS A USAR» → «Tus millas disponibles: N» → control con su escala → campo y «Usar el máximo» → aclaración. El saldo va arriba del control porque es un dato para decidir, igual que en la tarjeta de Entrega (pregunta → saldo → control).
- Aclaración **siempre visible** como texto de ayuda justo debajo del campo: «Es un estimado: al pagar se ajusta al total del pedido y a tus millas.» (12 px `#767676`; puede ocupar dos renglones). Va visible y no en un tooltip: es lo que evita la sorpresa al pagar, y en mobile un tooltip pide un toque que casi nadie da. Queda inmediatamente antes de «Agregar al Carrito».
- **«Agregar al Carrito»** solo sube el contador del ícono; el carrito lateral se abre tocando el ícono.
- Lo elegido se guarda en el producto y se suma en el checkout.
- Menú de usuario del encabezado (desktop), como en el sitio: etiqueta «Personal» (fondo `#000D3C`, texto blanco 9 px), nombre (14/300) y saldo «100.000 millas» (12/600 `#FF6200`) alineados a la derecha. El cliente común no lleva la etiqueta «Personal»; en mobile, tampoco el ícono PB.

### Carrito lateral y carrito completo

- Encabezado «$ X + N millas»: N = valor inicial del checkout (suma de las fichas **con tope**). Hoy el sitio suma sin tope (caso real: 8.324 millas con saldo 6.058).
- Por el tope, el carrito puede mostrar **menos millas que las elegidas en las fichas**. Pasa en dos casos:
  - **Descuentos** (tope por el máximo del pedido): la ficha calcula su máximo sin descuentos y el pedido, con descuentos. El aceite solo, con «Usar el máximo» en la ficha (801), aplica 720 en el carrito ($ 375 × 1,92). Con el carrito del prototipo, «Usar el máximo» en las tres fichas suma 4.880 (157 + 192 + 4.531) y el pedido aplica 4.861, por el descuento de Personal Bank del cuchillo ($ 100 → $ 90). Con cliente común no hay descuento y entran las 4.880.
  - **Saldo insuficiente**: la suma de lo elegido en las fichas supera el saldo. Caso real de producción: 8.324 millas elegidas con un saldo de 6.058.
  - El carrito no muestra un aviso: la aclaración de la ficha ya anticipa que es un estimado.
- Sin millas por producto en las líneas.
- El Resumen del carrito completo usa el mismo cálculo que el checkout.
- En desktop, la caja del Resumen del carrito completo queda **fija al hacer scroll**, igual que en el checkout. **Hoy no lo está** *(verificado en la KB trunk: `wCartFull`, `wCartFullWC` y `wCartSummary` no tienen ninguna clase sticky; la única del carrito es `wStickyEmptyCart`, del carrito lateral)*.
- Su título «RESUMEN» va centrado en vertical en su franja: hoy queda bajo y la línea gris lo corta.
- Cliente común: sin precio ni etiqueta «Con Personal Bank» (en el ejemplo, el cuchillo vale $ 100 en lugar de $ 90) y sin fila de Descuentos.

### Checkout · Entrega

- Tarjeta **«Tus millas»** después del tipo de entrega y la sucursal o dirección (ahí el monto a pagar ya es definitivo) y **antes de «Tu pedido»**.
  - Mismo lenguaje que «Tu pedido»: fondo blanco, radio 15, sombra `0 0 2px #CCCCCC`, banda `#3E3F40` (35 px desktop, 46 px mobile) con el título en 16/700 blanco.
  - Pregunta «¿Cuántas millas querés usar?» (18 px `#464646`) y «Millas disponibles: **100.000**» (14 px).
  - Control (desktop 470 px, mobile 305 px) con escala «0 … Máximo para este pedido: N» (12 px `#767676`).
  - Campo (166 × 34 desktop, 154 × 34 mobile; borde `#CCCCCC`, radio 4, valor 16/400 alineado a la derecha + «millas»).
  - «Usar el máximo»: el mismo componente de la ficha, alto 34 y radio 4.
  - Etiqueta **«Ahorrás $ X»** arriba a la derecha (alto 26, radio 4, ícono Lucide `piggy-bank` 16 px; monto con `font-weight: 600`). Se muestra **una sola vez**.
  - La etiqueta es **híbrida**: tiene un **ancho mínimo de cuatro cifras**, el de «Ahorrás $ 9.999» (≈ 132 px con Myriad Pro 14 px; margen interno 8 px a la izquierda y 10 a la derecha), y queda anclada a la derecha de la tarjeta. «Ahorrás» y el ícono quedan fijos y el monto va **alineado a la derecha** (como las filas del Resumen): hasta `$ 9.999`, ganar o perder cifras solo cambia la separación entre «Ahorrás» y el monto. Con **cinco cifras o más** la etiqueta crece hacia la izquierda (7,5 px por cifra, 10,9 px con el punto de los miles) y el ícono desliza. En los dos casos **cada cifra y el punto de los miles entran o salen animando su ancho y su opacidad** (≈ 250 ms, `cubic-bezier(.3,.7,.3,1)`; el ancho con `grid-template-columns: 0fr ↔ 1fr`, sin medir nada con JS), así que no hay saltos. Un texto fantasma invisible con el monto más ancho esperado fija el ancho mínimo y se adapta a la fuente. Las cifras que siguen en su lugar cambian de valor sin animarse (dígitos tabulares); las que se van arrancan casi transparentes para no mostrar un instante un número equivocado; el número se compara **desde la derecha**. Un texto solo para lectores de pantalla («Ahorrás $ X») evita que se lean las cifras sueltas; lo visual va con `aria-hidden`. El mismo elemento se actualiza (no se recrea) para poder animar. Con el valor por defecto del checkout (2.000 millas, `$ 1.042`) el ícono no se mueve al ajustar el control alrededor del umbral de `$ 1.000`. **La animación no depende del ajuste de animaciones del sistema:** se anima siempre, también con `prefers-reduced-motion: reduce` (no hay que condicionarla a esa media query). Decisión de diseño: el movimiento es mínimo (7,5 a 10,9 px en ≈ 250 ms) y Windows desactiva las animaciones por defecto en sesiones de Escritorio Remoto y equipos virtualizados, con lo que el efecto no se vería. Verificado en el prototipo con ese ajuste activo en el sistema: la transición CSS corre igual; solo la media query la apagaba. Un texto solo para lectores de pantalla («Ahorrás $ X») evita que se lean las cifras sueltas; lo visual va con `aria-hidden`. El mismo elemento se actualiza (no se recrea) para poder animar.
- «Continuar» pasa a Forma de pago, o a Confirmación si se salteó el pago. En el prototipo, ahí termina el recorrido.
- Mobile: debajo del campo, divisoria y **«Total a pagar con tarjeta $ X»** = total + envío (rótulo 14/700 `#464646`, monto 16/700) (en mobile el Resumen no está en este paso: su columna es `hidden-xs hidden-sm`).
- Teclado en el control: flechas ±10, Shift + flechas ±100, RePág/AvPág ±10 %, Inicio/Fin.

### Checkout · Resumen fijo (desktop)

Aplica también al carrito completo (ver arriba).

- La caja del Resumen queda **fija al hacer scroll** en Entrega, Forma de pago y Confirmación (`position: sticky` dentro de su columna). Hoy no existe esa regla *(verificado: el Resumen es el componente `Componentoverview` en `col-xs-12 hidden-xs hidden-sm col-md-3`, sin sticky)*.
- El título «RESUMEN» va centrado en vertical en su franja (hasta la línea gris de 1 px que la cierra).
- Se actualiza en vivo con el selector.

### Forma de pago y Confirmación

No están en el prototipo. Les aplican el Resumen fijo y el salteo de Forma de pago descritos arriba.

## 4. Colores por segmento

| Elemento | Personal Bank | Cliente común |
|---|---|---|
| Pista del control | `#B8BDC9` | `#FDD4B9` |
| Relleno | degradé `#5A6380` → `#000C39` | degradé `#FE9A5A` → `#F95E00` |
| Tirador (con logo Volar) | `#000D3A` | `#FE6002` |
| Precio con millas en la ficha · pesos / millas | `#000D3C` / `#000D3C` | `#FF6200` / `#5F6062` |
| Etiqueta de ahorro · fondo | `#223F83` al 10 % | `#FF6200` al 10 % |
| Etiqueta de ahorro · texto / monto | `#223F83` / `#000D3C` | `#464646` / `#464646` |
| Etiqueta de ahorro · ícono | `#223F83` | `#C75000` |
| «Usar el máximo» | naranja (acción) | naranja (acción) |

Regla: en Personal Bank el azul marino es para el precio con millas, el control y la etiqueta de ahorro; el naranja es para las acciones, en ambos segmentos. En cliente común el texto de la etiqueta es gris por contraste (`#C75000` sobre el tinte da 4,10:1).

## 5. Accesibilidad

- El control es `role="slider"` con `aria-valuemin/max/now` y `aria-valuetext` («N millas»), y se opera con teclado.
- «Usar el máximo» es un botón con `aria-pressed`.
- Textos grises chicos del selector (escala, saldo de la ficha, aclaración): `#767676`, que da 4,54:1 sobre blanco y cumple WCAG AA. El `#828282` anterior daba 3,84:1.
- El campo acepta solo dígitos (`inputmode="numeric"`), no deja superar el máximo y al salir muestra el valor con separador de miles.

## 6. A confirmar

- **Retiro en Pickup Itaú con costo** *(hipótesis)*: en producción se vio un retiro con $ 189. Si el Pickup Itaú es una «Agencia» con costo de envío, el salteo de Forma de pago solo aplicaría a retiros sin costo.
- **Confirmación sin forma de pago**: cómo se muestra el bloque de pago cuando se salteó Forma de pago.
- **Cliente común en el encabezado** *(supuesto)*: que no lleve la etiqueta «Personal» ni el ícono PB se dedujo de cómo se ve un cliente Personal Bank; falta una captura del sitio con un cliente común.
- **«Usar el máximo» con el valor inicial en el máximo**: cuando la suma de las fichas supera el máximo, el checkout arranca en el máximo con el botón **sin** activar (en el prototipo el botón solo se activa al tocarlo).

## 7. Simplificaciones del prototipo

- Las pantallas son HTML generado desde el diseño en Penpot (`herramientas/`): textos, cajas y vectores reales en posición absoluta, como en el diseño. Las fotos y logos son las imágenes del sitio. Lo que cambia con el estado (selector, tarjeta, Resumen, totales, contador, cliente común) son componentes vivos.
- Desktop y mobile recorren **envío a domicilio** (Gastos de Envío $ 150; dirección de ejemplo «Bv. Artigas 1234»). Por eso el salteo de Forma de pago no se puede recorrer en el prototipo: necesita una entrega sin costo. En Penpot quedan las pantallas de retiro con ese caso.
- Desktop ocupa todo el ancho de la ventana con el contenido en 1200 px centrados, como el sitio. Con ventanas de menos de 1232 px el prototipo achica la pantalla proporcionalmente en vez de reacomodarla.
- En el carrito completo, la columna del Resumen llega hasta el pie para que se vea el efecto fijo con solo 3 productos.
- El aceite agregado desde la ficha **no aparece** en la lista del carrito (el carrito del diseño tiene 3 productos).
- El recorrido termina en Entrega.
- Las fichas de los productos del carrito suman 2.000 millas. El tope del carrito no se puede recorrer en el prototipo (con este carrito, el tope por descuentos es de 19 millas); queda descrito arriba. El control «Saldo de millas: 3.000» muestra en Entrega el máximo limitado por el saldo.
