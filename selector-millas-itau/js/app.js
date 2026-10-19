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
  function mostrar(raiz, clave, visible) {
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-k="' + clave + '"]'), function (n) { n.style.visibility = visible ? '' : 'hidden'; });
  }

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
      notas: previo ? previo.notas : false,
      ficha: { millas: R.FICHA.porDefecto, previo: null, maxActivo: false, agregado: false },
      pedido: { millas: null, previo: null, maxActivo: false },
      facturaRut: false
    };
  }
  function maximoPedido() { return R.maximoPedido(estado.segmento); }
  function millasIniciales() { return R.valorInicialPedido(estado.segmento); }
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
    if (o.borde) c.style.setProperty('--borde', o.borde); // como variable, para que el foco pueda cambiarlo
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

  // Etiqueta «Ahorrás $ X»: se adapta al contenido y, al ganar o perder cifras, cada cifra (y el punto de los miles) entra o
  // sale animando su ancho y su opacidad (grid-template-columns 0fr ↔ 1fr), así el ícono desliza en lugar de saltar.
  // El número se compara desde la derecha: las cifras que siguen cambian de valor sin animarse (los dígitos son tabulares).
  // No se mide nada con JS. Un texto solo para lectores de pantalla evita que se lean las cifras sueltas.
  function crearEtiquetaAhorro() {
    var e = el('div', { class: 'etiqueta-ahorro', role: 'status' });
    var icono = el('span', { class: 'ico' }); icono.innerHTML = ICONO_CHANCHITO;
    var lector = el('span', { class: 'solo-lectores' });
    var visual = el('span', { 'aria-hidden': 'true' }, 'Ahorrás ');
    var monto = el('b', { class: 'monto' }, '$ '), cifras = el('span', { class: 'cifras' });
    monto.appendChild(cifras); visual.appendChild(monto);
    e.appendChild(icono); e.appendChild(lector); e.appendChild(visual);
    var slots = [];
    function poner(num, animar) {
      lector.textContent = 'Ahorrás $ ' + num;
      var cs = num.split('').reverse(), n = Math.max(cs.length, slots.length);
      for (var i = 0; i < n; i++) {
        var s = slots[i];
        if (i < cs.length) {
          if (!s) {
            var d = el('span', { class: 'dig' + (animar ? '' : ' sin-transicion') }), t = el('span', null, cs[i]);
            d.appendChild(t);
            s = slots[i] = { el: d, t: t, ch: cs[i], saliendo: false, id: 0 };
            cifras.insertBefore(d, slots[i - 1] ? slots[i - 1].el : null);
            void d.offsetWidth; // fija el estado inicial (ancho 0, transparente) antes de animar
            d.classList.add('on');
            if (!animar) { void d.offsetWidth; d.classList.remove('sin-transicion'); }
          } else {
            if (s.saliendo) { s.saliendo = false; clearTimeout(s.id); s.el.style.transitionDelay = ''; s.el.classList.add('on'); }
            if (s.ch !== cs[i]) { s.ch = cs[i]; s.t.textContent = cs[i]; }
          }
        } else if (s && !s.saliendo) {
          s.saliendo = true;
          // la opacidad arranca ya avanzada para que no se vea un instante el número equivocado
          s.el.style.transitionDelay = '0s, -175ms';
          s.el.classList.remove('on');
          (function (s) { s.id = setTimeout(function () { if (s.saliendo) { s.el.remove(); var k = slots.indexOf(s); if (k >= 0) slots.splice(k, 1); } }, 310); })(s);
        }
      }
    }
    function pintar(colores) {
      e.style.background = colores.etiquetaFondo; e.style.color = colores.etiquetaTexto;
      icono.style.color = colores.icono; monto.style.color = colores.etiquetaMonto;
    }
    return { nodo: e, poner: poner, pintar: pintar };
  }

  // Encabezado desktop (menú de usuario del diseño): «Personal» solo para Personal Bank y el saldo vigente.
  function aplicarEncabezado(raiz) {
    mostrar(raiz, 'pb-chip', estado.segmento === 'pb');
    ponerTexto(raiz, 'saldo-encabezado', R.miles(R.saldo()) + ' millas');
  }

  // Selector de la ficha (semi-simulador).
  function crearSelectorFicha(vista, repintarTodo) {
    var d = vista === 'desktop', g = el('div', { class: 'capa', style: 'left:0;top:0' });
    // Orden: rótulo → saldo (dato para decidir) → control → escala → campo y botón → aclaración como texto de ayuda
    var P2 = d ? { x: 913, precioY: 283, rotuloY: 341, dispY: 361, controlY: 383, ancho: 370, escalaY: 424, campo: [913, 454, 150, 36], boton: [1070, 454, 150, 36], ajusY: 498 }
               : { x: 15, precioY: 518, rotuloY: 576, dispY: 596, controlY: 618, ancho: 360, escalaY: 659, campo: [15, 689, 176, 36], boton: [198, 689, 176, 36], ajusY: 733 };
    var precio = pos(el('div', { class: 'txt', style: 'display:flex;align-items:baseline;gap:11px' }), P2.x, P2.precioY);
    var pesos = el('span', { style: 'font-size:26px;font-weight:700;line-height:37px' }), mil = el('span', { style: 'font-size:17px;font-weight:600' });
    precio.appendChild(pesos); precio.appendChild(mil); g.appendChild(precio);
    // Título: semibold, más oscuro y con aire entre letras; subtítulo: texto gris con el número destacado
    g.appendChild(texto('ELEGÍ LAS MILLAS A USAR', '', P2.x, P2.rotuloY, 'font-size:12px;font-weight:600;color:#464646;letter-spacing:.04em'));
    var disponibles = texto('', '', P2.x, P2.dispY, 'font-size:12px;color:#767676');
    disponibles.innerHTML = 'Tus millas disponibles: <b style="font-weight:600;color:#464646">' + R.miles(R.saldo()) + '</b>';
    g.appendChild(disponibles);
    var obj = estado.ficha, max = R.FICHA.maximo;
    var control = crearControl({ x: P2.x, y: P2.controlY, ancho: P2.ancho, etiqueta: 'Millas para este producto',
      alCambiar: function (v) { cambiarMillas(obj, v, max); repintarTodo(); } });
    g.appendChild(control.nodo);
    var escala = pos(el('div', { class: 'txt', style: 'display:flex;justify-content:space-between;font-size:14px;color:#767676' }), P2.x, P2.escalaY, P2.ancho);
    escala.appendChild(el('span', null, '0')); escala.appendChild(el('span', null, 'Máximo para este producto: ' + R.miles(max)));
    g.appendChild(escala);
    var campo = crearCampo({ x: P2.campo[0], y: P2.campo[1], w: P2.campo[2], h: P2.campo[3], borde: '#C8CFE1', radio: 5,
      maximo: function () { return max; }, alCambiar: function (v) { cambiarMillas(obj, v, max); repintarTodo(); } });
    var boton = crearBotonMax({ x: P2.boton[0], y: P2.boton[1], w: P2.boton[2], h: P2.boton[3], radio: 5,
      alTocar: function () { alternarMaximo(obj, max); repintarTodo(); } });
    g.appendChild(campo.nodo); g.appendChild(boton.nodo);
    var aclaracion = texto('Es un estimado: al pagar se ajusta al total del pedido y a tus millas.', '', P2.x, P2.ajusY, 'font-size:12px;color:#767676;white-space:normal');
    aclaracion.style.width = P2.ancho + 'px';
    g.appendChild(aclaracion);
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
    if (d) pos(t, 125, 305, 883, 202); else pos(t, 20, 315, 350, 293);
    var banda = el('div', { class: 'banda' }, 'Tus millas'); banda.style.height = (d ? 35 : 46) + 'px';
    t.appendChild(banda);
    t.appendChild(texto('¿Cuántas millas querés usar?', 'pregunta', 15, d ? 55 : 62));
    var saldo = texto('', 'saldo', 15, d ? 89 : 94); saldo.innerHTML = 'Millas disponibles: <b>' + R.miles(R.saldo()) + '</b>';
    t.appendChild(saldo);
    var cajaEtiqueta = el('div', { class: 'capa', style: 'right:15px;top:' + (d ? 55 : 92) + 'px' });
    t.appendChild(cajaEtiqueta);
    var etiqueta = crearEtiquetaAhorro(), etiquetaLista = false;
    etiqueta.nodo.style.position = 'relative'; cajaEtiqueta.appendChild(etiqueta.nodo);
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
      var fila = pos(el('div', { class: 'txt total', style: 'display:flex;justify-content:space-between;align-items:baseline' }), 15, 258, 320);
      totalValor = el('span', { class: 'total-monto' });
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
        etiqueta.pintar(c); etiqueta.poner(R.miles(R.ahorro(m)), etiquetaLista); etiquetaLista = true;
        if (totalValor) totalValor.textContent = R.pesos(r.total);
      }
    };
  }

  // Resumen de compra del checkout (desktop): caja fija al hacer scroll.
  function pintarResumen(caja, r) {
    var filas = [{ t: 'SubTotal', v: R.pesos(r.subtotal), c: '#5F6062' }];
    if (r.mostrarDescuento) filas.push({ t: 'Descuentos', v: R.pesos(-r.descuento), c: '#223F83', chevron: true });
    filas.push({ t: r.rotuloEntrega, v: R.pesos(r.entrega), c: '#5F6062' });
    filas.push({ t: 'Millas aplicadas', v: R.miles(r.millas), c: '#223F83' });
    // Título centrado en la franja de 38 px que cierra la línea gris. Con envío a domicilio, el sitio muestra
    // cuánto falta para el envío gratis en lugar de «RESUMEN».
    var falta = R.ENVIO_GRATIS_DESDE - r.subtotal;
    var titulo = r.entrega > 0 && falta > 0
      ? '<div class="titulo envio" style="top:9px;line-height:20px">Con ' + R.pesos(falta) + ' más el envío es gratis</div>'
      : '<div class="titulo" style="top:9px;line-height:20px">RESUMEN</div>';
    var h = titulo + '<div class="hr"></div>';
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
  // origen: esquina de la caja que las contiene, en coordenadas de la pantalla.
  function filasResumenCarrito(d, origen) {
    var r = R.resumenCarrito(estado.segmento, millasIniciales());
    var X = d ? { izq: 1056, der: 1292, y: 588, det: [1072, 1299], chev: 1044 } : { izq: 35, der: 356, y: 1516, det: [50, 362], chev: 23 };
    var g = el('div', { class: 'capa', style: 'left:' + (-origen[0]) + 'px;top:' + (-origen[1]) + 'px' });
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
    fila('Millas aplicadas', R.miles(r.millas), y, 'color:#223F83');
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
      { d: [893, 300], m: [8, 535], t: 'La ficha es un <b>semi-simulador</b>: en la ficha no se conocen los descuentos, así que el máximo se calcula sobre el precio sin promoción ($ 417 × 1,92 = 801). El ajuste fino se hace al pagar, y por eso la aclaración visible: «Es un estimado: al pagar se ajusta al total del pedido y a tus millas.» (siempre visible, sin tooltip), como texto de ayuda justo debajo del campo. El saldo va arriba del control, como en la tarjeta de Entrega. Lo elegido se guarda en el producto y se suma en el checkout.' },
      { d: [893, 352], m: [8, 586], t: 'Precio = precio sin promoción − millas ÷ 1,92, redondeado y nunca menor a $ 0. Valor por defecto: la mitad del máximo (sin cambios respecto de hoy). Rótulos fijos: solo cambian los valores. Colores del precio: Personal Bank todo en azul marino <code>#000D3C</code>; cliente común pesos en naranja <code>#FF6200</code> y millas en gris <code>#5F6062</code>, como hoy para quien no es Personal Bank.' },
      { d: [1234, 472], m: [376, 707], t: '<b>«Usar el máximo»</b> funciona como interruptor. Activo: fondo <code>#FEEEE3</code>, borde 2 px <code>#DE5500</code> y texto en semibold, como hoy. Para que la frase <b>no cambie de ancho</b> al activarse, el estado normal lleva <code>letter-spacing: .017em</code> (Myriad Pro 14 px: semibold 93 px, normal 89,7 px). Al desactivarlo vuelve al valor anterior. Si se mueve el control o se edita el campo, se desactiva.' },
      { d: [893, 568], m: [8, 803], t: '«Agregar al carrito» solo sube el contador del ícono; el carrito lateral se abre tocando el ícono. <b>En este prototipo el aceite no aparece en la lista del carrito</b> (simplificación: el carrito del diseño tiene 3 productos).' },
      { d: [950, 30], m: [290, 30], t: 'Menú de usuario como en el sitio: etiqueta «Personal», nombre y saldo de millas. El cliente común no lleva la etiqueta «Personal» (en mobile, el ícono PB).' }
    ],
    cajon: [
      { d: [190, 99], m: [175, 99], t: 'Encabezado «$ X + N millas»: N es el menor entre la suma de lo elegido en las fichas, el saldo y el máximo del pedido (<b>tope</b>). Por eso el carrito puede mostrar <b>menos millas que las elegidas en las fichas</b>. Casos: (1) <b>descuentos</b>: la ficha calcula su máximo sin promociones; el aceite solo, con «Usar el máximo» (801), aplica 720 ($ 375 × 1,92); con este carrito, «Usar el máximo» en las tres fichas suma 4.880 y el pedido aplica 4.861, por el descuento de Personal Bank del cuchillo ($ 100 → $ 90); (2) <b>saldo</b>: la suma supera el saldo (caso real de producción: 8.324 millas elegidas con saldo 6.058). No hay aviso en el carrito: la ficha ya avisa que es un estimado. Hoy el sitio suma sin tope; el tope entra en el alcance. En el prototipo, las fichas de este carrito suman 2.000.' },
      { d: [10, 420], m: [10, 420], t: 'Sin millas por producto en las líneas del carrito.' }
    ],
    carrito: [
      { d: [1030, 605], m: [12, 1533], t: 'Resumen del carrito completo: mismo cálculo que el checkout (fila «Millas aplicadas» con la cantidad, SubTotal ya descontadas las millas, con tope). En desktop queda <b>fijo al hacer scroll</b>, como en el checkout: <b>hoy no lo está</b> (<code>wCartFull</code>, <code>wCartFullWC</code> y <code>wCartSummary</code> no tienen ninguna regla sticky). Título «RESUMEN» centrado en su franja.' }
    ],
    entrega: [
      { d: [125, 321], m: [20, 330], t: 'Tarjeta <b>«Tus millas»</b> antes de «Tu pedido», con el mismo estilo de tarjeta (banda <code>#3E3F40</code>, radio 15, sombra <code>#CCCCCC</code> 2 px). Se elige después del tipo de entrega y la sucursal o dirección: ahí el monto con tarjeta ya es definitivo.' },
      { d: [125, 446], m: [22, 457], t: 'Valor inicial = suma de lo elegido en las fichas, con tope. Máximo del pedido = piso(total de productos con descuentos × 1,92), nunca más que el saldo. Las millas se aplican después de los descuentos (así no se usan de más) y <b>no cubren el envío</b> (por ahora).' },
      { d: [1008, 447], m: [372, 530], t: 'Control, campo y «Usar el máximo» sincronizados; el valor se acota entre 0 y el máximo. «Usar el máximo» es el mismo componente de la ficha. Teclado: flechas ±10, Shift+flechas ±100, Inicio/Fin.' },
      { d: [846, 373], m: [372, 420], t: 'Ahorro = millas ÷ 1,92, redondeado. Se muestra una sola vez. Etiqueta: azul en Personal Bank (fondo <code>#223F83</code> al 10 %), naranja suave en cliente común (fondo <code>#FF6200</code> al 10 %, texto gris por contraste). Monto en <code>font-weight: 600</code>. Ícono: Lucide piggy-bank (ISC). <b>Se adapta al contenido</b> (anclada a la derecha de la tarjeta): al ganar o perder cifras, cada cifra y el punto de los miles entran o salen animando su ancho y su opacidad (~250 ms), así el ícono desliza en lugar de saltar. Respeta «reducir movimiento».' },
      { d: [1043, 110], m: null, t: '<b>Resumen fijo al hacer scroll</b> (<code>position: sticky</code>) en los pasos del checkout, desktop. Título «RESUMEN» centrado en su franja. SubTotal en pesos ya descontadas las millas; fila «Millas aplicadas» con la cantidad (hoy dice «millas»); Total = SubTotal − Descuentos + entrega. Con todo cubierto: SubTotal $ 0 y sin fila de Descuentos. Con envío a domicilio, el título dice «Con $ X más el envío es gratis», como hoy en el sitio (X = $ 3.000 − SubTotal; umbral y cálculo tomados de una captura del sitio, a confirmar).' },
      { d: [792, 40], m: null, t: 'Si las millas cubren todo y la entrega no tiene costo (retiro sin costo o envío gratis), se saltea Forma de pago como hoy: <code>wCheckout</code> pone la clase <code>PaymentTabHidden</code>, la pestaña FORMA DE PAGO se oculta y CONFIRMACIÓN pasa a su lugar, y el botón dice «Continuar a Confirmación». En este recorrido (envío a domicilio con costo) no pasa: el envío siempre va con tarjeta.' },
      { d: null, m: [22, 585], t: 'En mobile el Resumen no está en este paso (la columna es <code>hidden-xs hidden-sm</code>): la tarjeta muestra «Total a pagar con tarjeta» = total + envío (rótulo 14/700, monto 16/700). Con envío a domicilio el envío siempre va con tarjeta: no se saltea Forma de pago.' }
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

  // «Necesito factura con RUT»: la etiqueta generada pasa a ser un <label> y el dibujo de Penpot se cambia
  // por el checkbox nativo del navegador en el mismo lugar (en el sitio es el nativo, sin estilo propio).
  function casillaRut(raiz) {
    var etiqueta = marca(raiz, 'rut'), dibujo = marca(raiz, 'casilla-rut');
    if (!etiqueta || !dibujo) return;
    var lbl = el('label', { class: 'b etiqueta-rut', style: etiqueta.getAttribute('style') });
    while (etiqueta.firstChild) lbl.appendChild(etiqueta.firstChild);
    etiqueta.parentNode.replaceChild(lbl, etiqueta);
    var check = pos(el('input', { type: 'checkbox' }), parseFloat(dibujo.style.left), parseFloat(dibujo.style.top));
    check.checked = estado.facturaRut;
    check.addEventListener('change', function () { estado.facturaRut = check.checked; });
    lbl.replaceChild(check, dibujo);
  }

  function construirPantalla() {
    var v = estado.vista, d = v === 'desktop', p = estado.pantalla;
    var s = pantallaGenerada(p + '-' + v);
    var alto = window.PANTALLAS[p + '-' + v].h;
    var actualizadores = [];
    function repintarTodo() { actualizadores.forEach(function (f) { f(); }); }

    if (p === 'ficha') {
      var sel = crearSelectorFicha(v, repintarTodo); s.appendChild(sel.nodo); actualizadores.push(sel.actualizar);
      aplicarEncabezado(s);
      mostrar(s, 'pb-icono', estado.segmento === 'pb');
      actualizadores.push(function () { ponerTexto(s, 'contador', estado.ficha.agregado ? '4' : '3'); });
      s.appendChild(zona(P(d, [913, 551, 370, 34], [15, 786, 360, 34]), 'Agregar al Carrito', function () { estado.ficha.agregado = true; repintarTodo(); }));
      s.appendChild(zona(P(d, [1108, 18, 48, 47], [339, 8, 40, 38]), 'Abrir el carrito', function () { estado.cajon = true; render(false); }));
      if (d) s.appendChild(zona(1243, 17.5, 70, 34, 'Pagar', function () { irA('entrega'); }));
    }

    if (p === 'carrito') {
      aplicarCliente(s);
      var proceder = function () { irA('entrega'); };
      if (d) {
        aplicarEncabezado(s);
        s.appendChild(zona(1243, 17.5, 70, 34, 'Pagar', proceder));
        // Resumen fijo al hacer scroll: la caja del diseño pasa a una columna con position: sticky
        var caja = marca(s, 'resumen-carrito');
        var colCarrito = pos(el('div', { class: 'columna-resumen' }), 1035, 537, 277.5, 1020 - 24 - 537);
        caja.style.position = 'sticky'; caja.style.left = 'auto';
        caja.style.top = ((altoBarra + 16) / zoomActual) + 'px';
        colCarrito.appendChild(caja); s.appendChild(colCarrito);
        caja.appendChild(filasResumenCarrito(d, [1035, 537]));
        caja.appendChild(zona(22, 249, 234, 34, 'Proceder al Pago', proceder));
      } else {
        s.appendChild(filasResumenCarrito(d, [0, 0]));
        s.appendChild(zona(35, 1714, 320, 34, 'Proceder al Pago', proceder));
      }
    }

    if (p === 'entrega') {
      var tj = crearTarjeta(v, repintarTodo); s.appendChild(tj.nodo); actualizadores.push(tj.actualizar);
      casillaRut(s);
      if (d) {
        var col = columnaResumen(alto); s.appendChild(col.nodo);
        actualizadores.push(function () { pintarResumen(col.caja, resumenActual()); });
        var tabPago = marca(s, 'tab-pago'), tabConf = marca(s, 'tab-confirmacion');
        // al ocultar FORMA DE PAGO, CONFIRMACIÓN pasa a su lugar (como en el sitio)
        var centro = function (n) { return izquierdaEnPantalla(n, s) + parseFloat(n.style.width) / 2; };
        var corrimiento = centro(tabPago) - centro(tabConf);
        var btn = pos(el('button', { class: 'boton-continuar', type: 'button' }), 735, 988, 278, 34);
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

  // Vista mobile sin barra de desplazamiento: con el mouse se desplaza arrastrando, como con el dedo.
  function arrastrarParaDesplazar(cont) {
    var inicio = null, movido = false;
    cont.addEventListener('pointerdown', function (ev) {
      if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
      if (ev.target.closest('input, textarea, select, .control')) return; // el control y el campo conservan su arrastre
      inicio = { y: ev.clientY, top: cont.scrollTop, id: ev.pointerId }; movido = false;
    });
    cont.addEventListener('pointermove', function (ev) {
      if (!inicio || ev.pointerId !== inicio.id) return;
      var dy = ev.clientY - inicio.y;
      if (!movido && Math.abs(dy) < 5) return;
      if (!movido) { movido = true; cont.setPointerCapture(ev.pointerId); cont.classList.add('arrastrando'); }
      cont.scrollTop = inicio.top - dy;
    });
    function fin() {
      if (!inicio) return;
      inicio = null; cont.classList.remove('arrastrando');
      if (!movido) return;
      // un arrastre no es un toque: se descarta el clic que sigue
      var cancelar = function (e) { e.stopPropagation(); e.preventDefault(); };
      cont.addEventListener('click', cancelar, true);
      setTimeout(function () { cont.removeEventListener('click', cancelar, true); }, 0);
    }
    cont.addEventListener('pointerup', fin);
    cont.addEventListener('pointercancel', fin);
  }

  // ---------------------------------------------------------------- render, barra y solapa
  var zoomActual = 1, altoBarra = 56, barraPlegada = false;
  function anchoVentana() { return document.documentElement.clientWidth || window.innerWidth || 1440; }
  var CONTENIDO = 1200, MARGEN = 16; // el contenido del sitio ocupa 1200 px centrados
  function leerPreferencia() { try { return localStorage.getItem('selector-millas:barra') === 'plegada'; } catch (e) { return false; } }
  function guardarPreferencia() { try { localStorage.setItem('selector-millas:barra', barraPlegada ? 'plegada' : 'abierta'); } catch (e) { /* sin almacenamiento */ } }
  // La barra puede ocupar dos renglones en pantallas angostas; plegada no ocupa lugar.
  function medirBarra() {
    document.body.classList.toggle('barra-plegada', barraPlegada);
    altoBarra = barraPlegada ? 0 : document.getElementById('barra').offsetHeight;
    document.documentElement.style.setProperty('--barra', altoBarra + 'px');
  }
  function render(irArriba) {
    pintarBarra();
    medirBarra();
    var esc = document.getElementById('escenario');
    var scrollPrevio = irArriba ? 0 : (estado.vista === 'desktop' ? window.scrollY : (esc.querySelector('.scroll') || {}).scrollTop || 0);
    esc.innerHTML = ''; document.getElementById('notas-capa').innerHTML = '';
    esc.className = estado.vista;
    var p = estado.pantalla, m = window.PANTALLAS[p + '-' + estado.vista], ancho = anchoVentana();
    var conPanel = estado.notas && ancho > 900; // en pantallas angostas el panel de notas va abajo
    if (estado.vista === 'desktop') {
      // La página ocupa todo el ancho: las franjas de fondo llegan a los bordes y el contenido
      // (1200 px, centrado) se achica proporcionalmente solo si la ventana no le da lugar.
      var disponible = ancho - (conPanel ? 384 : 0);
      zoomActual = Math.max(0.2, Math.min(1, disponible / (CONTENIDO + 2 * MARGEN)));
      document.documentElement.style.setProperty('--z', zoomActual);
      var anchoLienzo = disponible / zoomActual;
      var lienzo = el('div', { class: 'lienzo' });
      lienzo.style.width = anchoLienzo + 'px'; lienzo.style.height = m.h + 'px';
      (m.bandas || []).forEach(function (b) { lienzo.appendChild(el('div', { class: 'banda', style: 'top:' + b[0] + 'px;height:' + b[1] + 'px;background:' + b[2] })); });
      var pantalla = construirPantalla();
      var izquierda = (anchoLienzo - m.w) / 2;
      pantalla.style.left = izquierda + 'px';
      // lo que en el diseño está fuera de la columna de 1200 px (logo del checkout) queda pegado al borde de la ventana
      Array.prototype.forEach.call(pantalla.querySelectorAll('[data-k="ancla-izquierda"]'), function (n) { n.style.transform = 'translateX(' + (-izquierda) + 'px)'; });
      lienzo.appendChild(pantalla);
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
      if (conPanel) tel.style.marginLeft = Math.max(16, (ancho - 384 - 390) / 2) + 'px';
      esc.appendChild(tel);
      if (estado.cajon) construirCajon(tel, true);
      arrastrarParaDesplazar(sc);
      var cajonTel = tel.querySelector('.cajon'); if (cajonTel) arrastrarParaDesplazar(cajonTel);
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
    marcar('#b-saldo', String(R.saldo()));
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
    document.getElementById('b-saldo').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      R.fijarSaldo(+b.dataset.valor); reiniciarPedido(); render(false);
    });
    document.getElementById('b-notas').addEventListener('click', function () { estado.notas = !estado.notas; render(false); });
    document.getElementById('b-plegar').addEventListener('click', function () { plegar(true); });
    document.getElementById('solapa').addEventListener('click', function () { plegar(false); });
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { render(false); }, 120); });
    // Tocar un lugar que no hace nada marca por un momento las zonas que sí responden
    var esc = document.getElementById('escenario'), pista;
    esc.addEventListener('click', function (ev) {
      if (ev.target.closest('button, a, input, label, select, textarea, [role="slider"], .cajon-fondo')) return;
      esc.classList.remove('ver-zonas'); void esc.offsetWidth; esc.classList.add('ver-zonas');
      clearTimeout(pista); pista = setTimeout(function () { esc.classList.remove('ver-zonas'); }, 700);
    });
    render(true);
  }
  document.addEventListener('DOMContentLoaded', iniciar);
})();
