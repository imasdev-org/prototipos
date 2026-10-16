/*
 * Prototipo del selector de millas.
 * Las pantallas son HTML real generado desde el diseño en Penpot (pantallas/*.js, ver herramientas/).
 * Lo que cambia con esta propuesta o con el estado (selector de la ficha, tarjeta "Tus millas",
 * Resumen, botón Continuar, totales del carrito, contador, cliente común) son componentes vivos.
 */
(function () {
  'use strict';
  var R = window.Reglas;

  // ---------------------------------------------------------------- utilidades
  function el(tag, attrs, contenido) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k === 'style') n.style.cssText = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    if (contenido != null) n.appendChild(typeof contenido === 'string' ? document.createTextNode(contenido) : contenido);
    return n;
  }
  function pos(n, x, y, w, h) {
    n.style.left = x + 'px'; n.style.top = y + 'px';
    if (w != null) n.style.width = w + 'px';
    if (h != null) n.style.height = h + 'px';
    return n;
  }
  function texto(t, clase, x, y, estilo) {
    return pos(el('div', { class: 'txt ' + (clase || ''), style: estilo || '' }, t), x, y);
  }
  // zona(x, y, w, h, etiqueta, accion) o zona([x, y, w, h], etiqueta, accion): área tocable sobre la pantalla
  function zona(x, y, w, h, etiqueta, accion) {
    if (Array.isArray(x)) { etiqueta = y; accion = w; var a = x; x = a[0]; y = a[1]; w = a[2]; h = a[3]; }
    var z = pos(el('button', { class: 'zona', type: 'button', 'aria-label': etiqueta, title: etiqueta }), x, y, w, h);
    z.addEventListener('click', accion);
    return z;
  }
  function P(d, a, b) { return d ? a : b; }
  // Nodos marcados al generar la pantalla (data-k): se les cambia el texto o se ocultan según el estado.
  function marca(raiz, clave) { return raiz.querySelector('[data-k="' + clave + '"]'); }
  function ponerTexto(raiz, clave, valor) { var n = marca(raiz, clave); if (n) n.querySelector('span').textContent = valor; }
  // Posición horizontal de un nodo generado dentro de la pantalla (suma los left de sus contenedores).
  function izquierdaEnPantalla(n, raiz) {
    var x = 0;
    for (; n && n !== raiz; n = n.parentElement) x += parseFloat(n.style.left) || 0;
    return x;
  }
  function mostrar(raiz, clave, visible) { var n = marca(raiz, clave); if (n) n.style.visibility = visible ? '' : 'hidden'; }

  var ICONO_CHANCHITO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z"/><circle cx="16" cy="10" r="1" fill="currentColor" stroke="none"/><path d="M2 8v1a2 2 0 0 0 2 2h1"/></svg>';
  var CHEVRON = '<svg class="chevron" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="#9AA3B8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // Colores por segmento (Personal Bank = azul marino; cliente común = naranja).
  var COLORES = {
    pb: { pista: '#B8BDC9', relleno: 'linear-gradient(90deg,#5A6380,#000C39)', tirador: '#000D3A',
      etiquetaFondo: 'rgba(34,63,131,.10)', etiquetaTexto: '#223F83', etiquetaMonto: '#000D3C', icono: '#223F83',
      precioPesos: '#000D3C', precioMillas: '#000D3C' },
    comun: { pista: '#FDD4B9', relleno: 'linear-gradient(90deg,#FE9A5A,#F95E00)', tirador: '#FE6002',
      etiquetaFondo: 'rgba(255,98,0,.10)', etiquetaTexto: '#464646', etiquetaMonto: '#464646', icono: '#C75000',
      precioPesos: '#FF6200', precioMillas: '#5F6062' }
  };

  // ---------------------------------------------------------------- estado
  var estado;
  function estadoInicial(previo) {
    return {
      vista: previo ? previo.vista : (anchoVentana() < 700 ? 'mobile' : 'desktop'),
      pantalla: 'ficha',
      cajon: false,
      segmento: previo ? previo.segmento : 'pb',
      escenario: 'normal',
      notas: previo ? previo.notas : false,
      ficha: { millas: R.FICHA.porDefecto, previo: null, maxActivo: false, agregado: false },
      pedido: { millas: null, previo: null, maxActivo: false }
    };
  }
  function maximoPedido() { return R.maximoPedido(estado.segmento); }
  function millasIniciales() { return R.valorInicialPedido(estado.segmento, estado.escenario); }
  function millasPedido() {
    if (estado.pedido.millas == null) estado.pedido.millas = millasIniciales();
    return estado.pedido.millas;
  }
  function resumenActual() { return R.resumen(estado.segmento, estado.vista, millasPedido()); }

  // Lógica compartida del selector (ficha y checkout): campo, control y botón sincronizados.
  function cambiarMillas(obj, valor, maximo) {
    obj.millas = R.acotar(valor, maximo);
    obj.maxActivo = false; // mover el control o editar el campo desactiva "Usar el máximo"
  }
  function alternarMaximo(obj, maximo) {
    if (!obj.maxActivo) { obj.previo = obj.millas; obj.millas = maximo; obj.maxActivo = true; }
    else { obj.millas = obj.previo == null ? obj.millas : obj.previo; obj.maxActivo = false; }
  }

  // ---------------------------------------------------------------- componentes
  function crearControl(o) {
    var c = pos(el('div', { class: 'control', role: 'slider', tabindex: '0', 'aria-label': o.etiqueta, 'aria-valuemin': '0' }), o.x, o.y, o.ancho, 44);
    var pista = el('div', { class: 'pista' }), relleno = el('div', { class: 'relleno' });
    var tirador = el('div', { class: 'tirador', html: '<img src="assets/icons/volar.svg" alt="">' });
    pista.appendChild(relleno); c.appendChild(pista); c.appendChild(tirador);
    var st = { valor: 0, maximo: 1 };
    function pintar() {
      var px = st.maximo ? (st.valor / st.maximo) * o.ancho : 0;
      relleno.style.width = px + 'px';
      tirador.style.left = (px - 15) + 'px'; // el tirador se centra en el valor (al máximo sobresale medio tirador)
      c.setAttribute('aria-valuemax', st.maximo); c.setAttribute('aria-valuenow', st.valor);
      c.setAttribute('aria-valuetext', R.miles(st.valor) + ' millas');
    }
    function desdeEvento(ev) {
      var r = c.getBoundingClientRect();
      return R.acotar(((ev.clientX - r.left) / r.width) * st.maximo, st.maximo);
    }
    c.addEventListener('pointerdown', function (ev) {
      ev.preventDefault(); c.setPointerCapture(ev.pointerId); c.classList.add('arrastrando'); c.focus({ preventScroll: true });
      o.alCambiar(desdeEvento(ev));
    });
    c.addEventListener('pointermove', function (ev) { if (c.hasPointerCapture(ev.pointerId)) o.alCambiar(desdeEvento(ev)); });
    c.addEventListener('pointerup', function () { c.classList.remove('arrastrando'); });
    c.addEventListener('keydown', function (ev) {
      var v = st.valor, paso = ev.shiftKey ? 100 : 10, decimo = Math.round(st.maximo / 10);
      var mapa = { ArrowRight: v + paso, ArrowUp: v + paso, ArrowLeft: v - paso, ArrowDown: v - paso, Home: 0, End: st.maximo, PageUp: v + decimo, PageDown: v - decimo };
      if (!(ev.key in mapa)) return;
      ev.preventDefault(); o.alCambiar(R.acotar(mapa[ev.key], st.maximo));
    });
    return {
      nodo: c,
      set: function (valor, maximo, colores) {
        st.valor = valor; st.maximo = maximo;
        pista.style.background = colores.pista; relleno.style.background = colores.relleno; tirador.style.background = colores.tirador;
        pintar();
      }
    };
  }

  function crearCampo(o) {
    var c = pos(el('label', { class: 'campo' }), o.x, o.y, o.w, o.h);
    if (o.borde) c.style.borderColor = o.borde;
    if (o.radio != null) c.style.borderRadius = o.radio + 'px';
    var input = el('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Millas a usar' });
    c.appendChild(input); c.appendChild(el('span', null, 'millas'));
    var actual = 0;
    input.addEventListener('input', function () {
      var dig = input.value.replace(/\D/g, '');
      var v = dig === '' ? 0 : parseInt(dig, 10);
      var acotado = R.acotar(v, o.maximo());
      if (acotado !== v) input.value = R.miles(acotado); // no deja escribir más que el máximo
      o.alCambiar(acotado);
    });
    input.addEventListener('blur', function () { input.value = R.miles(actual); });
    input.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') input.blur(); });
    return {
      nodo: c,
      set: function (v) { actual = v; if (document.activeElement !== input) input.value = R.miles(v); }
    };
  }

  function crearBotonMax(o) {
    var b = pos(el('button', { class: 'boton-max', type: 'button', 'aria-pressed': 'false' }, 'Usar el máximo'), o.x, o.y, o.w, o.h);
    b.style.borderRadius = o.radio + 'px';
    b.addEventListener('click', o.alTocar);
    return { nodo: b, set: function (activo) { b.setAttribute('aria-pressed', activo ? 'true' : 'false'); } };
  }

  function etiquetaAhorro(colores, monto) {
    var e = el('div', { class: 'etiqueta-ahorro', role: 'status' });
    e.style.background = colores.etiquetaFondo; e.style.color = colores.etiquetaTexto;
    e.innerHTML = '<span style="color:' + colores.icono + ';display:flex">' + ICONO_CHANCHITO + '</span>' +
      '<span>Ahorrás <b style="font-weight:700;color:' + colores.etiquetaMonto + '">' + R.pesos(monto) + '</b></span>';
    return e;
  }

  // Menú de usuario del encabezado desktop (como en el sitio): «Personal» solo para Personal Bank.
  function menuUsuario() {
    var g = el('div', { class: 'capa', style: 'inset:0;pointer-events:none' });
    if (estado.segmento === 'pb') g.appendChild(pos(el('span', { class: 'chip-personal' }, 'Personal'), 960, 36, 35, 12));
    var datos = el('div', { class: 'datos-usuario' });
    datos.appendChild(el('div', { class: 'nombre-usuario' }, 'ITALO PEREZ'));
    datos.appendChild(el('div', { class: 'saldo-usuario' }, R.miles(R.SALDO) + ' millas'));
    g.appendChild(datos);
    return g;
  }

  // Selector de la ficha (semi-simulador).
  function crearSelectorFicha(vista, repintarTodo) {
    var d = vista === 'desktop', g = el('div', { class: 'capa', style: 'left:0;top:0' });
    var P2 = d ? { x: 913, precioY: 283, rotuloY: 341, controlY: 367, ancho: 370, escalaY: 408, campo: [913, 438, 150, 36], boton: [1070, 438, 150, 36], dispY: 484, ajusY: 506 }
               : { x: 15, precioY: 518, rotuloY: 576, controlY: 602, ancho: 360, escalaY: 643, campo: [15, 673, 176, 36], boton: [198, 673, 176, 36], dispY: 719, ajusY: 741 };
    var precio = pos(el('div', { class: 'txt', style: 'display:flex;align-items:baseline;gap:11px' }), P2.x, P2.precioY);
    var pesos = el('span', { style: 'font-size:26px;font-weight:700;line-height:37px' }), mil = el('span', { style: 'font-size:17px;font-weight:600' });
    precio.appendChild(pesos); precio.appendChild(mil); g.appendChild(precio);
    g.appendChild(texto('ELEGÍ LAS MILLAS A USAR', '', P2.x, P2.rotuloY, 'font-size:12px;color:#5F6062'));
    var obj = estado.ficha, max = R.FICHA.maximo;
    var control = crearControl({ x: P2.x, y: P2.controlY, ancho: P2.ancho, etiqueta: 'Millas para este producto',
      alCambiar: function (v) { cambiarMillas(obj, v, max); repintarTodo(); } });
    g.appendChild(control.nodo);
    var escala = pos(el('div', { class: 'txt', style: 'display:flex;justify-content:space-between;font-size:14px;color:#828282' }), P2.x, P2.escalaY, P2.ancho);
    escala.appendChild(el('span', null, '0')); escala.appendChild(el('span', null, 'Máximo para este producto: ' + R.miles(max)));
    g.appendChild(escala);
    var campo = crearCampo({ x: P2.campo[0], y: P2.campo[1], w: P2.campo[2], h: P2.campo[3], borde: '#C8CFE1', radio: 5,
      maximo: function () { return max; }, alCambiar: function (v) { cambiarMillas(obj, v, max); repintarTodo(); } });
    var boton = crearBotonMax({ x: P2.boton[0], y: P2.boton[1], w: P2.boton[2], h: P2.boton[3], radio: 5,
      alTocar: function () { alternarMaximo(obj, max); repintarTodo(); } });
    g.appendChild(campo.nodo); g.appendChild(boton.nodo);
    g.appendChild(texto('Tus millas disponibles: ' + R.miles(R.SALDO), '', P2.x, P2.dispY, 'font-size:12px;color:#828282'));
    g.appendChild(texto('Podés ajustarlas al pagar.', '', P2.x, P2.ajusY, 'font-size:12px;color:#828282'));
    return {
      nodo: g,
      actualizar: function () {
        var c = COLORES[estado.segmento];
        control.set(obj.millas, max, c);
        campo.set(obj.millas); boton.set(obj.maxActivo);
        pesos.textContent = R.pesos(R.precioFicha(obj.millas)); pesos.style.color = c.precioPesos;
        mil.textContent = '+ ' + R.miles(obj.millas) + ' millas'; mil.style.color = c.precioMillas;
      }
    };
  }

  // Tarjeta "Tus millas" del checkout (Entrega). Mismo lenguaje que la tarjeta "Tu pedido".
  function crearTarjeta(vista, repintarTodo) {
    var d = vista === 'desktop';
    var t = el('section', { class: 'tarjeta-millas', 'aria-label': 'Tus millas' });
    if (d) pos(t, 125, 372, 883, 202); else pos(t, 20, 315, 350, 293);
    var banda = el('div', { class: 'banda' }, 'Tus millas'); banda.style.height = (d ? 35 : 46) + 'px';
    t.appendChild(banda);
    t.appendChild(texto('¿Cuántas millas querés usar?', 'pregunta', 15, d ? 55 : 62));
    var saldo = texto('', 'saldo', 15, d ? 89 : 94); saldo.innerHTML = 'Millas disponibles: <b>' + R.miles(R.SALDO) + '</b>';
    t.appendChild(saldo);
    var cajaEtiqueta = el('div', { class: 'capa', style: 'right:15px;top:' + (d ? 55 : 92) + 'px' });
    t.appendChild(cajaEtiqueta);
    var ancho = d ? 470 : 305;
    var obj = estado.pedido;
    var control = crearControl({ x: 15, y: d ? 120 : 130, ancho: ancho, etiqueta: 'Millas del pedido',
      alCambiar: function (v) { cambiarMillas(obj, v, maximoPedido()); repintarTodo(); } });
    t.appendChild(control.nodo);
    var escala = pos(el('div', { class: 'txt escala', style: 'display:flex;justify-content:space-between' }), 15, d ? 162 : 172, ancho);
    var escalaMax = el('span');
    escala.appendChild(el('span', null, '0')); escala.appendChild(escalaMax);
    t.appendChild(escala);
    var campo = crearCampo(Object.assign(d ? { x: 524, y: 125, w: 166, h: 34 } : { x: 15, y: 198, w: 154, h: 34 }, {
      maximo: maximoPedido,
      alCambiar: function (v) { cambiarMillas(obj, v, maximoPedido()); repintarTodo(); } }));
    var boton = crearBotonMax(Object.assign(d ? { x: 702, y: 125, w: 166, h: 34 } : { x: 181, y: 198, w: 154, h: 34 }, { radio: 4,
      alTocar: function () { alternarMaximo(obj, maximoPedido()); repintarTodo(); } }));
    t.appendChild(campo.nodo); t.appendChild(boton.nodo);
    var totalValor;
    if (!d) {
      t.appendChild(pos(el('div', { class: 'divisoria' }), 15, 248, 320));
      var fila = pos(el('div', { class: 'txt total', style: 'display:flex;justify-content:space-between' }), 15, 260, 320);
      totalValor = el('span');
      fila.appendChild(el('span', null, 'Total a pagar con tarjeta')); fila.appendChild(totalValor);
      t.appendChild(fila);
    }
    return {
      nodo: t,
      actualizar: function () {
        var c = COLORES[estado.segmento], m = millasPedido(), max = maximoPedido(), r = resumenActual();
        control.set(m, max, c);
        campo.set(m);
        boton.set(obj.maxActivo);
        escalaMax.textContent = 'Máximo para este pedido: ' + R.miles(max);
        cajaEtiqueta.innerHTML = ''; var e = etiquetaAhorro(c, R.ahorro(m)); e.style.position = 'relative'; cajaEtiqueta.appendChild(e);
        if (totalValor) totalValor.textContent = R.pesos(r.total);
      }
    };
  }

  // Resumen de compra del checkout (desktop): caja fija al hacer scroll.
  function pintarResumen(caja, r) {
    var filas = [{ t: 'SubTotal', v: R.pesos(r.subtotal), c: '#5F6062' }];
    if (r.mostrarDescuento) filas.push({ t: 'Descuentos', v: R.pesos(-r.descuento), c: '#223F83', chevron: true });
    filas.push({ t: r.rotuloEntrega, v: R.pesos(r.entrega), c: '#5F6062' });
    filas.push({ t: 'millas', v: R.miles(r.millas), c: '#223F83' });
    // Título centrado en la franja de 38 px que cierra la línea gris
    var h = '<div class="titulo" style="top:9px;line-height:20px">RESUMEN</div><div class="hr"></div>';
    filas.forEach(function (f, i) {
      var y = 51 + i * 33;
      if (f.chevron) h += '<div style="position:absolute;left:9px;top:' + (y + 14) + 'px;width:10px;height:6px">' + CHEVRON + '</div>';
      h += '<div class="fila" style="left:' + (f.chevron ? 26 : 21) + 'px;top:' + y + 'px;color:' + f.c + '">' + f.t + '</div>';
      h += '<div class="fila" style="right:21px;top:' + y + 'px;color:' + f.c + '">' + f.v + '</div>';
    });
    var sep = 51 + filas.length * 33;
    h += '<div class="sep" style="left:21px;width:236px;top:' + sep + 'px"></div>';
    h += '<div class="fila" style="left:21px;top:' + (sep + 11) + 'px;font-weight:700;color:#464646">Total</div>';
    h += '<div class="fila" style="right:21px;top:' + (sep + 11) + 'px;font-weight:700;color:#464646">' + R.pesos(r.total) + '</div>';
    caja.innerHTML = h;
    caja.style.height = (sep + 11 + 34 + 16) + 'px';
  }
  function columnaResumen(altoPantalla) {
    var col = pos(el('div', { class: 'columna-resumen' }), 1043, 96, 278, altoPantalla - 96 - 24);
    var caja = el('aside', { class: 'resumen', 'aria-label': 'Resumen de compra' });
    caja.style.top = ((altoBarra + 16) / zoomActual) + 'px'; // queda fijo debajo de la barra del prototipo
    col.appendChild(caja);
    return { nodo: col, caja: caja };
  }

  // Filas del Resumen del carrito completo (mismo cálculo que el checkout, sin entrega).
  function filasResumenCarrito(d) {
    var r = R.resumenCarrito(estado.segmento, millasIniciales());
    var X = d ? { izq: 1056, der: 1292, y: 588, det: [1072, 1299], chev: 1044 } : { izq: 35, der: 356, y: 1516, det: [50, 362], chev: 23 };
    var g = el('div', { class: 'capa', style: 'left:0;top:0' });
    function fila(t, v, y, estilo, izq, der, alto) {
      var f = pos(el('div', { class: 'fila-resumen', style: estilo }), izq || X.izq, y, (der || X.der) - (izq || X.izq), alto || 34);
      f.appendChild(el('span', null, t)); f.appendChild(el('span', null, v));
      g.appendChild(f);
    }
    var y = X.y;
    fila('SubTotal', R.pesos(r.subtotal), y, 'color:#5F6062'); y += 36;
    if (r.mostrarDescuento) {
      g.appendChild(pos(el('div', { class: 'capa', style: 'width:10px;height:6px;transform:rotate(180deg)', html: CHEVRON }), X.chev, y + 13));
      fila('Descuentos', R.pesos(-r.descuento), y, 'color:#223F83', X.izq + 5); y += 33;
      fila('10%OFF-Personal Bank', R.pesos(-r.descuento), y, 'color:#223F83;font-size:11px', X.det[0], X.det[1], 21); y += 16;
    }
    fila('millas', R.miles(r.millas), y, 'color:#223F83');
    g.appendChild(pos(el('div', { class: 'separador-resumen' }), X.izq, y + 43, X.der - X.izq));
    fila('Total', R.pesos(r.total), y + 57, 'color:#464646;font-weight:700');
    return g;
  }

  // Precios del cuchillo y etiqueta «Con Personal Bank» según el cliente (carrito lateral y completo).
  function aplicarCliente(raiz) {
    var pb = estado.segmento === 'pb', p = R.PRECIO_CUCHILLO[estado.segmento];
    ponerTexto(raiz, 'cuchillo-unidad', '1 x ' + R.pesos(p));
    ponerTexto(raiz, 'cuchillo-total', R.pesos(p));
    mostrar(raiz, 'pb-etiqueta', pb);
    mostrar(raiz, 'pb-icono', pb);
  }

  // ---------------------------------------------------------------- notas para desarrollo
  var NOTAS = {
    ficha: [
      { d: [893, 300], m: [8, 535], t: 'La ficha es un <b>semi-simulador</b>: en la ficha no se conocen los descuentos, así que el máximo se calcula sobre el precio sin promoción ($ 417 × 1,92 = 801). El ajuste fino se hace al pagar. Lo elegido se guarda en el producto y se suma en el checkout.' },
      { d: [893, 352], m: [8, 586], t: 'Precio = precio sin promoción − millas ÷ 1,92, redondeado y nunca menor a $ 0. Valor por defecto: la mitad del máximo (sin cambios respecto de hoy). Rótulos fijos: solo cambian los valores. Colores del precio: Personal Bank todo en azul marino <code>#000D3C</code>; cliente común pesos en naranja <code>#FF6200</code> y millas en gris <code>#5F6062</code>, como hoy para quien no es Personal Bank.' },
      { d: [1234, 456], m: [376, 691], t: '<b>«Usar el máximo»</b> funciona como interruptor. Activo: fondo <code>#FEEEE3</code>, borde 2 px <code>#DE5500</code>, texto semibold. Al desactivarlo vuelve al valor anterior. Si se mueve el control o se edita el campo, se desactiva.' },
      { d: [893, 568], m: [8, 803], t: '«Agregar al carrito» solo sube el contador del ícono; el carrito lateral se abre tocando el ícono. <b>En este prototipo el aceite no aparece en la lista del carrito</b> (simplificación: el carrito del diseño tiene 3 productos).' },
      { d: [950, 30], m: [290, 30], t: 'Menú de usuario como en el sitio: etiqueta «Personal», nombre y saldo de millas. El cliente común no lleva la etiqueta «Personal» (en mobile, el ícono PB).' }
    ],
    cajon: [
      { d: [190, 99], m: [175, 99], t: 'Encabezado «$ X + N millas»: N es el menor entre la suma de lo elegido en las fichas, el saldo y el máximo del pedido (<b>tope</b>). Hoy el sitio suma sin tope (caso real: 8.324 millas con saldo 6.058). El tope entra en el alcance. Probalo con «Fichas: 6.000 (supera el máximo)» en la barra.' },
      { d: [10, 420], m: [10, 420], t: 'Sin millas por producto en las líneas del carrito.' }
    ],
    carrito: [
      { d: [1030, 605], m: [12, 1533], t: 'Resumen del carrito completo: mismo cálculo que el checkout (fila «millas» con la cantidad, SubTotal ya descontadas las millas, con tope).' }
    ],
    entrega: [
      { d: [125, 388], m: [20, 330], t: 'Tarjeta <b>«Tus millas»</b> antes de «Tu pedido», con el mismo estilo de tarjeta (banda <code>#3E3F40</code>, radio 15, sombra <code>#CCCCCC</code> 2 px). Se elige después del tipo de entrega y la sucursal o dirección: ahí el monto con tarjeta ya es definitivo.' },
      { d: [125, 513], m: [22, 457], t: 'Valor inicial = suma de lo elegido en las fichas, con tope. Máximo del pedido = piso(total de productos con descuentos × 1,92), nunca más que el saldo. Las millas se aplican después de los descuentos (así no se usan de más) y <b>no cubren el envío</b> (por ahora).' },
      { d: [1008, 514], m: [372, 530], t: 'Control, campo y «Usar el máximo» sincronizados; el valor se acota entre 0 y el máximo. «Usar el máximo» es el mismo componente de la ficha. Teclado: flechas ±10, Shift+flechas ±100, Inicio/Fin.' },
      { d: [846, 440], m: [372, 420], t: 'Ahorro = millas ÷ 1,92, redondeado. Se muestra una sola vez. Etiqueta: azul en Personal Bank (fondo <code>#223F83</code> al 10 %), naranja suave en cliente común (fondo <code>#FF6200</code> al 10 %, texto gris por contraste). Ícono: Lucide piggy-bank (ISC).' },
      { d: [1043, 110], m: null, t: '<b>Resumen fijo al hacer scroll</b> (<code>position: sticky</code>) en los pasos del checkout, desktop. Título «RESUMEN» centrado en su franja. SubTotal en pesos ya descontadas las millas; fila «millas» con la cantidad; Total = SubTotal − Descuentos + entrega. Con todo cubierto: SubTotal $ 0 y sin fila de Descuentos.' },
      { d: [792, 40], m: null, t: 'Si las millas cubren todo y la entrega no tiene costo, se saltea Forma de pago como hoy: <code>wCheckout</code> pone la clase <code>PaymentTabHidden</code>, la pestaña FORMA DE PAGO se oculta y CONFIRMACIÓN pasa a su lugar. El botón dice «Continuar a Confirmación». Probalo con «Usar el máximo».' },
      { d: null, m: [22, 585], t: 'En mobile el Resumen no está en este paso (la columna es <code>hidden-xs hidden-sm</code>): la tarjeta muestra «Total a pagar con tarjeta» = total + envío. Con envío a domicilio el envío siempre va con tarjeta: no se saltea Forma de pago.' }
    ]
  };
  var NOMBRES = { ficha: 'Ficha de producto', cajon: 'Carrito lateral', carrito: 'Carrito', entrega: 'Entrega' };

  function pinesYPanel(capaPantalla, clave) {
    if (!estado.notas) return;
    var lista = (NOTAS[clave] || []).filter(function (n) { return n[estado.vista === 'desktop' ? 'd' : 'm']; });
    var panel = el('aside', { class: 'panel-notas', 'aria-label': 'Notas para desarrollo' });
    panel.appendChild(el('header', null, 'Notas para desarrollo · ' + NOMBRES[clave]));
    var ol = el('ol');
    lista.forEach(function (n, i) {
      var p = n[estado.vista === 'desktop' ? 'd' : 'm'];
      var pin = pos(el('button', { class: 'pin', type: 'button', 'aria-expanded': 'false', 'aria-label': 'Nota ' + (i + 1) }, String(i + 1)), p[0], p[1]);
      var li = el('li', { html: '<b class="n">' + (i + 1) + '</b><div>' + n.t + '</div>' });
      pin.addEventListener('click', function () {
        Array.prototype.forEach.call(ol.children, function (x) { x.classList.remove('resaltada'); });
        Array.prototype.forEach.call(document.querySelectorAll('.pin'), function (x) { x.setAttribute('aria-expanded', 'false'); });
        li.classList.add('resaltada'); pin.setAttribute('aria-expanded', 'true'); li.scrollIntoView({ block: 'nearest' });
      });
      capaPantalla.appendChild(pin); ol.appendChild(li);
    });
    if (!lista.length) ol.appendChild(el('li', { html: '<b class="n">·</b><div>Sin notas en esta pantalla.</div>' }));
    panel.appendChild(ol);
    var capa = document.getElementById('notas-capa');
    capa.innerHTML = ''; // con el carrito lateral abierto, el panel muestra solo sus notas
    capa.appendChild(panel);
  }

  // ---------------------------------------------------------------- pantallas
  function pantallaGenerada(nombre) {
    var p = window.PANTALLAS[nombre];
    var s = el('div', { class: 'pantalla pv' });
    s.style.width = p.w + 'px'; s.style.height = p.h + 'px';
    s.innerHTML = p.html;
    return s;
  }
  function irA(p) { estado.pantalla = p; estado.cajon = false; render(true); }

  function construirPantalla() {
    var v = estado.vista, d = v === 'desktop', p = estado.pantalla;
    var s = pantallaGenerada(p + '-' + v);
    var alto = window.PANTALLAS[p + '-' + v].h;
    var actualizadores = [];
    function repintarTodo() { actualizadores.forEach(function (f) { f(); }); }

    if (p === 'ficha') {
      var sel = crearSelectorFicha(v, repintarTodo); s.appendChild(sel.nodo); actualizadores.push(sel.actualizar);
      if (d) s.appendChild(menuUsuario());
      mostrar(s, 'pb-icono', estado.segmento === 'pb');
      actualizadores.push(function () { ponerTexto(s, 'contador', estado.ficha.agregado ? '4' : '3'); });
      s.appendChild(zona(P(d, [913, 551, 370, 34], [15, 786, 360, 34]), 'Agregar al Carrito', function () { estado.ficha.agregado = true; repintarTodo(); }));
      s.appendChild(zona(P(d, [1108, 18, 48, 47], [339, 8, 40, 38]), 'Abrir el carrito', function () { estado.cajon = true; render(false); }));
    }

    if (p === 'carrito') {
      if (d) s.appendChild(menuUsuario());
      aplicarCliente(s);
      s.appendChild(filasResumenCarrito(d));
      s.appendChild(zona(P(d, [1057, 786, 234, 34], [35, 1714, 320, 34]), 'Proceder al Pago', function () { irA('entrega'); }));
    }

    if (p === 'entrega') {
      var tj = crearTarjeta(v, repintarTodo); s.appendChild(tj.nodo); actualizadores.push(tj.actualizar);
      if (d) {
        var col = columnaResumen(alto); s.appendChild(col.nodo);
        actualizadores.push(function () { pintarResumen(col.caja, resumenActual()); });
        var tabPago = marca(s, 'tab-pago'), tabConf = marca(s, 'tab-confirmacion');
        // al ocultar FORMA DE PAGO, CONFIRMACIÓN pasa a su lugar (como en el sitio)
        var centro = function (n) { return izquierdaEnPantalla(n, s) + parseFloat(n.style.width) / 2; };
        var corrimiento = centro(tabPago) - centro(tabConf);
        var btn = pos(el('button', { class: 'boton-continuar', type: 'button' }), 735, 1035, 278, 34);
        btn.addEventListener('click', finDelRecorrido);
        s.appendChild(btn);
        actualizadores.push(function () {
          var r = resumenActual();
          tabPago.style.display = r.salteaPago ? 'none' : '';
          tabConf.style.transform = r.salteaPago ? 'translateX(' + corrimiento + 'px)' : '';
          btn.textContent = r.salteaPago ? 'Continuar a Confirmación' : 'Continuar';
        });
      } else {
        s.appendChild(zona(23, 1088, 345, 34, 'Continuar', finDelRecorrido));
      }
    }

    repintarTodo();
    pinesYPanel(s, p);
    return s;
  }

  function construirCajon(contenedor, telefono) {
    var d = estado.vista === 'desktop';
    var fondo = el('div', { class: 'cajon-fondo' });
    fondo.addEventListener('click', function () { estado.cajon = false; render(false); });
    var nombre = 'cajon-' + estado.vista, ancho = window.PANTALLAS[nombre].w;
    var c = el('div', { class: 'cajon', role: 'dialog', 'aria-label': 'Carrito' });
    c.style.width = (telefono ? ancho : ancho * zoomActual) + 'px';
    if (!telefono && estado.notas && anchoVentana() > 900) c.style.right = '384px'; // deja ver el panel de notas
    var cont = el('div', { class: 'contenido' });
    if (telefono) cont.style.zoom = 1;
    var s = pantallaGenerada(nombre);
    aplicarCliente(s);
    // Encabezado «$ X + N millas» con tope
    var r = R.resumenCarrito(estado.segmento, millasIniciales());
    var enc = pos(el('div', { class: 'total-cajon' }), 15, 81.5);
    enc.appendChild(el('span', { class: 'importe' }, R.pesos(r.total) + ' + ' + R.miles(r.millas)));
    enc.appendChild(el('span', { class: 'unidad' }, 'millas'));
    s.appendChild(enc);
    s.appendChild(zona(d ? 245 : 220, 82, d ? 140 : 116, 34, 'Pagar', function () { irA('entrega'); }));
    s.appendChild(zona(15, 22, d ? 203 : 175, 34, 'Ver Carrito Completo', function () { irA('carrito'); }));
    s.appendChild(zona(d ? 355 : 306, 25, 30, 30, 'Cerrar el carrito', function () { estado.cajon = false; render(false); }));
    pinesYPanel(s, 'cajon');
    cont.appendChild(s); c.appendChild(cont);
    contenedor.appendChild(fondo); contenedor.appendChild(c);
  }

  function finDelRecorrido() {
    var r = resumenActual();
    var f = el('div', { class: 'modal-fondo' });
    var m = el('div', { class: 'modal', role: 'dialog', 'aria-label': 'Fin del recorrido' });
    m.innerHTML = '<h2>Fin del recorrido</h2><p>' + (r.salteaPago
      ? 'Las millas cubren todo el pedido: en el sitio se pasa directo a Confirmación.'
      : 'En el sitio sigue Forma de pago.') + ' Forma de pago y Confirmación no forman parte de este prototipo.</p>';
    var b1 = el('button', { type: 'button' }, 'Volver a empezar'), b2 = el('button', { type: 'button', class: 'secundario' }, 'Cerrar');
    b1.addEventListener('click', function () { f.remove(); estado = estadoInicial(estado); render(true); });
    b2.addEventListener('click', function () { f.remove(); });
    m.appendChild(b1); m.appendChild(b2); f.appendChild(m); document.body.appendChild(f);
    b2.focus();
  }

  // ---------------------------------------------------------------- render, barra y solapa
  var zoomActual = 1, altoBarra = 56, barraPlegada = false;
  function anchoVentana() { return window.innerWidth || document.documentElement.clientWidth || 1440; }
  function leerPreferencia() { try { return localStorage.getItem('selector-millas:barra') === 'plegada'; } catch (e) { return false; } }
  function guardarPreferencia() { try { localStorage.setItem('selector-millas:barra', barraPlegada ? 'plegada' : 'abierta'); } catch (e) { /* sin almacenamiento */ } }
  // La barra puede ocupar dos renglones en pantallas angostas; plegada no ocupa lugar.
  function medirBarra() {
    document.body.classList.toggle('barra-plegada', barraPlegada);
    altoBarra = barraPlegada ? 0 : document.getElementById('barra').offsetHeight;
    document.documentElement.style.setProperty('--barra', altoBarra + 'px');
  }
  function render(irArriba) {
    medirBarra();
    var esc = document.getElementById('escenario');
    var scrollPrevio = irArriba ? 0 : (estado.vista === 'desktop' ? window.scrollY : (esc.querySelector('.scroll') || {}).scrollTop || 0);
    esc.innerHTML = ''; document.getElementById('notas-capa').innerHTML = '';
    esc.className = estado.vista;
    var p = estado.pantalla, m = window.PANTALLAS[p + '-' + estado.vista], ancho = anchoVentana();
    var conPanel = estado.notas && ancho > 900; // en pantallas angostas el panel de notas va abajo
    if (estado.vista === 'desktop') {
      var disponible = ancho - 32 - (conPanel ? 384 : 0);
      zoomActual = Math.max(0.2, Math.min(1, disponible / m.w));
      document.documentElement.style.setProperty('--z', zoomActual);
      var lienzo = el('div', { class: 'lienzo' }); lienzo.style.width = m.w + 'px';
      if (conPanel) lienzo.style.marginLeft = Math.max(16, (ancho - 384 - m.w * zoomActual) / 2) / zoomActual + 'px';
      lienzo.appendChild(construirPantalla());
      esc.appendChild(lienzo);
      if (estado.cajon) construirCajon(esc, false);
      window.scrollTo(0, scrollPrevio);
    } else {
      zoomActual = 1;
      document.documentElement.style.setProperty('--z', 1);
      var tel = el('div', { class: 'telefono' }), sc = el('div', { class: 'scroll' });
      var pant = construirPantalla();
      if (ancho < 390) pant.style.zoom = ancho / 390;
      sc.appendChild(pant); tel.appendChild(sc);
      if (conPanel) tel.style.marginLeft = Math.max(16, (ancho - 384 - 410) / 2) + 'px';
      esc.appendChild(tel);
      if (estado.cajon) construirCajon(tel, true);
      sc.scrollTop = scrollPrevio;
      window.scrollTo(0, 0);
    }
    pintarBarra();
  }

  function pintarBarra() {
    var marcar = function (sel, valor) {
      Array.prototype.forEach.call(document.querySelectorAll(sel + ' button'), function (b) {
        b.setAttribute('aria-pressed', b.dataset.valor === valor ? 'true' : 'false');
      });
    };
    marcar('#b-pasos', estado.pantalla);
    marcar('#b-vista', estado.vista);
    marcar('#b-cliente', estado.segmento);
    marcar('#b-escenario', estado.escenario);
    document.getElementById('b-notas').setAttribute('aria-pressed', estado.notas ? 'true' : 'false');
  }

  function plegar(valor) {
    barraPlegada = valor; guardarPreferencia(); render(false);
    document.getElementById(valor ? 'solapa' : 'b-plegar').focus({ preventScroll: true });
  }

  function iniciar() {
    barraPlegada = leerPreferencia();
    estado = estadoInicial();
    var reiniciarPedido = function () { estado.pedido = { millas: null, previo: null, maxActivo: false }; };
    document.getElementById('b-pasos').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) irA(b.dataset.valor); });
    document.getElementById('b-vista').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { estado.vista = b.dataset.valor; estado.cajon = false; render(true); } });
    document.getElementById('b-cliente').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      estado.segmento = b.dataset.valor; reiniciarPedido(); render(false);
    });
    document.getElementById('b-escenario').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      estado.escenario = b.dataset.valor; reiniciarPedido(); render(false);
    });
    document.getElementById('b-notas').addEventListener('click', function () { estado.notas = !estado.notas; render(false); });
    document.getElementById('b-reiniciar').addEventListener('click', function () { estado = estadoInicial(estado); render(true); });
    document.getElementById('b-plegar').addEventListener('click', function () { plegar(true); });
    document.getElementById('solapa').addEventListener('click', function () { plegar(false); });
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { render(false); }, 120); });
    render(true);
  }
  document.addEventListener('DOMContentLoaded', iniciar);
})();
