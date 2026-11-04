/*
 * Núcleo de la plantilla de prototipos: barra de control (plegable a una solapa), vista Desktop / Mobile,
 * notas para desarrollo con pines y pista de zonas tocables.
 * Las pantallas son fluidas y se dibujan dentro de un marco (iframe) del ancho de la vista: Desktop, todo el ancho de la
 * ventana; Mobile, el de un teléfono. Así el CSS de la pantalla, media queries incluidas, responde a ese ancho como en
 * un navegador de verdad.
 * No se edita al armar un prototipo: lo propio de cada feature va en js/prototipo.js (configuración y pantallas)
 * y en css/prototipo.css. Ver CLAUDE.md y README.md.
 */
(function () {
  'use strict';
  // Versión que se cargó (la pone herramientas/subir-version.js como ?v= en index.html): se ve en el título de la pestaña
  // para saber a simple vista si el navegador trajo la última publicación o una guardada en caché.
  var VERSION = (function () { var s = document.currentScript, m = s && /[?&]v=([0-9-]+)/.exec(s.src); return m ? m[1] : 'local'; })();

  // ---------------------------------------------------------------- utilidades (también para js/prototipo.js)
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
  // tocable(elemento, etiqueta, accion): un elemento de la pantalla que responde a un toque. Lleva la clase «interactivo»,
  // así se marca en la pista que aparece al tocar un lugar que no hace nada. Los demás enlaces y botones no navegan.
  function tocable(n, etiqueta, accion) {
    n.classList.add('interactivo');
    var nativo = /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(n.tagName);
    if (!nativo && !n.hasAttribute('tabindex')) { n.setAttribute('tabindex', '0'); n.setAttribute('role', 'button'); }
    if (etiqueta && !n.textContent.trim() && !n.getAttribute('aria-label')) n.setAttribute('aria-label', etiqueta);
    n.addEventListener('click', function (ev) { ev.preventDefault(); accion(ev); });
    if (!nativo) n.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); accion(ev); } });
    return n;
  }
  // Aviso modal simple (por ejemplo, «Fin del recorrido»). botones: [[texto, accion]]; el último es el secundario.
  function aviso(titulo, texto, botones) {
    var f = el('div', { class: 'modal-fondo' });
    var m = el('div', { class: 'modal', role: 'dialog', 'aria-label': titulo });
    m.appendChild(el('h2', null, titulo)); m.appendChild(el('p', { html: texto }));
    (botones || [['Cerrar', null]]).forEach(function (b, i, todos) {
      var boton = el('button', { type: 'button', class: i && i === todos.length - 1 ? 'secundario' : '' }, b[0]);
      boton.addEventListener('click', function () { f.remove(); if (b[1]) b[1](); });
      m.appendChild(boton);
    });
    f.appendChild(m); document.body.appendChild(f);
    m.querySelector('button').focus();
  }

  // ---------------------------------------------------------------- estado y configuración
  var cfg, estado, barraPlegada = false;
  var VISTA = { id: 'vista', nombre: 'Vista', opciones: [['desktop', 'Desktop'], ['mobile', 'Mobile']], reiniciaScroll: true };
  function grupos() { return [VISTA].concat(cfg.controles || []); }
  function hayNotas() { return !!cfg.notas && Object.keys(cfg.notas).some(function (k) { return (cfg.notas[k] || []).length; }); }
  function claveNotas() {
    if (cfg.claveNotas) return cfg.claveNotas(estado);
    var primero = (cfg.controles || [])[0];
    return primero ? estado[primero.id] : 'general';
  }
  // Nombre de la pantalla en el encabezado del panel de notas: el rótulo de la opción que tiene esa clave.
  function nombreNotas(clave) {
    var nombre = clave;
    grupos().forEach(function (g) { g.opciones.forEach(function (o) { if (String(o[0]) === clave) nombre = o[1]; }); });
    return nombre;
  }
  function anchoVentana() { return document.documentElement.clientWidth || window.innerWidth || 1440; }
  function claveAlmacen() { return 'prototipo:' + (cfg.clave || cfg.titulo) + ':barra'; }
  function leerPreferencia() { try { return localStorage.getItem(claveAlmacen()) === 'plegada'; } catch (e) { return false; } }
  function guardarPreferencia() { try { localStorage.setItem(claveAlmacen(), barraPlegada ? 'plegada' : 'abierta'); } catch (e) { /* sin almacenamiento */ } }

  // ---------------------------------------------------------------- barra y solapa
  var FLECHA_ARRIBA = '<svg viewBox="0 0 12 8" aria-hidden="true"><path d="M1 7l5-5 5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var FLECHA_ABAJO = '<svg viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function armarBarra() {
    var barra = document.getElementById('barra');
    barra.innerHTML = '';
    barra.appendChild(el('span', { class: 'titulo' }, cfg.titulo));
    // Vista va siempre primero; después, los controles de la feature en el orden de la configuración. Los que prueban
    // variantes de diseño (variante: true) van juntos al final, en su propio recuadro: se sacan a medida que se decide.
    var variantes = null;
    grupos().forEach(function (g) {
      var grupo = el('div', { class: 'grupo' });
      grupo.appendChild(el('span', null, g.nombre));
      var seg = el('div', { class: 'seg', role: 'group', 'aria-label': g.nombre, 'data-control': g.id });
      g.opciones.forEach(function (o) { seg.appendChild(el('button', { type: 'button', 'data-valor': String(o[0]) }, o[1])); });
      seg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) cambiar(g, b.dataset.valor); });
      grupo.appendChild(seg);
      if (!g.variante) { barra.appendChild(grupo); return; }
      if (!variantes) {
        variantes = el('div', { class: 'variantes', role: 'group', 'aria-label': 'Variantes de diseño' });
        variantes.appendChild(el('span', { class: 'rotulo-variantes' }, 'Variantes de diseño'));
      }
      variantes.appendChild(grupo);
    });
    if (variantes) barra.appendChild(variantes);
    // El botón de notas aparece solo si la configuración trae notas.
    if (hayNotas()) {
      var notas = el('button', { type: 'button', class: 'accion notas', id: 'b-notas', 'aria-pressed': 'false' }, 'Notas para desarrollo');
      notas.addEventListener('click', function () { estado.notas = !estado.notas; render(false); });
      barra.appendChild(notas);
    }
    var plegar = el('button', { type: 'button', class: 'accion plegar', id: 'b-plegar', 'aria-label': 'Ocultar la barra', title: 'Ocultar la barra', html: FLECHA_ARRIBA });
    plegar.addEventListener('click', function () { plegarBarra(true); });
    barra.appendChild(plegar);
    var solapa = document.getElementById('solapa');
    solapa.innerHTML = FLECHA_ABAJO + 'Prototipo';
    solapa.onclick = function () { plegarBarra(false); };
  }
  // Una opción puede traer un tercer elemento, mostrar(estado): aparece solo cuando devuelve true.
  function opcionVisible(o) { return !o[2] || !!o[2](estado); }
  // Si el valor de un control quedó en una opción oculta (por ejemplo, al cambiar de vista), pasa a la primera visible.
  // Cambiar un valor puede ocultar opciones de otros controles: se repite hasta que no cambie nada.
  function ajustarValores() {
    for (var vuelta = 0; vuelta < 5; vuelta++) {
      var cambio = false;
      grupos().forEach(function (g) {
        var visibles = g.opciones.filter(opcionVisible);
        if (!visibles.length || visibles.some(function (o) { return String(o[0]) === String(estado[g.id]); })) return;
        estado[g.id] = String(visibles[0][0]);
        if (g.alCambiar) g.alCambiar(estado[g.id], estado);
        cambio = true;
      });
      if (!cambio) return;
    }
  }
  function pintarBarra() {
    grupos().forEach(function (g) {
      var visibles = 0;
      Array.prototype.forEach.call(document.querySelectorAll('[data-control="' + g.id + '"] button'), function (b, i) {
        b.setAttribute('aria-pressed', b.dataset.valor === String(estado[g.id]) ? 'true' : 'false');
        b.hidden = !opcionVisible(g.opciones[i]);
        if (!b.hidden) visibles++;
      });
      // mostrar(estado): el control aparece solo donde cambia algo de la pantalla (su valor se conserva igual); con menos
      // de dos opciones visibles tampoco, porque no hay nada que elegir
      var seg = document.querySelector('[data-control="' + g.id + '"]');
      if (seg) seg.parentNode.hidden = (!!g.mostrar && !g.mostrar(estado)) || visibles < 2;
    });
    // el recuadro de variantes, solo si alguna se ve en esta pantalla
    var rv = document.querySelector('#barra .variantes');
    if (rv) rv.hidden = !rv.querySelector('.grupo:not([hidden])');
    var bn = document.getElementById('b-notas');
    if (bn) bn.setAttribute('aria-pressed', estado.notas ? 'true' : 'false');
  }
  // La barra puede ocupar dos renglones en pantallas angostas; plegada no ocupa lugar.
  function medirBarra() {
    document.body.classList.toggle('barra-plegada', barraPlegada);
    var alto = barraPlegada ? 0 : document.getElementById('barra').offsetHeight;
    document.documentElement.style.setProperty('--barra', alto + 'px');
  }
  function plegarBarra(valor) {
    barraPlegada = valor; guardarPreferencia(); render(false);
    document.getElementById(valor ? 'solapa' : 'b-plegar').focus({ preventScroll: true });
  }
  function cambiar(g, valor) {
    estado[g.id] = valor;
    if (g.alCambiar) g.alCambiar(valor, estado);
    render(!!g.reiniciaScroll);
  }

  // ---------------------------------------------------------------- marco de la pantalla
  // Un solo iframe para todo el recorrido (moverlo de lugar lo recargaría): cambia de ancho con la vista y en cada render
  // se le cambia el contenido. Estilos del núcleo dentro del marco: pines, pista de zonas y desplazamiento en mobile.
  var CSS_MARCO = [
    '.contenido { width: 100%; max-width: var(--contenido); margin-left: auto; margin-right: auto; }',
    '.interactivo { cursor: pointer; }',
    // Mobile sin barra de desplazamiento: se desplaza con el dedo, la rueda o arrastrando con el mouse
    'html[data-vista="mobile"], html[data-vista="mobile"] * { scrollbar-width: none; }',
    'html[data-vista="mobile"] ::-webkit-scrollbar, html[data-vista="mobile"]::-webkit-scrollbar { display: none; }',
    'html.proto-arrastrando, html.proto-arrastrando * { cursor: grabbing !important; user-select: none !important; }',
    '#proto-capa { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 2147483000; pointer-events: none; }',
    '.proto-pin { position: absolute; width: 24px; height: 24px; margin: -12px 0 0 -12px; padding: 0; border-radius: 50%; pointer-events: auto;',
    '  background: #FFD84D; border: 2px solid #8A6D00; color: #4A3A00; font: 700 12px "Source Sans 3", system-ui, sans-serif;',
    '  display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.3); }',
    '.proto-pin[aria-expanded="true"] { background: #1F2430; color: #FFD84D; border-color: #FFD84D; }',
    // Pista de zonas, igual a las "hotspot hints" de Figma: un recuadro #30C2FF, borde de 2 px por dentro y relleno al
    // 50 %, sobre cada elemento tocable. Aparece de golpe, se desvanece y a los 0,7 s se corta.
    '.proto-pista { position: absolute; box-sizing: border-box; border: 2px solid #30C2FF; background: rgba(48, 194, 255, .5);',
    '  opacity: .14; animation: proto-pista .7s linear; }',
    '@keyframes proto-pista { 0% { opacity: 1; } 10% { opacity: .92; } 20% { opacity: .81; } 33% { opacity: .67; } 50% { opacity: .5; }',
    '  66% { opacity: .37; } 80% { opacity: .25; } 90% { opacity: .19; } 100% { opacity: .14; } }',
    '@media (prefers-reduced-motion: reduce) { .proto-pista { animation: none; opacity: .6; } }'
  ].join('\n');
  var marco, doc, cabezaActual = null, capa = null, pines = [], esperaReubicar = 0, pista = 0;

  function conVersion(href) { return VERSION === 'local' ? href : href + (href.indexOf('?') < 0 ? '?' : '&') + 'v=' + VERSION; }
  function crearMarco() {
    var soporte = el('div', { class: 'soporte' });
    marco = el('iframe', { class: 'marco', title: 'Pantalla del prototipo' });
    soporte.appendChild(marco);
    document.getElementById('escenario').appendChild(soporte);
    doc = marco.contentDocument;
    // Con doctype, para que el marco no quede en modo quirks; las rutas relativas de la pantalla salen de index.html.
    var base = location.href.replace(/[?#].*$/, '').replace(/"/g, '%22');
    doc.open();
    doc.write('<!doctype html><html lang="es"><head><meta charset="utf-8"><base href="' + base + '"></head><body></body></html>');
    doc.close();
    var D = cfg.desktop || {};
    CSS_MARCO = ':root { --contenido: ' + (D.anchoContenido || 1200) + 'px; }\n' + CSS_MARCO;
    escucharMarco();
  }
  function escucharMarco() {
    // Solo responde lo tocable; el resto de los enlaces y botones de la pantalla no navega y marca las zonas tocables.
    doc.addEventListener('click', function (ev) {
      var t = ev.target;
      if (t.closest('.interactivo, .proto-pin')) { if (t.closest('a[href]')) ev.preventDefault(); return; }
      if (t.closest('input:not([type="button"]):not([type="submit"]):not([type="image"]), textarea, select, label')) return;
      ev.preventDefault(); ev.stopPropagation();
      mostrarPista();
    }, true);
    doc.addEventListener('submit', function (ev) { ev.preventDefault(); }, true);
    // Los pines siguen a su elemento: al desplazar (también dentro de un panel), al cargar una imagen o al cambiar el ancho.
    doc.addEventListener('scroll', reubicarPronto, true);
    doc.addEventListener('load', reubicarPronto, true);
    marco.contentWindow.addEventListener('resize', reubicarPronto);
    if (window.ResizeObserver) new ResizeObserver(reubicarPronto).observe(doc.body);
    arrastrarParaDesplazar();
  }
  // Vista mobile: con el mouse se desplaza arrastrando, como con el dedo (la página o el panel que tenga desplazamiento).
  function arrastrarParaDesplazar() {
    var inicio = null, movido = false;
    doc.addEventListener('pointerdown', function (ev) {
      if (estado.vista !== 'mobile' || ev.pointerType !== 'mouse' || ev.button !== 0) return;
      if (ev.target.closest('input, textarea, select, [role="slider"]')) return; // controles con arrastre propio
      var c = desplazable(ev.target);
      inicio = { y: ev.clientY, top: c.scrollTop, id: ev.pointerId, c: c }; movido = false;
    });
    doc.addEventListener('pointermove', function (ev) {
      if (!inicio || ev.pointerId !== inicio.id) return;
      var dy = ev.clientY - inicio.y;
      if (!movido && Math.abs(dy) < 5) return;
      if (!movido) { movido = true; doc.documentElement.setPointerCapture(ev.pointerId); doc.documentElement.classList.add('proto-arrastrando'); }
      inicio.c.scrollTop = inicio.top - dy;
    });
    function fin() {
      if (!inicio) return;
      inicio = null; doc.documentElement.classList.remove('proto-arrastrando');
      if (!movido) return;
      // un arrastre no es un toque: se descarta el clic que sigue
      var cancelar = function (e) { e.stopPropagation(); e.preventDefault(); };
      doc.addEventListener('click', cancelar, true);
      setTimeout(function () { doc.removeEventListener('click', cancelar, true); }, 0);
    }
    doc.addEventListener('pointerup', fin);
    doc.addEventListener('pointercancel', fin);
  }
  function desplazable(n) {
    for (; n && n !== doc.body && n !== doc.documentElement; n = n.parentElement) {
      var s = marco.contentWindow.getComputedStyle(n);
      if (/(auto|scroll)/.test(s.overflowY) && n.scrollHeight > n.clientHeight + 1) return n;
    }
    return doc.scrollingElement;
  }
  // Cabeza del marco: la de la pantalla (cabeza, HTML con <link> y <style>) más cfg.estilos y los estilos del núcleo.
  // Se reemplaza solo si cambió, así pasar de una opción a otra en la misma pantalla no recarga los estilos.
  function ponerCabeza(cabeza) {
    var texto = (cabeza || '') + (cfg.estilos || []).map(function (h) { return '<link rel="stylesheet" href="' + conVersion(h) + '">'; }).join('');
    if (texto === cabezaActual) return;
    cabezaActual = texto;
    Array.prototype.slice.call(doc.head.children).forEach(function (n) { if (!n.matches('meta[charset], base')) n.remove(); });
    doc.head.insertAdjacentHTML('beforeend', texto + '<style id="proto-nucleo">' + CSS_MARCO + '</style>');
  }

  // ---------------------------------------------------------------- notas para desarrollo
  // Cada nota se ancla a un elemento de la pantalla: d / m es un selector CSS (el pin va en su esquina superior
  // izquierda) o [selector, dx, dy] para correrlo esos píxeles.
  function pinesYPanel() {
    pines = [];
    if (!estado.notas || !hayNotas()) return;
    var clave = claveNotas(), desktop = estado.vista === 'desktop';
    var lista = (cfg.notas[clave] || []).filter(function (n) { return n[desktop ? 'd' : 'm']; });
    var panel = el('aside', { class: 'panel-notas', 'aria-label': 'Notas para desarrollo' });
    panel.appendChild(el('header', null, 'Notas para desarrollo · ' + nombreNotas(clave)));
    var ol = el('ol');
    function marcar(i) {
      Array.prototype.forEach.call(ol.children, function (x, j) { x.classList.toggle('resaltada', j === i); });
      pines.forEach(function (p, j) { p.nodo.setAttribute('aria-expanded', j === i ? 'true' : 'false'); });
    }
    lista.forEach(function (n, i) {
      var a = n[desktop ? 'd' : 'm']; if (!Array.isArray(a)) a = [a, 0, 0];
      var pin = el('button', { class: 'proto-pin', type: 'button', 'aria-expanded': 'false', 'aria-label': 'Nota ' + (i + 1) }, String(i + 1));
      var li = el('li', { html: '<b class="n">' + (i + 1) + '</b><div>' + n.t + '</div>' });
      pin.addEventListener('click', function () { marcar(i); li.scrollIntoView({ block: 'nearest' }); });
      li.addEventListener('click', function (ev) {
        if (ev.target.closest('a')) return;
        marcar(i); if (pin.style.display !== 'none') pin.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      capa.appendChild(pin); ol.appendChild(li);
      pines.push({ nodo: pin, selector: a[0], dx: a[1] || 0, dy: a[2] || 0 });
    });
    if (!lista.length) ol.appendChild(el('li', { html: '<b class="n">·</b><div>Sin notas en esta pantalla.</div>' }));
    panel.appendChild(ol);
    document.getElementById('notas-capa').appendChild(panel);
  }
  function reubicar() {
    esperaReubicar = 0;
    if (!capa || !capa.isConnected) return;
    var base = capa.getBoundingClientRect();
    pines.forEach(function (p) {
      var t = doc.querySelector(p.selector), r = t && t.getBoundingClientRect(), visible = r && (r.width || r.height);
      p.nodo.style.display = visible ? '' : 'none';
      if (visible) { p.nodo.style.left = (r.left - base.left + p.dx) + 'px'; p.nodo.style.top = (r.top - base.top + p.dy) + 'px'; }
    });
  }
  // Caja de un elemento tocable. Si no tiene alto o ancho propio (en GeneXus, un contenedor cuyo contenido se desborda,
  // como el logo de la cabecera mobile), la que ocupa lo que se ve de su contenido dentro de la vista.
  function cajaTocable(n) {
    var r = n.getBoundingClientRect();
    if (r.width && r.height) return r;
    var w = doc.defaultView, x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    Array.prototype.forEach.call(n.querySelectorAll('*'), function (c) {
      var q = c.getBoundingClientRect();
      if (!q.width || !q.height || q.right <= 0 || q.bottom <= 0 || q.left >= w.innerWidth || q.top >= w.innerHeight) return;
      x1 = Math.min(x1, q.left); y1 = Math.min(y1, q.top); x2 = Math.max(x2, q.right); y2 = Math.max(y2, q.bottom);
    });
    return x2 > x1 && y2 > y1 ? { left: x1, top: y1, width: x2 - x1, height: y2 - y1 } : null;
  }
  // Se puede tocar ahora: está dentro de la vista y ninguna otra capa lo tapa (un diálogo, un panel abierto, la cabecera
  // fija o una capa transparente). Se prueba el centro y cuatro puntos cerca de las esquinas: alcanza con que uno toque el
  // elemento (por ejemplo, el fondo de un diálogo, que queda tapado en el medio).
  function alcanzable(n, r) {
    var w = doc.defaultView;
    return [[0.5, 0.5], [0.1, 0.1], [0.9, 0.1], [0.1, 0.9], [0.9, 0.9]].some(function (f) {
      var x = r.left + r.width * f[0], y = r.top + r.height * f[1];
      if (x < 0 || y < 0 || x >= w.innerWidth || y >= w.innerHeight) return false;
      var h = doc.elementFromPoint(x, y);
      return !!h && (h === n || n.contains(h));
    });
  }
  function reubicarPronto() { if (!esperaReubicar) esperaReubicar = requestAnimationFrame(reubicar); }
  // Tocar un lugar que no hace nada marca por un momento lo que sí responde.
  function mostrarPista() {
    if (!capa) return;
    Array.prototype.forEach.call(capa.querySelectorAll('.proto-pista'), function (x) { x.remove(); });
    var base = capa.getBoundingClientRect();
    Array.prototype.forEach.call(doc.querySelectorAll('.interactivo'), function (n) {
      var r = cajaTocable(n);
      if (!r || !alcanzable(n, r)) return;
      capa.appendChild(el('div', { class: 'proto-pista', style: 'left:' + (r.left - base.left) + 'px;top:' + (r.top - base.top) + 'px;width:' + r.width + 'px;height:' + r.height + 'px' }));
    });
    clearTimeout(pista);
    pista = setTimeout(function () { Array.prototype.forEach.call(capa.querySelectorAll('.proto-pista'), function (x) { x.remove(); }); }, 700);
  }

  // ---------------------------------------------------------------- render
  // pantalla(estado) devuelve { html | nodo, cabeza, claseHtml, claseCuerpo, despues }: el contenido del body del marco,
  // los <link>/<style> de su cabeza, las clases de <html> y <body>, y una función que recibe el documento del marco
  // ya armado (para ajustarlo antes de mostrarlo).
  function render(irArriba) {
    ajustarValores();
    pintarBarra();
    medirBarra();
    var esc = document.getElementById('escenario');
    var scrollPrevio = irArriba ? 0 : doc.scrollingElement.scrollTop;
    document.getElementById('notas-capa').innerHTML = '';
    esc.className = estado.vista + (estado.notas && hayNotas() ? ' con-notas' : '');
    var p = cfg.pantalla(estado, { el: el, tocable: tocable, ir: ir, render: function () { render(false); } });
    ponerCabeza(p.cabeza);
    doc.documentElement.className = p.claseHtml || '';
    doc.documentElement.setAttribute('data-vista', estado.vista);
    doc.body.className = p.claseCuerpo || '';
    if (p.html != null) doc.body.innerHTML = p.html;
    else { doc.body.innerHTML = ''; if (p.nodo) doc.body.appendChild(p.nodo); }
    capa = doc.createElement('div'); capa.id = 'proto-capa';
    doc.body.appendChild(capa);
    if (p.despues) p.despues(doc);
    pinesYPanel();
    doc.scrollingElement.scrollTop = scrollPrevio;
    reubicar();
  }
  // Ir a otra opción de un control desde la pantalla (por ejemplo, ir('paso', 'detalle') desde un elemento tocable).
  function ir(id, valor) {
    var g = grupos().filter(function (x) { return x.id === id; })[0];
    if (g) cambiar(g, String(valor)); else { estado[id] = valor; render(true); }
  }

  function iniciar(config) {
    cfg = config;
    // En una ventana angosta (un teléfono) arranca siempre en Mobile: la vista Desktop ahí no se puede usar.
    var inicial = { vista: anchoVentana() < 700 ? 'mobile' : (cfg.vistaInicial || 'desktop'), notas: false };
    (cfg.controles || []).forEach(function (g) { inicial[g.id] = String(g.inicial != null ? g.inicial : g.opciones[0][0]); });
    estado = Object.assign(inicial, cfg.estadoInicial ? cfg.estadoInicial() : {});
    document.title = cfg.titulo + ' · prototipo · v' + VERSION;
    document.documentElement.style.setProperty('--ancho-movil', ((cfg.mobile || {}).ancho || 390) + 'px');
    barraPlegada = leerPreferencia();
    armarBarra();
    crearMarco();
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { medirBarra(); reubicarPronto(); }, 120); });
    render(true);
  }

  window.Prototipo = {
    iniciar: function (config) {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { iniciar(config); });
      else iniciar(config);
    },
    el: el, tocable: tocable, aviso: aviso, ir: ir,
    render: function () { render(false); },
    estado: function () { return estado; },
    documento: function () { return doc; }
  };
})();
