/*
 * Núcleo de la plantilla de prototipos: barra de control (plegable a una solapa), vista Desktop / Mobile,
 * notas para desarrollo con pines y pista de zonas tocables.
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
  function pos(n, x, y, w, h) {
    n.style.left = x + 'px'; n.style.top = y + 'px';
    if (w != null) n.style.width = w + 'px';
    if (h != null) n.style.height = h + 'px';
    return n;
  }
  // zona(x, y, w, h, etiqueta, accion) o zona([x, y, w, h], etiqueta, accion): área tocable sobre la pantalla.
  // Las zonas (y todo lo que lleve la clase «interactivo») se marcan al tocar un lugar que no hace nada.
  function zona(x, y, w, h, etiqueta, accion) {
    if (Array.isArray(x)) { etiqueta = y; accion = w; var a = x; x = a[0]; y = a[1]; w = a[2]; h = a[3]; }
    var z = pos(el('button', { class: 'zona', type: 'button', 'aria-label': etiqueta, title: etiqueta }), x, y, w, h);
    z.addEventListener('click', accion);
    return z;
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
  var cfg, estado, zoomActual = 1, barraPlegada = false;
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
    // Vista va siempre primero; después, los controles de la feature en el orden de la configuración.
    grupos().forEach(function (g) {
      var grupo = el('div', { class: 'grupo' });
      grupo.appendChild(el('span', null, g.nombre));
      var seg = el('div', { class: 'seg', role: 'group', 'aria-label': g.nombre, 'data-control': g.id });
      g.opciones.forEach(function (o) { seg.appendChild(el('button', { type: 'button', 'data-valor': String(o[0]) }, o[1])); });
      seg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) cambiar(g, b.dataset.valor); });
      grupo.appendChild(seg); barra.appendChild(grupo);
    });
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
  function pintarBarra() {
    grupos().forEach(function (g) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-control="' + g.id + '"] button'), function (b) {
        b.setAttribute('aria-pressed', b.dataset.valor === String(estado[g.id]) ? 'true' : 'false');
      });
    });
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

  // ---------------------------------------------------------------- notas para desarrollo
  function pinesYPanel(pantalla) {
    if (!estado.notas || !hayNotas()) return;
    var clave = claveNotas(), desktop = estado.vista === 'desktop';
    var lista = (cfg.notas[clave] || []).filter(function (n) { return n[desktop ? 'd' : 'm']; });
    var panel = el('aside', { class: 'panel-notas', 'aria-label': 'Notas para desarrollo' });
    panel.appendChild(el('header', null, 'Notas para desarrollo · ' + nombreNotas(clave)));
    var ol = el('ol');
    lista.forEach(function (n, i) {
      var p = n[desktop ? 'd' : 'm'];
      var pin = pos(el('button', { class: 'pin', type: 'button', 'aria-expanded': 'false', 'aria-label': 'Nota ' + (i + 1) }, String(i + 1)), p[0], p[1]);
      var li = el('li', { html: '<b class="n">' + (i + 1) + '</b><div>' + n.t + '</div>' });
      pin.addEventListener('click', function () {
        Array.prototype.forEach.call(ol.children, function (x) { x.classList.remove('resaltada'); });
        Array.prototype.forEach.call(document.querySelectorAll('.pin'), function (x) { x.setAttribute('aria-expanded', 'false'); });
        li.classList.add('resaltada'); pin.setAttribute('aria-expanded', 'true'); li.scrollIntoView({ block: 'nearest' });
      });
      pantalla.appendChild(pin); ol.appendChild(li);
    });
    if (!lista.length) ol.appendChild(el('li', { html: '<b class="n">·</b><div>Sin notas en esta pantalla.</div>' }));
    panel.appendChild(ol);
    document.getElementById('notas-capa').appendChild(panel);
  }

  // ---------------------------------------------------------------- render
  // Vista mobile sin barra de desplazamiento: con el mouse se desplaza arrastrando, como con el dedo.
  function arrastrarParaDesplazar(cont) {
    var inicio = null, movido = false;
    cont.addEventListener('pointerdown', function (ev) {
      if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
      if (ev.target.closest('input, textarea, select, [role="slider"]')) return; // controles con arrastre propio
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

  function render(irArriba) {
    pintarBarra();
    medirBarra();
    var esc = document.getElementById('escenario');
    var scrollPrevio = irArriba ? 0 : (estado.vista === 'desktop' ? window.scrollY : (esc.querySelector('.scroll') || {}).scrollTop || 0);
    esc.innerHTML = ''; document.getElementById('notas-capa').innerHTML = '';
    esc.className = estado.vista;
    var ancho = anchoVentana(), conPanel = estado.notas && hayNotas() && ancho > 900; // en pantallas angostas el panel va abajo
    var p = cfg.pantalla(estado, { el: el, pos: pos, zona: zona, ir: ir, render: function () { render(false); } });
    var nodo = p.nodo;
    nodo.classList.add('pantalla');
    if (estado.vista === 'desktop') {
      // La página ocupa todo el ancho: las bandas de fondo llegan a los bordes y el contenido (centrado) se achica
      // proporcionalmente solo si la ventana no le da lugar.
      var D = cfg.desktop || {}, anchoDiseno = D.anchoDiseno || 1440, contenido = D.anchoContenido || 1200;
      var disponible = ancho - (conPanel ? 384 : 0);
      zoomActual = Math.max(0.2, Math.min(1, disponible / (contenido + 32)));
      document.documentElement.style.setProperty('--z', zoomActual);
      var anchoLienzo = disponible / zoomActual;
      var lienzo = el('div', { class: 'lienzo' });
      lienzo.style.width = anchoLienzo + 'px'; lienzo.style.height = p.alto + 'px';
      (p.bandas || []).forEach(function (b) { lienzo.appendChild(el('div', { class: 'banda', style: 'top:' + b[0] + 'px;height:' + b[1] + 'px;background:' + b[2] })); });
      pos(nodo, (anchoLienzo - anchoDiseno) / 2, 0, anchoDiseno, p.alto);
      pinesYPanel(nodo);
      lienzo.appendChild(nodo);
      esc.appendChild(lienzo);
      window.scrollTo(0, scrollPrevio);
    } else {
      zoomActual = 1;
      document.documentElement.style.setProperty('--z', 1);
      var anchoMovil = (cfg.mobile || {}).ancho || 390;
      var tel = el('div', { class: 'telefono', style: 'width:' + anchoMovil + 'px' }), sc = el('div', { class: 'scroll' });
      nodo.style.width = anchoMovil + 'px'; nodo.style.height = p.alto + 'px';
      if (ancho < anchoMovil) nodo.style.zoom = ancho / anchoMovil;
      pinesYPanel(nodo);
      sc.appendChild(nodo); tel.appendChild(sc);
      if (conPanel) tel.style.marginLeft = Math.max(16, (ancho - 384 - anchoMovil) / 2) + 'px';
      esc.appendChild(tel);
      arrastrarParaDesplazar(sc);
      sc.scrollTop = scrollPrevio;
      window.scrollTo(0, 0);
    }
    if (p.despues) p.despues(nodo);
    pintarBarra();
  }
  // Ir a otra opción de un control desde la pantalla (por ejemplo, ir('paso', 'detalle') desde una zona).
  function ir(id, valor) {
    var g = grupos().filter(function (x) { return x.id === id; })[0];
    if (g) cambiar(g, String(valor)); else { estado[id] = valor; render(true); }
  }

  function iniciar(config) {
    cfg = config;
    var inicial = { vista: cfg.vistaInicial || 'desktop', notas: false };
    (cfg.controles || []).forEach(function (g) { inicial[g.id] = String(g.inicial != null ? g.inicial : g.opciones[0][0]); });
    estado = Object.assign(inicial, cfg.estadoInicial ? cfg.estadoInicial() : {});
    document.title = cfg.titulo + ' · prototipo · v' + VERSION;
    barraPlegada = leerPreferencia();
    armarBarra();
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { render(false); }, 120); });
    // Tocar un lugar que no hace nada marca por un momento las zonas que sí responden
    var esc = document.getElementById('escenario'), pista;
    esc.addEventListener('click', function (ev) {
      if (ev.target.closest('button, a, input, label, select, textarea, [role="slider"], .interactivo')) return;
      esc.classList.remove('ver-zonas'); void esc.offsetWidth; esc.classList.add('ver-zonas');
      clearTimeout(pista); pista = setTimeout(function () { esc.classList.remove('ver-zonas'); }, 700);
    });
    render(true);
  }

  window.Prototipo = {
    iniciar: function (config) {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { iniciar(config); });
      else iniciar(config);
    },
    el: el, pos: pos, zona: zona, aviso: aviso, ir: ir,
    render: function () { render(false); },
    estado: function () { return estado; }
  };
})();
