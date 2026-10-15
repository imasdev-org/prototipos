# Selector de millas · Tienda Volar (Itaú) — especificación para desarrollo

Prototipo navegable: <https://imasdev-org.github.io/selector-millas-itau/>

Este documento acompaña al prototipo. El prototipo muestra **cómo se ve y se comporta**; acá están las **reglas** con sus fórmulas. Lo que figura como *a confirmar* todavía no está decidido.

## 1. Qué cambia

| Lugar | Hoy | Propuesta |
|---|---|---|
| Ficha de producto | Control de millas con «Usar disponibles» | Mismo control, botón **«Usar el máximo»** que funciona como interruptor y escala «0 … Máximo para este producto: N». Sigue siendo un **semi-simulador** |
| Carrito lateral y carrito completo | Suma lo elegido en las fichas **sin tope** | Misma suma, **con tope** (saldo y máximo del pedido) |
| Checkout · Entrega | — | Tarjeta nueva **«Tus millas»** antes de «Tu pedido»: control, campo, «Usar el máximo» y etiqueta «Ahorrás $ X» |
| Checkout · Resumen (desktop) | Se va con el scroll | **Fijo al hacer scroll** (`position: sticky`) |
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
| Valor inicial en el checkout | `min(suma de lo elegido en las fichas, máximo del pedido)` | 2.000 → 2.000 · 6.000 → **4.861** |
| Orden | Las millas se aplican **después** de los descuentos (no pagan promociones y así no se usan de más) | — |
| Envío / preparación | **No** se paga con millas (por ahora) | — |
| Ahorro | `round(millas ÷ 1,92)` | 2.000 → **$ 1.042** |
| Mínimo de canje | No hay | — |

### Resumen de compra (mismo cálculo que hoy)

- **SubTotal** = productos antes de descuentos − valor en pesos de las millas (los descuentos se restan en su propia fila).
- **Descuentos** en su fila; **millas** en su fila, con la cantidad (no en pesos).
- **Total** = SubTotal − Descuentos + entrega.
- Con todo cubierto por millas: **SubTotal $ 0** y **sin fila de Descuentos**.

Ejemplo (Personal Bank, retiro): 2.000 millas → SubTotal $ 1.500 · Descuentos $ -10 · Gastos de Preparación $ 0 · millas 2.000 · **Total $ 1.490**.

### Cuándo se saltea Forma de pago

Solo si **las millas cubren todo** y **la entrega cuesta $ 0**. En ese caso:

- la pestaña FORMA DE PAGO se oculta **como hoy**: `wCheckout` pone la clase `PaymentTabHidden` y `ItauWeb.css` tiene `.PaymentTabHidden .PaymentTab { display: none; }` *(verificado en la KB, 15/10)*;
- el botón de Entrega dice **«Continuar a Confirmación»** y lleva directo a Confirmación;
- en Confirmación no hay tarjeta: el bloque de forma de pago no aplica (*cómo se muestra: a confirmar*).

Con envío a domicilio el envío siempre se paga con tarjeta: **no se saltea**.

## 3. Pantalla por pantalla

### Ficha de producto

- Precio en vivo «$ X + N millas» (azul marino `#000D3C`, 26/700 y 17/600).
- Control, campo y botón **sincronizados**; el valor se acota entre 0 y 801.
- **«Usar el máximo»** es un interruptor: al activarlo guarda el valor anterior y pone el máximo; al desactivarlo vuelve al valor anterior. Si se mueve el control o se edita el campo, se desactiva.
  - Normal: fondo blanco, borde 1 px `#FF6200`, texto `#DE5500`.
  - Activo: fondo `#FEEEE3`, borde 2 px `#DE5500`, texto semibold. `aria-pressed="true"`.
- Debajo: «Tus millas disponibles: 100.000» y «Podés ajustarlas al pagar.» (12 px `#828282`).
- **«Agregar al Carrito»** solo sube el contador del ícono; el carrito lateral se abre tocando el ícono.
- Lo elegido se guarda en el producto y se suma en el checkout.

### Carrito lateral y carrito completo

- Encabezado «$ X + N millas»: N = valor inicial del checkout (suma de las fichas **con tope**). Hoy el sitio suma sin tope (caso real: 8.324 millas con saldo 6.058).
- Sin millas por producto en las líneas.
- El Resumen del carrito completo usa el mismo cálculo que el checkout.

### Checkout · Entrega

- Tarjeta **«Tus millas»** después del tipo de entrega y la sucursal o dirección (ahí el monto a pagar ya es definitivo) y **antes de «Tu pedido»**.
  - Mismo lenguaje que «Tu pedido»: fondo blanco, radio 15, sombra `0 0 2px #CCCCCC`, banda `#3E3F40` (35 px desktop, 46 px mobile) con el título en 16/700 blanco.
  - Pregunta «¿Cuántas millas querés usar?» (18 px `#464646`) y «Millas disponibles: **100.000**» (14 px).
  - Control (desktop 470 px, mobile 305 px) con escala «0 … Máximo para este pedido: N» (12 px `#828282`).
  - Campo (166 × 34 desktop, 154 × 34 mobile; borde `#CCCCCC`, radio 4, valor 16/400 alineado a la derecha + «millas»).
  - «Usar el máximo»: el mismo componente de la ficha, alto 34 y radio 4.
  - Etiqueta **«Ahorrás $ X»** arriba a la derecha (alto 26, radio 4, ícono Lucide `piggy-bank` 16 px). Se muestra **una sola vez**.
- Mobile: debajo del campo, divisoria y **«Total a pagar con tarjeta $ X»** = total + envío (en mobile el Resumen no está en este paso: su columna es `hidden-xs hidden-sm`).
- Teclado en el control: flechas ±10, Shift + flechas ±100, RePág/AvPág ±10 %, Inicio/Fin.

### Checkout · Resumen fijo (desktop)

- La caja del Resumen queda **fija al hacer scroll** en Entrega, Forma de pago y Confirmación (`position: sticky` dentro de su columna). Hoy no existe esa regla *(verificado: el Resumen es el componente `Componentoverview` en `col-xs-12 hidden-xs hidden-sm col-md-3`, sin sticky)*.
- Se actualiza en vivo con el selector.

### Checkout · Forma de pago

- Las millas se muestran en **solo lectura**. Para cambiarlas se vuelve a Entrega (pestaña ENTREGA; en mobile, «volver»).
- Mobile: recuadro «Millas aplicadas: N» + «Total a pagar con tarjeta $ X».

### Checkout · Confirmación

- Resumen con las millas aplicadas.
- Se mantiene el token de canje por SMS.

## 4. Colores por segmento

| Elemento | Personal Bank | Cliente común |
|---|---|---|
| Pista del control | `#B8BDC9` | `#FDD4B9` |
| Relleno | degradé `#5A6380` → `#000C39` | degradé `#FE9A5A` → `#F95E00` |
| Tirador (con logo Volar) | `#000D3A` | `#FE6002` |
| Etiqueta de ahorro · fondo | `#223F83` al 20 % | `#FF6200` al 10 % |
| Etiqueta de ahorro · texto / monto | `#223F83` / `#000D3C` | `#464646` / `#464646` |
| Etiqueta de ahorro · ícono | `#223F83` | `#C75000` |
| «Usar el máximo» | naranja (acción) | naranja (acción) |

Regla: en Personal Bank el azul marino es para el precio con millas, el control y la etiqueta de ahorro; el naranja es para las acciones, en ambos segmentos. En cliente común el texto de la etiqueta es gris por contraste (`#C75000` sobre el tinte da 4,10:1).

## 5. Accesibilidad

- El control es `role="slider"` con `aria-valuemin/max/now` y `aria-valuetext` («N millas»), y se opera con teclado.
- «Usar el máximo» es un botón con `aria-pressed`.
- El campo acepta solo dígitos (`inputmode="numeric"`), no deja superar el máximo y al salir muestra el valor con separador de miles.

## 6. A confirmar

- **Retiro en Pickup Itaú con costo** *(hipótesis)*: en producción se vio un retiro con $ 189. Si el Pickup Itaú es una «Agencia» con costo de envío, el salteo de Forma de pago solo aplicaría a retiros sin costo.
- **Pestañas al ocultar FORMA DE PAGO**: no está verificado si en producción las otras pestañas se reacomodan o queda el hueco.
- **Confirmación sin forma de pago**: cómo se muestra el bloque cuando se salteó el pago.
- **Fecha de entrega a domicilio** en Confirmación: la redacción usada en el diseño no está verificada contra el sitio.
- **«Usar el máximo» con el valor inicial en el máximo**: cuando la suma de las fichas supera el máximo, el checkout arranca en el máximo con el botón **sin** activar (en el prototipo el botón solo se activa al tocarlo).

## 7. Simplificaciones del prototipo

- Las pantallas son capturas del diseño; lo nuevo (selector, tarjeta, Resumen, contador, botón Continuar) está construido en HTML/CSS encima.
- Desktop recorre **retiro** (Gastos de Preparación $ 0); mobile recorre **envío a domicilio** (Gastos de Envío $ 150).
- El aceite agregado desde la ficha **no aparece** en la lista del carrito (el carrito del diseño tiene 3 productos).
- La ficha y el carrito están diseñados para Personal Bank: el cambio a cliente común aplica a las pantallas del checkout.
- «Confirmar Pedido» no envía nada.
