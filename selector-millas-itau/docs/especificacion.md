# Selector de millas · Tienda Volar (Itaú) — especificación para desarrollo

Prototipo navegable: <https://imasdev-org.github.io/selector-millas-itau/>

Este documento acompaña al prototipo. El prototipo muestra **cómo se ve y se comporta**; acá están las **reglas** con sus fórmulas. Lo que figura como *a confirmar* todavía no está decidido.

## 1. Qué cambia

| Lugar | Hoy | Propuesta |
|---|---|---|
| Ficha de producto | Control de millas con «Usar disponibles» | **Sin selector.** Un recuadro informa el precio del producto en millas: «Equivale a **N millas**» y «Al finalizar la compra elegís con cuántas pagar». Las millas se eligen solo en el checkout |
| Carrito lateral y carrito completo | Suma lo elegido en las fichas **sin tope** | **Solo pesos**: el encabezado y el Resumen no muestran millas (se eligen en Entrega) |
| Checkout · Entrega | — | Panel nuevo **«¿Cuántas millas querés usar?»** antes de «Tu pedido»: control, campo, «Usar el máximo» y etiqueta «Ahorrás $ X» |
| «Usar el máximo» (Entrega) | Naranja; activo con fondo durazno claro | Color del segmento (azul en Personal Bank, naranja en cliente común); activo con **tilde** y fondo más marcado |
| Resumen del carrito completo y del checkout (desktop) | Se va con el scroll | **Fijo al hacer scroll** (`position: sticky`) |
| Checkout · Forma de pago | Siempre | **Se saltea** si las millas cubren todo y la entrega no tiene costo |

## 2. Reglas de cálculo

Referencia ejecutable: [`js/reglas.js`](../js/reglas.js) (el prototipo calcula todos sus números con esas funciones).

| Concepto | Regla | Ejemplo del prototipo |
|---|---|---|
| Cotización | 1,92 millas por peso | $ 50 = 96 millas |
| Precio en millas en la **ficha** | `floor(precio que se muestra × 1,92)` — el precio del producto en millas; no depende del saldo | $ 375 → **720** |
| Máximo del **pedido** | `min(saldo, floor(total de productos con descuentos × 1,92))` | $ 2.532 → **4.861** (cliente común $ 2.542 → 4.880) |
| Valor inicial en el checkout | `floor(máximo del pedido ÷ 2)`: la mitad, como arranca hoy el slider de la ficha | 4.861 → **2.430** (cliente común 4.880 → 2.440; saldo 3.000 → 1.500) |
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

Con envío a domicilio el envío siempre se paga con tarjeta: **no se saltea**. Con **retiro sin costo** sí: el Resumen muestra «Gastos de Preparación $ 0» (rótulo del tablero de retiro en Penpot) y, con las millas cubriendo todo, Total $ 0. En mobile el diseño no tiene pestañas en este paso: el salteo se ve en «Total a pagar $ 0» y en el texto del botón.

En el prototipo se recorre así: Entrega → «Retiro» → elegir la sucursal → «Usar el máximo» (con saldo 100.000).

## 3. Pantalla por pantalla

**Tipografía:** todos los textos del sitio van en **Myriad Pro**, como hoy (`MyriadPro-Regular`, `-Light`, `-Semibold` y `-Bold`, declaradas con `@font-face` en `webapp/Itau/static/hanoi.sass`). En Penpot los textos están en Source Sans 3 porque Penpot no tiene Myriad Pro; el prototipo usa Myriad Pro si está instalada en el equipo y, si no, Source Sans 3.

**Campo de millas en foco** (ficha y Entrega): el borde y una aureola difuminada toman el mismo color, el naranja de los botones con transparencia: `border-color: rgba(255, 98, 0, .2); box-shadow: 0 0 6px 3px rgba(255, 98, 0, .2)`.

### Ficha de producto

**Sin selector de millas** (tableros «Propuesta · 02 Producto · con sesión · sin selector: precio en millas («con cuántas pagar»)»). Las millas se eligen solo al finalizar la compra, en Entrega; la ficha informa cuánto vale el producto en millas.

- **Precio:** «antes $ 417» arriba (14 italic + 16/400 tachado, `#A7A7A7`, como hoy en el sitio) y el precio actual «$ 375» (22/700 `#333333`) debajo. En este ejemplo no hay «sin promo»: así el recuadro de millas queda pegado al precio.
- **Recuadro de millas**, 12 px debajo del precio, a todo el ancho de la columna (370 desktop · 360 mobile), alto 66, radio 12, 12 px de aire vertical y 14 horizontal. **Solo con tinte, sin borde**: Personal Bank `#EFF0F3` (el color del segmento al 8 % con la **mitad de saturación**, 1,14:1 contra el blanco) y cliente común `#F8F3F1` (durazno al 8 % con saturación 35 %, 1,10:1). Desaturados se leen como blancos apenas fríos o cálidos: marcan el segmento sin competir con el precio ni con el botón. Sin borde no se confunde con el panel de millas de Entrega, que es interactivo (crítica de la versión con borde). En cliente común el durazno va desaturado para no formar un bloque naranja con «Agregar al Carrito» ni parecerse a dos fondos que el sitio ya usa: los avisos del carrito (`.TableCartReplacementAlert`, `#fff7ec`) y las **acciones secundarias** (`$accent-light` `#FCEEE5` en `webapp/Itau/static/css/vars.sass`: `.wBtnSecondaryAction` como «Ver Carrito Completo», `.ShortcutText`, el resaltado del autocompletar y la caja del token). Diferencia de color con `#FCEEE5`: `#FFEFE6` ΔE 0,9 (casi igual), `#FAF3EF` 3,9, **`#F8F3F1` 5,0**. El radio 12 se mantiene: en el sitio 4–5 px son campos y avisos, 12–15 tarjetas y paneles, y la píldora, botones. Al 10 % (`#E9ECF3` / `#FFEFE6`) era la superficie más marcada de la columna; al 5 % sin borde casi no se veía (1,09 / 1,06).
  - Primera línea: «Equivale a **N millas**»: «Equivale a» 14/400 `#464646` (8,3 / 8,6:1); «N millas» 17/600, azul marino `#000D3C` en Personal Bank (16,4:1) o naranja oscuro `#943B00` en cliente común (6,6:1; con `#A84300` se veía mucho más débil que el azul). **N = `floor(precio que se muestra × 1,92)`**: $ 375 → 720. Es el precio del producto en millas, así que es cierto para cualquier cliente, tenga o no esas millas. Se evitó «Podés pagarlo con 720 millas»: sin «hasta» parece todo o nada, como si con menos millas no se pudiera usar ninguna.
  - Segunda línea, 4 px debajo: «Al finalizar la compra elegís con cuántas pagar» (13/400 `#5F5F5F`, 5,6 / 5,8:1, **sin punto final**, como la ayuda del sitio «Elegí cuántos puntos ITAU canjear deslizando la barra»). Responde dónde se eligen las millas ahora que la ficha no tiene control. «Pagar» evita leer «equivale» como millas que se ganan o como pesos + millas; «con cuántas» deja claro que se puede usar menos de N. Es «pagar» y no «pagarlo» porque en el checkout las millas se eligen para todo el pedido, no por producto. *Que «equivale» no se lea como «pesos + millas» o como millas que se ganan es una hipótesis: se confirma con un test de comprensión corto (5–8 personas por segmento). Alternativa si confunde: «Precio en millas: 720 millas».*
  - Se descartó «canjear» (el verbo que el sitio usa para los puntos): en programas de millas suele leerse como cambiar millas por un premio, no como pagar una compra.
- **«Agregar al Carrito»**, 24 px debajo del recuadro, solo sube el contador del ícono; el carrito lateral se abre tocando el ícono.
- Las variantes descartadas de esta información (lista, banda, junto al precio, separador, etc.) quedan en Penpot, columna «Ficha de producto», como secciones «Variante 01h … 01z4».

#### «Usar el máximo» (componente del panel de Entrega)

- **«Usar el máximo»** es un interruptor: al activarlo guarda el valor anterior y pone el máximo; al desactivarlo vuelve al valor anterior. Si se mueve el control o se edita el campo, se desactiva. Solo está en el panel de Entrega (las fichas ya no tienen selector), y toma el **color del segmento**, como el control y la etiqueta de ahorro:

  | Estado | Personal Bank (azul) | Cliente común (naranja) |
  |---|---|---|
  | Normal | fondo blanco, borde 1 px `#223F83`, texto `#223F83` | fondo blanco, borde 1 px `#FF6200`, texto `#DE5500` (como hoy) |
  | Activo | fondo `#D3D9E6` (`#223F83` al 20 %), borde 2 px `#223F83`, texto semibold `#223F83` | fondo `#FFE0CC` (`#FF6200` al 20 %), borde 2 px `#DE5500`, texto semibold `#A84300` |
  | Normal con el mouse encima | fondo `#EDF0F5`; borde y texto como en normal | fondo `#FCF1EB`; borde `#FF6200`; texto y tilde `#9A3D00` |
  | Activo con el mouse encima | fondo `#C5CDDE`; borde y texto como en activo | fondo `#F8D3BC`; borde 2 px `#DE5500`; texto y tilde `#9A3D00` |

  - Activo lleva una **tilde** (ícono Lucide `check`, ISC, 16 × 16 px, trazo del color del texto) 5 px antes de la frase, con tilde y frase centradas juntas en el botón. Así el estado no depende solo del color, y el fondo activo se distingue también sobre el panel de Entrega. `aria-pressed="true"`.
  - **Animación al activar (200 ms):** el lugar de la tilde se abre de 0 a 21 px (16 de la tilde + 5 de separación), así la frase **se desliza 10,5 px a la derecha** y tilde y frase quedan siempre centradas juntas; al mismo tiempo la tilde entra con fundido (`opacity` 0 → 1, `ease`) y escala desde 0 anclada abajo a la izquierda (`transform-origin: 0 100%`). Curva del desplazamiento y la escala: `cubic-bezier(.3,.7,.3,1)`, la misma de la etiqueta de ahorro. En el prototipo el ancho se anima con `grid-template-columns: 0fr ↔ 1fr`, sin medir con JS.
  - **Al desactivar:** la tilde desaparece sin animación y la frase vuelve deslizándose a su lugar (200 ms).
  - Es el patrón del **botón segmentado de Material 3**: en su implementación de Compose la tilde entra con `fadeIn` + `scaleIn` (escala desde 0, anclada abajo a la izquierda), sale sin animación (`ExitTransition.None`) y el contenido se corre la mitad de ícono + separación para quedar centrado. Se eligió en lugar de dejar la frase fija y agrandar el botón: con la frase fija, la tilde quedaría a 7,5 px del borde en la ficha desktop (150 px) y a 9,5 en Entrega mobile (154 px), donde no hay lugar para agrandarlo (campo y botón ya ocupan los 320 px del panel), y el contenido quedaría descentrado al activarse.
  - **Se anima siempre**, también con `prefers-reduced-motion: reduce`, con el mismo criterio que la etiqueta de ahorro: el movimiento es mínimo (10,5 px en 200 ms).
  - El cambio a semibold es instantáneo (las fuentes no variables no interpolan el peso); la compensación de `letter-spacing` de abajo mantiene el ancho de la frase.
  - **Hover, solo con mouse** (`@media (hover: hover)`, así no queda «pegado» después de un toque en pantallas táctiles): el fondo toma el color del texto al 8 % sobre el fondo del estado, la capa de estado de Material 3 (`HoverStateLayerOpacity = 0.08` en sus tokens). En cliente común el texto y la tilde pasan a `#9A3D00`: con el tinte, el texto original bajaba a 3,50:1 (normal) y 4,34:1 (activo); con `#9A3D00` queda en 6,22:1 y 4,94:1. Personal Bank conserva su texto (8,73:1 y 6,25:1). El cambio es inmediato, sin transición. Hoy el botón del sitio no tiene hover (`.useAvailableBtn` en `idslider.sass`).
  - Se descartó como hover la sombra que usa el sitio en «Agregar al carrito» (`1px 1px 5px` al 15 %): sobre los paneles casi no se ve (a 1 px del botón el panel pasa de `#F4F5F9` a `#E7E9F2`, 1,11:1).
  - **Foco con teclado** (`:focus-visible`): contorno 3 px `#223F83` separado 2 px, el mismo de las zonas tocables y del tirador del control. Hoy el sitio no le da foco propio a este botón.
  - El botón **no cambia de tamaño** al activarse (ficha 150 × 36 desktop y 176 × 36 mobile, radio 5; Entrega 166 × 34 desktop y 154 × 34 mobile, radio 4).
  - La frase **no cambia de ancho** al activarse: el estado normal lleva `letter-spacing: .017em`, que en Myriad Pro 14 px la lleva de 89,7 a 93 px, lo mismo que mide en semibold. Sin esa compensación, la frase se ensancha un 3,7 % y se mueve.
  - Por qué cambió el activo: el anterior (fondo `#FEEEE3`, texto `#DE5500`) casi no se distinguía sobre el panel durazno de cliente común (1,07:1 contra el panel) y su texto daba 3,43:1, por debajo de 4,5:1. Los nuevos dan 7,04:1 (azul) y 4,84:1 (naranja).
- Menú de usuario del encabezado (desktop), como en el sitio: etiqueta «Personal» (fondo `#000D3C`, texto blanco 9 px), nombre (14/300) y saldo «100.000 millas» (12/600 `#FF6200`) alineados a la derecha. El cliente común no lleva la etiqueta «Personal»; en mobile, tampoco el ícono PB.

### Carrito lateral y carrito completo

- Encabezado del carrito lateral **solo en pesos**: el total del carrito ($ 2.532 Personal Bank, $ 2.542 cliente común). Sin selector en la ficha no hay millas elegidas que sumar: las millas aparecen recién en Entrega, como dice la aclaración de la ficha («Al finalizar la compra elegís con cuántas pagar»). Tableros «… · solo pesos · …» en Penpot.
- Sin millas por producto en las líneas: el renglón «+ N millas» se quita del todo, **sin dejar su espacio** (el bloque de precio queda de un renglón). Si el producto tiene descuento de Personal Bank, «Con Personal Bank» va en el renglón de abajo del precio, pegado a él. Debajo, el mismo aire en todas las filas hasta la cantidad (carrito lateral) o «Eliminar» (carrito completo mobile).
- El Resumen del carrito completo va **solo en pesos**: SubTotal, Descuentos y Total, sin la fila «Millas aplicadas». Sin la fila, el separador, el Total y «Proceder al Pago» suben 36 px y la caja se achica lo mismo.
- En desktop, la caja del Resumen del carrito completo queda **fija al hacer scroll**, igual que en el checkout. **Hoy no lo está** *(verificado en la KB trunk: `wCartFull`, `wCartFullWC` y `wCartSummary` no tienen ninguna clase sticky; la única del carrito es `wStickyEmptyCart`, del carrito lateral)*.
- Su título «RESUMEN» va centrado en vertical en su franja: hoy queda bajo y la línea gris lo corta.
- Cliente común: sin precio ni etiqueta «Con Personal Bank» (en el ejemplo, el cuchillo vale $ 100 en lugar de $ 90) y sin fila de Descuentos.

### Checkout · Entrega

- **El paso se muestra por etapas, como en el sitio actual.** Al entrar solo están el tipo de entrega (retiro o domicilio) y la consulta de **dirección** (en retiro, de **sucursal**); lo de abajo está oculto. En `wCheckoutStart2` *(verificado en la KB trunk, evento `Comboaddressid.ControlValueChanged`)*, con la dirección sin elegir (id ≤ 0) la subrutina `HIDETABLES` oculta «Tu pedido», las alternativas y las acciones; al elegir una dirección se refrescan los envíos y `SHOWTABLES` los muestra (en retiro, al cambiar el departamento «Tu pedido» se oculta hasta elegir la sucursal). Con el rediseño, al elegir la dirección aparecen además el **panel de millas**, la fecha, la factura y «Continuar», y el Resumen suma el costo de envío. Así el selector de millas **nunca se ve antes de conocer el envío**, que es lo que el pedido original resolvía poniendo el selector en el Resumen. El Resumen existe desde el inicio (`Componentoverview`, sin control de visibilidad).
  - **Estado inicial (supuesto, sin verificar):** el Resumen muestra SubTotal, Descuentos, «Millas aplicadas» (el valor inicial: la mitad del máximo del pedido) y Total **sin** fila de envío y con el título «RESUMEN». Falta una captura de producción del estado inicial para confirmarlo.
  - **Al elegir la dirección:** se agrega «Gastos de Envío», el Total suma el envío y, con domicilio, el título pasa a «Con $ X más el envío es gratis». En retiro, al elegir la sucursal se agrega «Gastos de Preparación $ 0» y el título sigue «RESUMEN».
  - **Transición:** las secciones aparecen con un fundido corto (≈ 350 ms), sin depender del ajuste de animaciones del sistema.
  - **En el prototipo:** «Retiro» y «Envío a domicilio» funcionan. Con domicilio, la dirección se elige en el selector (hay dos de ejemplo, con el mismo envío de $ 150); con retiro, la sucursal (una de ejemplo, «Pickup Itau - Avenida Italia 5821», sin costo). Cambiar de tipo vuelve a la consulta sin elegir y conserva las millas; volver a Entrega desde la barra reinicia el paso y conserva el tipo.

- Panel **«¿Cuántas millas querés usar?»** después del tipo de entrega y la sucursal o dirección (ahí el monto a pagar ya es definitivo) y **antes de «Tu pedido»**. En retiro va igual, después de la sucursal (tableros de retiro en Penpot).
  - **La pregunta es la cabecera, adentro del panel y sin banda:** 18 px, `font-weight: 600`, `#464646`. No lleva el marco de «Tu pedido» (banda `#3E3F40` y sombra de `.TableShipment`, el marco de los envíos) para que **no se lea como otra tarjeta de envío** y para no repetir el título (antes había una banda «Tus millas» y debajo la pregunta). El panel es la sección; la pregunta, su título.
  - **Fondo y borde según el segmento,** sin sombra y con radio 15: Personal Bank fondo `#F4F5F9` y borde `#DEE2EC`; cliente común fondo `#FFF7F2` y borde `#FFE7D9`. El borde es de 1 px y **va por dentro** (en el prototipo, `box-shadow: inset 0 0 0 1px`), así no corre el contenido. Los tonos son el acento del segmento sobre blanco: fondo al 5 % y borde al 15 % (`#223F83` en Personal Bank, `#FF6200` en cliente común).
  - Semántica: el panel es una sección con la pregunta como nombre accesible (`aria-labelledby`).
  - «Millas disponibles: **100.000**» (14 px).
  - Control (desktop 470 px; mobile 320 px, de margen a margen del panel y alineado con el campo y «Usar el máximo», así el tirador llega hasta el margen) con escala «0 … Máximo para este pedido: N» (12 px `#767676`).
  - Campo (166 × 34 desktop, 154 × 34 mobile; borde `#CCCCCC`, radio 4, valor 16/400 alineado a la derecha + «millas»).
  - «Usar el máximo»: el mismo componente de la ficha (colores del segmento y tilde en activo, ver Ficha de producto), alto 34 y radio 4.
  - Etiqueta **«Ahorrás $ X»** arriba a la derecha (alto 26, radio 4, ícono Lucide `piggy-bank` 16 px; monto con `font-weight: 600`). Se muestra **una sola vez**. En desktop va en la fila de la pregunta; en mobile, en la fila de «Millas disponibles».
  - **Posiciones dentro del panel** (borde superior de cada elemento, medido desde el borde superior del panel; iguales en Penpot y en el prototipo):

    | Elemento | Desktop (883 × 162) | Mobile (350 × 265) |
    |---|---|---|
    | Pregunta | 16 | 16 |
    | Etiqueta «Ahorrás» | 16 (a la derecha de la pregunta) | 56 |
    | «Millas disponibles» | 50 | 60 |
    | Tirador del control | 91 | 102 |
    | Escala «0 … Máximo» | 126 | 137 |
    | Campo y «Usar el máximo» | 89 (al lado del control) | 170 |
    | Divisoria | — | 220 |
    | «Total a pagar» | — | 230 |

  - **Desktop:** «Millas disponibles» va pegada a la pregunta (8 px de caja a caja) y se lee como su subtítulo; el salto grande queda entre ese encabezado y el control (20 px hasta el tirador). Si estuviera a la misma distancia de los dos, quedaría flotando sin agruparse con ninguno.
  - **Alrededor del panel:** 30 px desde el selector de dirección (o sucursal) y 30 px hasta «Tu pedido» en desktop; 32 y 32 en mobile, el mismo aire que hay entre el selector y lo que le sigue.
  - La etiqueta **se adapta al contenido** y queda anclada a la derecha del panel (margen interno 8 px a la izquierda y 10 a la derecha). Al ganar o perder cifras, **cada cifra y el punto de los miles entran o salen animando su ancho y su opacidad** (≈ 250 ms, `cubic-bezier(.3,.7,.3,1)`; el ancho con `grid-template-columns: 0fr ↔ 1fr`, sin medir nada con JS), de modo que el ícono **desliza** 7,5 px por cifra (10,9 px con el punto de los miles) en lugar de saltar. Las cifras que siguen en su lugar cambian de valor sin animarse (dígitos tabulares). Las cifras que se van arrancan casi transparentes para no mostrar un instante un número equivocado. El número se compara **desde la derecha**. **La animación no depende del ajuste de animaciones del sistema:** se anima siempre, también con `prefers-reduced-motion: reduce` (no hay que condicionarla a esa media query). Decisión de diseño: el movimiento es mínimo (7,5 a 10,9 px en ≈ 250 ms) y Windows desactiva las animaciones por defecto en sesiones de Escritorio Remoto y equipos virtualizados, con lo que el efecto no se vería. Verificado en el prototipo con ese ajuste activo en el sistema: la transición CSS corre igual; solo la media query la apagaba. Un texto solo para lectores de pantalla («Ahorrás $ X») evita que se lean las cifras sueltas; lo visual va con `aria-hidden`. El mismo elemento se actualiza (no se recrea) para poder animar.
  - **Mobile · fila «Millas disponibles» + etiqueta:** es una fila flexible que se parte en dos líneas cuando no hay lugar: `display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; column-gap: 16px; row-gap: 8px`, con la etiqueta en `margin-left: auto`. Las dos comparten línea **solo si entre ellas quedan 16 px o más**; si no, la etiqueta baja a su propia línea, alineada a la derecha (≈ 34 px más de alto). Con el diseño de 390 px (panel de 350 px, 320 útiles) quedan 27,8 px y no se parte; la medida sale de «Millas disponibles: 100.000» (160 px) + etiqueta (132,2 px) + 16 px, o sea que, con el ahorro de cuatro cifras, se parte por debajo de unos 378 px de ancho de teléfono (con menos cifras la etiqueta es más angosta, entre 11 y 26 px, y queda más aire) (a 375 px quedarían 12,8 px; a 360 px, −2 px). Con saldo de siete cifras o ahorro de cinco el límite sube unos 7 a 14 px. En el prototipo no se puede ver porque el ancho mobile es fijo; hay una demo aparte con el margen ajustable. El centro de la etiqueta va alineado con el del texto de saldo (en el prototipo, la etiqueta 4 px más arriba que el texto: 56 y 60).
- «Continuar» pasa a Forma de pago, o a Confirmación si se salteó el pago: en ese caso dice **«Continuar a Confirmación»**, en desktop y en mobile. En el prototipo, ahí termina el recorrido.
- Mobile: debajo del campo, divisoria y **«Total a pagar $ X»** = total + envío (rótulo 14/700 `#464646`, monto 16/700) (en mobile el Resumen no está en este paso: su columna es `hidden-xs hidden-sm`). El rótulo no dice «con tarjeta»: en este paso todavía no se eligió la forma de pago, y «a pagar» ya indica que es lo que queda después de las millas. La divisoria (1 px, 320 de ancho) toma el **color de la pista del slider** del segmento: `#B8BDC9` en Personal Bank y `#FDD4B9` en cliente común.
- Teclado en el control: flechas ±10, Shift + flechas ±100, RePág/AvPág ±10 %, Inicio/Fin.
- **Espaciados verticales del panel en mobile (390 px)**, de arriba abajo, de caja a caja en el prototipo: borde · 16 · pregunta · 14,5 · fila «Millas disponibles» + etiqueta · 20 · control (tirador de 30) · 5 · escala «0 … Máximo» · 16 · campo y «Usar el máximo» · 16 · divisoria · 9 · «Total a pagar» · 12 · borde. La escala se lee agrupada con el control (5 px del tirador) y no con la fila de botones (16). En desktop la escala es lo último del panel y los botones van al lado del control.
- **El tirador (30 × 30 px) queda siempre dentro del track**, en la ficha y en Entrega: con el valor mínimo su borde izquierdo coincide con el inicio del track y con el máximo su borde derecho coincide con el final; nunca sobresale. Por eso el **centro** del tirador no coincide con los extremos: recorre solo el tramo útil (ancho del track − 30 px) y la posición del centro es `inicio + 15 + (valor ÷ máximo) × (ancho − 30)`. Lo mismo vale para el arrastre: el valor sale de la posición del puntero menos 15 px, dividida por el tramo útil. El relleno llega hasta el centro del tirador. Costo: el tramo útil es 30 px más corto, así que cada píxel equivale a un poco más de millas (en Entrega desktop, de 10,3 a 11,0 millas por píxel con un máximo de 4.861). Con esto el tirador no choca contra el borde del panel ni contra el campo vecino, y el track ya no hace falta acortarlo para evitarlo.
- **El tirador se desplaza con animación cuando el valor salta:** al tocar un punto del track, al tocar «Usar el máximo» (activarlo o desactivarlo), con el teclado o al escribir en el campo, el tirador y el relleno van hasta el nuevo valor en 250 ms con `cubic-bezier(.3,.7,.3,1)`, la misma curva del resto de las animaciones. **Al arrastrar no hay animación:** el tirador sigue al puntero sin demora. El arrastre empieza cuando el puntero se mueve más de 3 px desde donde se tocó; un toque sin arrastre es un salto animado. Se anima siempre (no depende de «reducir movimiento»).

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
| Ficha · recuadro «Equivale a N millas» · fondo / monto | `#EFF0F3` / `#000D3C` | `#F8F3F1` / `#943B00` |
| Etiqueta de ahorro · fondo | `#223F83` al 10 % | `#FF6200` al 10 % |
| Etiqueta de ahorro · texto / monto | `#223F83` / `#000D3C` | `#464646` / `#464646` |
| Etiqueta de ahorro · ícono | `#223F83` | `#C75000` |
| Panel de Entrega · fondo / borde (1 px, interior) | `#F4F5F9` / `#DEE2EC` | `#FFF7F2` / `#FFE7D9` |
| Divisoria sobre «Total a pagar» (mobile) | `#B8BDC9` | `#FDD4B9` |
| «Usar el máximo» normal · borde / texto | `#223F83` / `#223F83` | `#FF6200` / `#DE5500` |
| «Usar el máximo» activo · fondo / borde 2 px / texto (con tilde) | `#D3D9E6` / `#223F83` / `#223F83` | `#FFE0CC` / `#DE5500` / `#A84300` |
| «Usar el máximo» con el mouse encima · fondo normal / fondo activo / texto | `#EDF0F5` / `#C5CDDE` / `#223F83` | `#FCF1EB` / `#F8D3BC` / `#9A3D00` |

Regla: todo lo que es **de millas** toma el color del segmento: en Personal Bank, azul marino (recuadro de la ficha, control, etiqueta de ahorro, panel y «Usar el máximo»); en cliente común, naranja. El naranja sólido queda para las **acciones de la página** en ambos segmentos («Agregar al Carrito», el tipo de entrega elegido, «Continuar»). En cliente común el texto de la etiqueta es gris por contraste (`#C75000` sobre el tinte da 4,10:1).

## 5. Accesibilidad

- El control es `role="slider"` con `aria-valuemin/max/now` y `aria-valuetext` («N millas»), y se opera con teclado.
- «Usar el máximo» es un botón con `aria-pressed`. El estado activo no depende solo del color: lleva tilde, borde de 2 px y semibold. Contraste del texto: activo 7,04:1 (Personal Bank) y 4,84:1 (cliente común); normal en Personal Bank 9,97:1. Con el mouse encima, todos los casos quedan por encima de 4,5:1 (el más bajo, activo de cliente común: 4,94:1). Foco visible con teclado: contorno 3 px `#223F83`.
- El panel de millas de Entrega es una sección con la pregunta como nombre accesible (`aria-labelledby`).
- Textos grises chicos del selector (escala, saldo de la ficha, aclaración): `#767676`, que da 4,54:1 sobre blanco y cumple WCAG AA. El `#828282` anterior daba 3,84:1.
- El campo acepta solo dígitos (`inputmode="numeric"`), no deja superar el máximo y al salir muestra el valor con separador de miles.

## 6. A confirmar

- **Resumen antes de elegir la dirección** *(supuesto)*: el prototipo lo muestra sin fila de envío, con «Millas aplicadas» ya cargadas y título «RESUMEN». Falta una captura del sitio en ese estado.
- **Retiro en Pickup Itaú con costo** *(hipótesis)*: en producción se vio un retiro con $ 189. Si el Pickup Itaú es una «Agencia» con costo de envío, el salteo de Forma de pago solo aplicaría a retiros sin costo.
- **Confirmación sin forma de pago**: cómo se muestra el bloque de pago cuando se salteó Forma de pago.
- **Cliente común en el encabezado** *(supuesto)*: que no lleve la etiqueta «Personal» ni el ícono PB se dedujo de cómo se ve un cliente Personal Bank; falta una captura del sitio con un cliente común.
- **Texto de «Usar el máximo» normal en cliente común**: `#DE5500` sobre blanco da 3,89:1, por debajo de 4,5:1. Es el color de hoy y no se cambió; si se quiere cumplir, `#B34700` da 5,50:1.

## 7. Simplificaciones del prototipo

- Las pantallas son HTML generado desde el diseño en Penpot (`herramientas/`): textos, cajas y vectores reales en posición absoluta, como en el diseño. Las fotos y logos son las imágenes del sitio. Lo que cambia con el estado (selector, panel de millas, Resumen, totales, contador, cliente común) son componentes vivos. La ficha sale de «Propuesta · 02 Producto · con sesión · sin selector: precio en millas («con cuántas pagar»)» y los carritos, de «Propuesta · 02 Carrito lateral · solo pesos» y «Propuesta · 03 Carrito completo · solo pesos». Las pantallas de Entrega salen de los tableros «Alternativa · 04 Checkout · Entrega (domicilio) · millas parcial · pregunta + panel» y «Alternativa · 04 Checkout · Entrega (retiro) · millas parcial · pregunta + panel» de Penpot (desktop y mobile).
- Desktop y mobile recorren **envío a domicilio** (Gastos de Envío $ 150; dirección de ejemplo «Bv. Artigas 1234») y **retiro** (Gastos de Preparación $ 0; sucursal de ejemplo «Pickup Itau - Avenida Italia 5821»). El salteo de Forma de pago se recorre con retiro y «Usar el máximo». Los tableros de retiro en Penpot: desktop Personal Bank parcial y al máximo, cliente común parcial; mobile Personal Bank parcial. El cliente común usa el mismo tablero con los colores de su segmento.
- Desktop ocupa todo el ancho de la ventana con el contenido en 1200 px centrados, como el sitio. Con ventanas de menos de 1232 px el prototipo achica la pantalla proporcionalmente en vez de reacomodarla.
- En el carrito completo, la columna del Resumen llega hasta el pie para que se vea el efecto fijo con solo 3 productos.
- El aceite agregado desde la ficha **no aparece** en la lista del carrito (el carrito del diseño tiene 3 productos).
- El recorrido termina en Entrega.
- Las direcciones del selector de Entrega son de ejemplo y las dos dan el mismo envío ($ 150). En retiro hay una sola sucursal, sin costo.
- El control «Saldo de millas: 3.000» muestra en Entrega el máximo limitado por el saldo.
