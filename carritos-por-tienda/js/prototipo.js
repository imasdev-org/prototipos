/*
 * Prototipo «Carritos por tienda»: cada tienda (Super, TiendaFarma, Express: los nombres configurados en producción) tiene
 * su propio carrito, y el cliente tiene que saberlo sin que se le corte la compra.
 * Pantallas reales de demo (pantallas/*.js; estilos e imágenes en sitio/) con lo nuevo de la propuesta: la pastilla
 * con el carrito de cada tienda en la lista de tiendas (mobile), el aviso de las otras tiendas con productos en el
 * carrito lateral y en la página del carrito, y el mismo aviso en el checkout (desktop).
 */
(function () {
  'use strict';
  var P = window.Prototipo, tocable = P.tocable, PANT = window.PANTALLAS;

  // ---------------------------------------------------------------- datos del ejemplo
  // Tiendas del ejemplo, en el orden del aviso de los otros carritos: es también el orden en que se suman con el control
  // «Otras tiendas con productos». Con Super como tienda actual: 1, Express; 2, más TiendaFarma (la última en sumarse).
  // colores: los de cada tienda en la base
  // (ChannelMetadata STYLE; los de Super vienen en las pantallas), que el sitio pone en --accent-color y compañía; Farma no
  // trae accentHoverLight y se usa el mismo patrón (el acento al 30 %). texto: el color de la tienda para texto; en Express,
  // su hover (#C13A32, 5,36:1 sobre blanco), porque su rojo da 4,34:1.
  var TIENDAS = [
    { id: 'supermercado', nombre: 'Super', productos: 4, carrito: '/supermercado/carrito', icono: 'sitio/prod-resize/images/banners/Banner6895_bfe23c4b-1ad2-48ad-b461-b4d7edded819.png',
      colores: { accent: '#004795', hover: '#0056B2', light: '#EDF5FE', hoverLight: '#0047954D', texto: '#004795' } },
    { id: 'express', nombre: 'Express', productos: 3, carrito: '/express/carrito', icono: 'sitio/desa-resize/imagenes/banners/Banner2934_cc7297b2-6b1b-44f2-827f-24f71993b64c.png',
      colores: { accent: '#D9443B', hover: '#C13A32', light: '#FBEAEA', hoverLight: '#D9443B4D', texto: '#C13A32' } },
    { id: 'farmacia', nombre: 'TiendaFarma', productos: 2, carrito: '/farmacia/carrito', icono: 'sitio/desa-resize/imagenes/banners/Banner4207_a608e4ca-c1fb-4a1b-88a1-b63cb0eabb84.png',
      colores: { accent: '#25509E', hover: '#3F6DB7', light: '#d7e4fc', hoverLight: '#25509E4D', texto: '#25509E' } }
  ];
  function porId(id) { return TIENDAS.filter(function (t) { return t.id === id; })[0]; }
  // La tienda actual (control «Tienda actual»). Su carrito es el de demo, con 6 productos, sea cual sea la tienda;
  // «productos» de cada tienda es lo que tiene cuando es una de las otras.
  var EN_CARRITO = 6;
  function actual() { return porId((P.estado() || {}).tienda) || TIENDAS[0]; }
  // Otras tiendas con productos: las demás, en el orden de TIENDAS, tantas como pide el control.
  function otras(estado) { return TIENDAS.filter(function (t) { return t.id !== estado.tienda; }).slice(0, Number(estado.otras)); }
  // Orden de la lista de tiendas en producción: Super, Express, TiendaFarma.
  var ORDEN_LISTA = ['supermercado', 'express', 'farmacia'];
  // Íconos y logos de la cabecera de cada tienda, copiados de static/icons/<tienda> del repo Hanoi: las pantallas son de
  // Super, así que en otra tienda se cambia la carpeta de los que esa tienda tiene.
  var ICONOS = { express: ['ico_cart.svg', 'ico_clear.svg', 'ico_delivery_white.svg', 'ico_home.svg', 'ico_menu.svg', 'ico_search.svg', 'ico_store.svg', 'ico_store_white.svg', 'ico_user.svg', 'ico_whatsapp.svg', 'main_logo.svg', 'main_logo_checkout.svg'], farmacia: ['ico_cart.svg', 'ico_clear.svg', 'ico_delivery_white.svg', 'ico_home.svg', 'ico_menu.svg', 'ico_search.svg', 'ico_store.svg', 'ico_store_white.svg', 'ico_user.svg', 'ico_whatsapp.svg', 'main_logo.svg', 'main_logo_checkout.svg'] };
  // Hoja de estilos de la tienda: en demo, Express carga la suya (TiendaExpress.css, con variables) en lugar de la de Super;
  // TiendaFarma usa la de Super (TiendaInglesaWeb.css), como Super.
  function conTema(cabeza, estado) {
    return estado.tienda === 'express' ? cabeza.replace('Resources/Spanish/TiendaInglesaWeb.css', 'Resources/Spanish/TiendaExpress.css') : cabeza;
  }
  function conIconos(html, estado) {
    var lista = ICONOS[estado.tienda];
    if (!lista) return html;
    return html.replace(/icons\/supermercado\/([A-Za-z0-9_.-]+\.svg)/g, function (m, archivo) { return lista.indexOf(archivo) >= 0 ? 'icons/' + estado.tienda + '/' + archivo : m; });
  }
  function cantidad(n) { return n + (n === 1 ? ' producto' : ' productos'); }
  var hojaAbierta = true; // lista de tiendas que abre el logo (mobile), abierta en el paso «Lista de tiendas»
  // carrito lateral de desktop, abierto en el paso «Carrito lateral»; cerrado, queda la home (desktop no tiene un paso
  // para la home sola)
  var lateralAbierto = true;

  // Una sola cabeza para todas las pantallas (la de la home más las hojas que agregan las otras): pasar de una pantalla
  // a otra no recarga los estilos.
  var CABEZA = (function () {
    var c = PANT.inicio.cabeza;
    [PANT.carrito, PANT.checkout].forEach(function (p) {
      (p.cabeza.match(/<link[^>]*>/g) || []).forEach(function (l) {
        var h = (/href="([^"]+)"/.exec(l) || [])[1];
        if (h && c.indexOf('href="' + h + '"') < 0) c += '\n' + l;
      });
    });
    return c;
  })();

  // ---------------------------------------------------------------- utilidades sobre la pantalla
  function hoja(doc, texto) {
    return Array.prototype.filter.call(doc.querySelectorAll('body *'), function (e) { return !e.children.length && e.textContent.trim() === texto; })[0];
  }
  function fueraDelPrototipo(titulo, texto) { P.aviso(titulo, texto + ' Esa pantalla no forma parte de este prototipo.', [['Cerrar', null]]); }
  // Lo que hacía el JavaScript de la página y lo común a todas las pantallas: datos del ejemplo y cabecera tocable.
  function comun(doc, estado) {
    doc.documentElement.style.setProperty('--vh', doc.defaultView.innerHeight / 100 + 'px');
    var cab = doc.getElementById('SECTIONCART_MPAGE');
    if (cab && !cab.querySelector('.mCartCount')) cab.insertAdjacentHTML('afterbegin', '<span class="mCartCount" id="CARTCOUNT_MPAGE"></span>');
    // colores de la tienda actual: el sitio los pone en :root; acá van en el html del marco, que gana
    var c = actual().colores;
    [['--accent-color', c.accent], ['--accent-hover', c.hover], ['--accent-color-light', c.light], ['--accent-hover-light', c.hoverLight], ['--accent-text', c.texto]].forEach(function (v) {
      doc.documentElement.style.setProperty(v[0], v[1]);
    });
    doc.documentElement.setAttribute('data-tienda', estado.tienda);
    // En demo, las variables de Express (TiendaExpress_Tokens.css) traen valores de TiendaFarma: el azul #25509E en
    // --colors_splittitle («Recibí tu compra en 1 envío» del checkout), --colors_actionhover y las transparencias del
    // acento. En el prototipo van las de Express.
    if (estado.tienda === 'express') {
      // flechas de los carruseles: en demo, Express las trae en su configuración (el resto, las del sitio); con la ruta
      // completa, porque cada hoja que la usa la resolvería desde su propia carpeta
      ['Previous', 'Next'].forEach(function (n) {
        doc.documentElement.style.setProperty('--slick-' + n.slice(0, 4).toLowerCase() + '-icon', 'url("' + new URL('sitio/demo/static/icons/express/' + n + '.svg', document.baseURI).href + '")');
      });
      [['--colors_splittitle', c.texto], ['--colors_actionhover', c.hover], ['--colors_action75', c.accent + 'D1'], ['--colors_action24', c.accent + '3B'], ['--colors_action66', c.accent + '9C']].forEach(function (v) {
        doc.documentElement.style.setProperty(v[0], v[1]);
      });
    }
    Array.prototype.forEach.call(doc.querySelectorAll('.mCartCount'), function (e) { e.textContent = String(EN_CARRITO); });
    // barra de tiendas de desktop (en demo, solo Farma): es el selector, cambia de tienda directo; muestra las otras
    // tiendas, así que la actual no va
    Array.prototype.forEach.call(doc.querySelectorAll('.TableChannelSelectorMain a[href]'), function (a) {
      var t = porId(a.getAttribute('href').slice(1));
      if (!t) return;
      if (t.id === estado.tienda) { a.style.display = 'none'; return; }
      tocable(a, 'Ir a ' + t.nombre, function () { cambioDirecto(t); });
    });
    // cabecera: el carrito abre el lateral (con el lateral ya abierto no hace nada, así que tocarlo muestra la pista),
    // «Pagar» va directo al checkout, el logo de mobile abre y cierra la lista de tiendas (su flecha apunta para arriba
    // con la lista abierta)
    var lateralVisible = estado.paso === 'lateral' && (estado.vista === 'mobile' || lateralAbierto);
    [doc.getElementById('MPW0019W0019TBLCART'), cab].forEach(function (n) { if (n && !lateralVisible) tocable(n, 'Abrir el carrito', function () { lateralAbierto = true; P.ir('paso', 'lateral'); }); });
    var pagar = doc.getElementById('MPW0019W0019BTNCHECKOUT');
    if (pagar) tocable(pagar, 'Pagar', function () { P.ir('paso', 'checkout'); });
    var logo = doc.getElementById('SECTIONLOGO_MPAGE');
    if (logo) tocable(logo, 'Elegir tienda', function () {
      if (P.estado().paso === 'tiendas' && hojaAbierta) cerrarHoja(doc); else { hojaAbierta = true; P.ir('paso', 'tiendas'); }
    });
    var menu = doc.getElementById('vMENUIMG_MPAGE');
    if (menu) tocable(menu, 'Abrir el menú', function () { P.ir('paso', 'menu'); });
  }
  // Cambiar de tienda es directo por cualquier camino, sin confirmación: el carrito de la tienda actual queda guardado y
  // se vuelve con un toque. Desde el selector (la lista del logo, el menú lateral o la barra de desktop), a la home de esa
  // tienda; desde las fichas del aviso de los otros carritos, a su carrito.
  function cambioDirecto(t) { fueraDelPrototipo('Ir a ' + t.nombre, 'Cambia a ' + t.nombre + ' directo, sin confirmación.'); }
  function irAlCarrito(t) {
    fueraDelPrototipo('Carrito de ' + t.nombre, 'Cambia a ' + t.nombre + ' directo, sin confirmación, y abre su carrito' + (t.carrito ? ' (<code>' + t.carrito + '</code>)' : '') + '; el de ' + actual().nombre + ' queda guardado. Ahí, el aviso «Tenés otro carrito en ' + actual().nombre + '» ofrece la vuelta.');
  }
  // Aviso de los otros carritos: «Tenés otro carrito en» con una ficha por tienda que lleva a su carrito. Sin fondo en la
  // página del carrito (debajo de la fila del título en desktop; entre el título y «Vaciar Carrito» en mobile), en el
  // carrito lateral; en el checkout, en un bloque recto con el color claro de la tienda debajo del resumen. Cada ficha
  // lleva el isotipo, el nombre y la pastilla de la lista de tiendas sin el ícono del carrito (la frase ya dice qué es el
  // número). El nombre va en el color de texto del sitio, en seminegrita. El borde toma el tono de la superficie: gris
  // sobre blanco y el tono de la tienda al 30 % sobre su color claro (checkout); nunca el color de la tienda saturado,
  // porque la ficha es de otra tienda.
  function fichas(doc, estado, lugar) {
    var d = doc.createElement('div');
    d.className = 'FichasCarritos' + (lugar ? ' ' + lugar : '');
    // dice «carrito» para que no se lea como parte del carrito actual; plural con más de una tienda
    var lista = otras(estado);
    d.innerHTML = '<span class="FichasRotulo">' + (lista.length === 1 ? 'Tenés otro carrito en' : 'Tenés otros carritos en') + '</span>';
    lista.forEach(function (t) {
      var a = doc.createElement('a');
      a.href = '#';
      a.className = 'Ficha';
      a.setAttribute('aria-label', 'Carrito de ' + t.nombre + ', ' + cantidad(t.productos));
      a.innerHTML = '<img class="FichaIcono" src="' + t.icono + '" alt=""><span class="FichaNombre">' + t.nombre + '</span>' +
        '<span class="FichaPastilla">' + t.productos + '</span>';
      tocable(a, 'Ir al carrito de ' + t.nombre, function () { irAlCarrito(t); });
      d.appendChild(a);
    });
    return d;
  }

  // ---------------------------------------------------------------- pantallas
  // Listas de tiendas (mobile): la que abre el logo y la del menú lateral. Pastilla con el ícono del carrito de cada
  // tienda y la cantidad de productos. Demo no muestra las mismas tiendas en las dos (ni Express con su ícono): se arman
  // con Super, Express y TiendaFarma (el orden de producción).
  function listasDeTiendas(doc, estado) {
    var act = actual(), conProductos = otras(estado);
    var tiendas = ORDEN_LISTA.map(porId);
    var cantidades = {};
    cantidades[act.id] = EN_CARRITO;
    conProductos.forEach(function (t) { cantidades[t.id] = t.productos; });
    Array.prototype.forEach.call(doc.querySelectorAll('.ChannelSelectorMobile .ChannelSelectorList'), function (ul) {
      var enMenu = !!ul.closest('.ChannelSelectorMenu');
      var items = Array.prototype.slice.call(ul.querySelectorAll('.ChannelSelectorItem'));
      var filaActual = items.filter(function (li) { return li.classList.contains('ChannelSelectorItemCurrent'); })[0] || items[0];
      if (!filaActual) return;
      var molde = items.filter(function (li) { return li !== filaActual; })[0] || filaActual;
      var filas = tiendas.map(function (t) {
        var esActual = t.id === act.id, li = esActual ? filaActual : molde.cloneNode(true);
        if (!esActual) li.classList.remove('ChannelSelectorItemCurrent');
        li.querySelector('a').setAttribute('href', '/' + t.id);
        li.querySelector('.ChannelSelectorIcon img').src = t.icono;
        li.querySelector('.ChannelSelectorName').textContent = t.nombre;
        li.setAttribute('data-tienda', t.id);
        var n = cantidades[t.id], b = li.querySelector('.ChannelSelectorBadge'), a = li.querySelector('a');
        b.className = 'ChannelSelectorBadge' + (n ? ' ConCarrito' : '');
        b.innerHTML = n ? '<span class="IcoCarrito ' + t.id + '" aria-hidden="true"></span><span>' + n + '</span>' : '';
        // la etiqueta del enlace reemplaza lo que tiene adentro: lleva también si es la tienda actual y la cantidad
        a.setAttribute('aria-label', t.nombre + (n ? ', ' + cantidad(n) + ' en el carrito' : ''));
        if (esActual) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        if (esActual) tocable(a, t.nombre, function () { if (enMenu) volverAlInicio(); else cerrarHoja(doc); });
        else tocable(a, 'Ir a ' + t.nombre, function () { cambioDirecto(t); });
        return li;
      });
      items.forEach(function (li) { li.remove(); });
      filas.forEach(function (li) { ul.appendChild(li); });
    });
    var cerrar = doc.querySelector('.ChannelSelectorSheet .ChannelSelectorClose');
    if (cerrar) tocable(cerrar, 'Cerrar', function () { cerrarHoja(doc); });
    var fondo = doc.querySelector('.ChannelSheetOverlay');
    if (fondo) tocable(fondo, 'Cerrar', function () { cerrarHoja(doc); });
  }
  function cerrarHoja(doc) { hojaAbierta = false; doc.documentElement.classList.remove('ChannelSheetOpen'); }
  // Cerrar el carrito lateral o el menú, o el logo del checkout: la home. En mobile, con la lista de tiendas cerrada; en
  // desktop, con el carrito lateral cerrado.
  function volverAlInicio() {
    var e = P.estado();
    if (e.vista === 'mobile') { e.paso = 'tiendas'; hojaAbierta = false; } else { e.paso = 'lateral'; lateralAbierto = false; }
    P.render();
  }

  // Menú lateral (mobile) sobre la home: tiene la misma lista de tiendas, con las pastillas.
  function menuLateral(doc, estado) {
    if (estado.vista !== 'mobile') return;
    var destino = doc.querySelector('.gx-call-target.left');
    if (destino) destino.outerHTML = conIconos(PANT.menu.cuerpo, estado);
    var centro = doc.querySelector('.gx-center-target');
    if (centro) centro.classList.add('slideout', 'left');
    // demo da el menú sin sesión: se saca «Ingresar», porque el resto del prototipo es con sesión
    var ingresar = doc.getElementById('MPW9999TBLLOGIN');
    if (ingresar) ingresar.style.display = 'none';
  }

  // Carrito lateral sobre la home: el título dice de qué tienda es y, si hay productos en otras tiendas, el aviso.
  function lateral(doc, estado) {
    var destino = doc.querySelector('.gx-call-target.right');
    if (destino) destino.outerHTML = conIconos(PANT.lateral.cuerpo, estado);
    var centro = doc.querySelector('.gx-center-target');
    if (centro) centro.classList.add('slideout', 'right');
    var lista = doc.getElementById('MPW9997TABLE9');
    if (lista) {
      var cab = doc.createElement('div');
      cab.className = 'CabeceraCarritoTienda';
      cab.innerHTML = '<div class="TituloCarritoTienda">Tu carrito de ' + actual().nombre + '</div>';
      if (otras(estado).length) cab.appendChild(fichas(doc, estado, 'EnLateral'));
      lista.insertBefore(cab, lista.firstChild);
    }
    var ver = doc.getElementById('MPW9997CARTFULL'), pagar = doc.getElementById('MPW9997PAY'), cerrar = doc.getElementById('MPW9997CLOSE');
    if (ver) tocable(ver, 'Ver Carrito Completo', function () { P.ir('paso', 'carrito'); });
    if (pagar) tocable(pagar, 'Pagar', function () { P.ir('paso', 'checkout'); });
    if (cerrar) tocable(cerrar, 'Cerrar el carrito', volverAlInicio);
  }

  // Página del carrito: el título dice de qué tienda es y, debajo, el aviso.
  function paginaCarrito(doc, estado) {
    var t = Array.prototype.filter.call(doc.querySelectorAll('body *'), function (e) { return !e.children.length && /^Carrito \(\d+ productos?\)$/.test(e.textContent.trim()); })[0];
    if (!t) return;
    t.textContent = t.textContent.trim().replace(/^Carrito/, 'Tu carrito de ' + actual().nombre);
    t.id = 'TituloCarritoTienda';
    var fila = t.closest('.FlexMobileWrapCartFull');
    if (fila) {
      fila.classList.add('FilaTituloCarrito');
      Array.prototype.forEach.call(fila.children, function (c) { if (c.contains(t) || c.querySelector('[value="Vaciar Carrito"]')) c.classList.add('CeldaFija'); });
    }
    var row = t;
    while (row && !row.querySelector('[value="Vaciar Carrito"]')) row = row.parentElement;
    row = (row && row.closest('.row')) || row;
    if (row && otras(estado).length) {
      // en desktop, debajo de la fila del título; en mobile «Vaciar Carrito» queda debajo del título, así que el aviso va
      // entre los dos, pegado al título (es su subtítulo)
      if (estado.vista === 'mobile') t.parentNode.insertBefore(fichas(doc, estado, 'EnTituloMobile'), t.nextSibling);
      else row.parentElement.insertBefore(fichas(doc, estado), row.nextSibling);
    }
    var pagar = doc.getElementById('W0006W0234BTNSTARTCHECKOUT');
    if (pagar) tocable(pagar, 'Proceder al Pago', function () { P.ir('paso', 'checkout'); });
  }

  // Checkout: el aviso va debajo del resumen del pedido.
  function checkout(doc, estado) {
    var logo = doc.getElementById('vTIENDALOGO_MPAGE');
    if (logo) tocable(logo, 'Volver al inicio', volverAlInicio);
    if (!otras(estado).length) return;
    var caja = hoja(doc, 'SubTotal');
    while (caja && !caja.querySelector('[value="Aplica tus cupones"]') && !/Aplica tus cupones/.test(caja.textContent)) caja = caja.parentElement;
    if (caja) caja.parentElement.insertBefore(fichas(doc, estado, 'EnCheckout ConFondo'), caja.nextSibling);
  }

  function pantalla(estado) {
    var mobile = estado.vista === 'mobile', paso = estado.paso;
    // la home (lista de tiendas, menú y carrito lateral) se capturó en desktop y en un teléfono: su JavaScript la arma
    // distinto según el ancho al cargar
    var base = paso === 'carrito' ? PANT.carrito : paso === 'checkout' ? PANT.checkout : mobile ? PANT.inicioMovil : PANT.inicio;
    return {
      cabeza: conTema(conIconos(CABEZA, estado), estado),
      html: conIconos(base.cuerpo, estado),
      claseHtml: base.claseHtml + (estado.paso === 'tiendas' && mobile && hojaAbierta ? ' ChannelSheetOpen' : ''),
      claseCuerpo: base.claseCuerpo,
      despues: function (doc) {
        comun(doc, estado);
        if (paso === 'menu') menuLateral(doc, estado);
        if (paso === 'tiendas' || paso === 'menu') listasDeTiendas(doc, estado);
        if (paso === 'lateral' && (mobile || lateralAbierto)) lateral(doc, estado);
        if (paso === 'carrito') paginaCarrito(doc, estado);
        if (paso === 'checkout') checkout(doc, estado);
        // El ícono del pie de las listas de tiendas es una máscara: lo pone css/prototipo.css, embebido. Con el archivo
        // que trae el HTML, la primera vista (antes de que cargue esa hoja) lo pediría y abierto en local eso falla.
        Array.prototype.forEach.call(doc.querySelectorAll('.ChannelSelectorFootIcon'), function (e) { e.style.removeProperty('--ch-foot-icon'); });
        // demo dice «Buscar en TRUNK DEMO» en algunos buscadores; al final, para alcanzar también al menú lateral
        Array.prototype.forEach.call(doc.querySelectorAll('input[placeholder]'), function (i) { if (/buscar/i.test(i.placeholder)) i.placeholder = 'Buscar en Tienda Inglesa'; });
      }
    };
  }

  // ---------------------------------------------------------------- notas del aviso de los otros carritos
  var TEXTO_AVISO = '«Tenés otro carrito en» con una sola tienda y «Tenés otros carritos en» con dos o más (<b>manejar el plural</b>: depende de cuántas otras tiendas tienen productos). Dice «carrito» para que no se lea como parte del carrito actual; Open Sans 14 px, <code>#333</code>. La frase es un elemento más de la grilla, antes de las fichas: lo que no entra pasa al renglón siguiente; 8 px entre elementos y entre renglones.';
  // Notas de la ficha. enMobile: si los pines van también en mobile; sobreColor: en el checkout, sobre el color claro.
  function notasFicha(enMobile, sobreColor) {
    function pin(s, t) { return { d: s, m: enMobile ? s : null, t: t }; }
    var lleva = 'Lleva al carrito de esa tienda (<code>/farmacia/carrito</code>, <code>/express/carrito</code>; <i>a confirmar:</i> que con sesión abra el carrito de esa tienda), <b>directo, sin confirmación</b>: el cliente acaba de elegir ir a ese carrito, no pierde nada (el de la tienda actual queda guardado) y en el carrito de destino el aviso le ofrece la vuelta. Ningún camino a otra tienda pide confirmación (ni el selector, ni las fichas, ni banners o enlaces). Etiqueta para lectores de pantalla: «Carrito de TiendaFarma, 2 productos» (singular: «1 producto»). Con el teclado, contorno de 2 px del color de la tienda a 2 px de la ficha.';
    var borde = 'borde 1 px: <b>toma el tono de la superficie donde está la ficha</b>. Sobre blanco (la página del carrito y el carrito lateral), gris <code>#BFBFBF</code> (<code>--colors_line</code>, 1,84:1). Sobre el color claro de la tienda (checkout), el color de la tienda al 30 % (<code>--accent-hover-light</code>: <code>#0047954D</code> en Super, <code>#D9443B4D</code> en Express; TiendaFarma no lo tiene en su configuración y va <code>#25509E4D</code>): un gris sobre una superficie de color quedaba ajeno. No es el color de la tienda saturado: no mezcla la tienda actual con la ficha de otra. Alcanza con que se vea: la ficha se reconoce por el relleno blanco, el nombre y el isotipo. Al pasar el mouse, el mismo tono más intenso: sobre blanco, <code>#5F6062</code> (<code>--colors_darkgrey_header</code>); sobre el color claro, el color de hover de la tienda (<code>--accent-hover</code>: <code>#0056B2</code> en Super, <code>#C13A32</code> en Express, <code>#3F6DB7</code> en TiendaFarma).' + (sobreColor ? ' <b>Acá, sobre el color claro: el tono de la tienda al 30 %.</b>' : ' <b>Acá, sobre blanco: gris.</b>');
    return [
      pin('.Ficha', '<b>Ficha.</b> Radio 999, padding 3/4/3/3; isotipo de 24 px en círculo (padding 2), nombre y pastilla, separados 6 px. <b>El nombre va en el color de texto del sitio</b> (<code>#333</code>, 12,6:1 sobre blanco), no en el de la tienda: la ficha es de otra tienda, y con el color de la tienda actual quedaría, por ejemplo, «Super» en el rojo de Express; su isotipo ya la identifica. Nombre en <b>seminegrita</b>: la familia «Open Sans Semibold» (600). No alcanza con <code>font-weight: 600</code> sobre «Open Sans»: en el sitio esa familia solo trae el 400 y el navegador simularía la negrita. Fondo blanco, ' + borde + ' ' + lleva),
      pin('.Ficha .FichaPastilla', 'Pastilla con la cantidad de productos distintos del carrito de esa tienda: la de la lista de tiendas <b>sin el ícono del carrito</b>, porque la frase ya dice que es otro carrito: el número es su cantidad de productos, como el contador del carrito de la cabecera. Blanco sobre <code>#008a08</code>, 10 px, 700, padding 4/8, radio 999 (con un dígito mide 22 × 18 px). En la lista de tiendas la pastilla sí lleva el ícono: ahí no hay frase que explique el número.')
    ];
  }
  var NOTA_TITULO_LATERAL = { d: '.TituloCarritoTienda', m: '.TituloCarritoTienda', t: '<b>Título nuevo:</b> «Tu carrito de &lt;tienda actual&gt;», Open Sans 18 px, 400, <code>#333</code>, interlineado 143 %, arriba de la lista de productos.' };
  var NOTA_VACIO_LATERAL = { d: '#MPW9997TXTTOTAL', m: '#MPW9997TXTTOTAL', t: 'Hoy el ícono del carrito abre el lateral solo si el total o la cantidad son mayores que 0. <i>A definir:</i> con el carrito actual vacío y productos en otra tienda, abrirlo vacío con el aviso.' };
  var NOTA_CHECKOUT_MOBILE = { d: null, m: '#vTIENDALOGO_MPAGE', t: 'En mobile el checkout no lleva aviso: el resumen está oculto, y como la cabecera mobile no tiene «Pagar», al checkout se llega desde el carrito, que ya lo muestra.' };
  // Cabecera desktop: en desktop no hay lista de tiendas ni menú lateral, así que estas notas van con la página del
  // carrito, donde la cabecera se ve entera.
  var NOTAS_CABECERA_DESKTOP = [
    { d: ['a[aria-label="Farma"][data-tooltip]', 140, 17], m: null, t: '<b>En desktop el selector de tiendas no cambia</b> (sin pastillas). Al tocar otra tienda cambia directo, sin confirmación, como cualquier camino a otra tienda. El aviso de los otros carritos va en el carrito (lateral y página) y en el checkout.' },
    { d: '#MPW0019W0019CARTCOUNT', m: null, t: 'El contador de la cabecera cuenta <b>productos distintos</b>, no unidades: es el mismo número del título del carrito y el que se usa en las pastillas y los avisos.' },
    { d: '#MPW0019W0019BTNCHECKOUT', m: null, t: '«Pagar» de la cabecera lleva directo al checkout, sin pasar por el carrito: por eso el aviso también va en el checkout. En mobile la cabecera no tiene «Pagar».' }
  ];
  function notasLateral() { return [
    NOTA_TITULO_LATERAL,
    { d: '.FichasRotulo', m: '.FichasRotulo', t: '<b>Fichas debajo del título, sin fondo</b>, como en la página del carrito. ' + TEXTO_AVISO + ' Sin fondo, la cercanía es lo que las agrupa: 6 px debajo del título (así se leen como su subtítulo), alineadas con él (5 px a cada lado), y 20 px antes del primer grupo de productos. Con una tienda entran en una línea, en desktop y en mobile. Se desplazan con la lista. Si ninguna otra tienda tiene productos, no aparecen.' }
  ].concat(notasFicha(true, false), [NOTA_VACIO_LATERAL]); }
  function notasCheckout() { return [
    { d: '.FichasRotulo', m: null, t: '<b>Fichas debajo del resumen del pedido, solo en desktop</b> (en mobile el resumen no se ve), <b>en un bloque recto con el color claro de la tienda</b> (<code>--accent-color-light</code>: <code>#EDF5FE</code> en Super, <code>#FBEAEA</code> en Express, <code>#D7E4FC</code> en TiendaFarma), sin borde ni radio, al ancho del resumen y <b>16 px debajo</b>; padding 14/21, así el texto queda alineado con «SubTotal». Acá el aviso no acompaña a ningún título y es la última vez que se ve antes de pagar: quien llega con «Pagar» de la cabecera no pasa por el carrito. Por eso lleva color, a diferencia del carrito, donde va sin fondo. Las esquinas rectas lo emparentan con el recuadro del resumen y lo distinguen de «Aplica tus cupones» (radio 10, el mismo color claro), que es un botón; y queda fuera del recuadro del resumen, para que no se lea como parte de esta compra ni de su total. ' + TEXTO_AVISO +
      ' En la columna angosta, con un nombre largo la ficha pasa al renglón siguiente. Si ninguna otra tienda tiene productos, no aparecen. El mismo texto que en el carrito, sin una línea extra: «otro carrito» ya dice que no es parte de esta compra, y el resumen de arriba muestra solo sus totales (<i>a confirmar con usuarios</i>).' }
  ].concat(notasFicha(false, true), [NOTA_CHECKOUT_MOBILE]); }

  // ---------------------------------------------------------------- dónde hace algo cada control
  // La barra muestra cada control y cada opción solo donde cambia algo de la pantalla (mostrar). Sin otras tiendas con
  // productos no hay aviso, y el checkout en mobile no lo lleva.
  // la lista de tiendas y el menú lateral son solo de mobile
  function enMobile(e) { return e.vista === 'mobile'; }

  // ---------------------------------------------------------------- configuración
  P.iniciar({
    titulo: 'Carritos por tienda',
    clave: 'carritos-por-tienda',
    vistaInicial: 'desktop',
    desktop: { anchoContenido: 1200 },
    mobile: { ancho: 390 },
    estilos: ['css/prototipo.css'],
    controles: [
      { id: 'paso', nombre: 'Paso', reiniciaScroll: true, alCambiar: function (v) { if (v === 'tiendas') hojaAbierta = true; if (v === 'lateral') lateralAbierto = true; },
        opciones: [['tiendas', 'Lista de tiendas', enMobile], ['menu', 'Menú lateral', enMobile], ['lateral', 'Carrito lateral'], ['carrito', 'Página del carrito'],
          ['checkout', 'Checkout']] },
      // la tienda en la que está el cliente: cambian el título, las otras tiendas, los colores y los logos
      { id: 'tienda', nombre: 'Tienda actual', inicial: 'supermercado', reiniciaScroll: true,
        opciones: [['supermercado', 'Super'], ['express', 'Express'], ['farmacia', 'TiendaFarma']] },
      // en desktop la lista de tiendas y el menú no cambian; en mobile, el checkout no lleva aviso
      { id: 'otras', nombre: 'Otras tiendas con productos', inicial: '1',
        mostrar: function (e) { var p = e.paso; return e.vista === 'mobile' ? p !== 'checkout' : p !== 'tiendas' && p !== 'menu'; },
        opciones: [['0', '0'], ['1', '1'], ['2', '2']] }
    ],
    pantalla: pantalla,
    // Notas para desarrollo, por paso. d / m: el elemento donde va el pin en desktop / mobile (selector CSS o
    // [selector, dx, dy]); null = no va en esa vista.
    notas: {
      tiendas: [
        { d: null, m: '#CARTCOUNT_MPAGE', t: 'El contador de la cabecera cuenta <b>productos distintos</b>, no unidades: es el mismo número del título del carrito y el que se usa en las pastillas y los avisos.' },
        { d: null, m: '.ChannelSelectorSheet .ChannelSelectorItemCurrent .ChannelSelectorBadge', t: '<b>Pastilla en cada tienda cuyo carrito tiene productos</b> (también en la tienda actual): el ícono del carrito de esa tienda y la cantidad de productos distintos. Sin productos, no hay pastilla. Va al final de la fila: ninguna fila lleva flecha ni ✓ al final, así que todas las pastillas quedan en columna.' },
        { d: null, m: ['.ChannelSelectorSheet .ChannelSelectorItemCurrent .ChannelSelectorIcon', 40, 40], t: '<b>Tienda actual, sin la palabra «Actual», marcada igual que en el menú lateral:</b> el ✓ sobre el ícono (círculo de 18 px en el color de la tienda, con borde blanco de 2 px y el tilde blanco, en la esquina inferior derecha del ícono, 6 px hacia afuera), el nombre en negrita y el borde de 2 px del ícono en el color de la tienda (estos dos ya están hoy). <b>Sin fondo</b>, como en el menú: el color claro de la tienda casi no se distingue del blanco (1,10:1 en Super, 1,16:1 en Express, 1,28:1 en TiendaFarma) y estas tres señales ya marcan la tienda actual; además, la lista se abre para cambiar de tienda, y el fondo resaltaría justo la fila que no se va a tocar. <b>Ninguna fila lleva flecha</b> (hoy el sitio la muestra en las otras tiendas): es una lista para elegir, no para entrar a otro nivel, y así es igual al menú, donde la flecha despliega subopciones. Se saca el lugar del estado (<code>.ChannelSelectorState { display: none }</code>, en las dos listas): ni flecha ni ✓ al final. Para lectores de pantalla, <code>aria-current=&quot;true&quot;</code> (el lector anuncia «actual») y la etiqueta del enlace con el nombre y la cantidad, por ejemplo «Super, 6 productos en el carrito»: hoy la etiqueta es solo el nombre y tapa lo que hay adentro. Ningún texto nombra a las tiendas como tales («tienda», «mundo»): solo por su nombre.' },
        { d: null, m: ['.ChannelSelectorSheet .ChannelSelectorItem:not(.ChannelSelectorItemCurrent) .ChannelSelectorBadge.ConCarrito', 0, 0], t: 'El ícono es el del carrito de cada tienda, el mismo de su cabecera (<code>/static/icons/&lt;tienda&gt;/ico_cart.svg</code>), en blanco: Super carrito, TiendaFarma bolsa con cruz, Express canasta.' },
        { d: null, m: ['.ChannelSelectorSheet .ChannelSelectorItem:not(.ChannelSelectorItemCurrent) .ChannelSelectorBadge.ConCarrito', 40, 24], t: 'Pastilla: fondo <code>#008a08</code> (fuera de la paleta: es el verde del contador de la cabecera, <code>#00a80a</code>, oscurecido hasta llegar a AA, 4,53:1 con el blanco). Ícono de 16 px y 5 px de separación; el resto, como la pastilla del sitio: 10 px, 700, padding 4/8, radio 999.' },
        { d: null, m: ['.ChannelSelectorSheet .ChannelSelectorList', 14, 0], t: 'Los datos ya existen: la lista de tiendas tiene un campo para la pastilla (<code>ChannelBadge</code>) que hoy no se carga, y <code>LoadChannelCarts</code> devuelve la cantidad de productos y el total del carrito de cada otra tienda (hoy la web no lo usa).' },
        { d: null, m: ['.ChannelSelectorSheet [data-tienda="express"]', 14, 0], t: '<b>Al tocar otra tienda, cambia directo</b>, sin confirmación, como cualquier camino a otra tienda. En demo esta lista muestra solo Super y Farma: se armó con Super, Express y TiendaFarma (los nombres y el orden de producción).' }
      ],
      menu: [
        { d: null, m: '.ChannelSelectorMenu .ChannelSelectorItemCurrent .ChannelSelectorBadge', t: '<b>El menú lateral tiene la misma lista de tiendas</b> que la que abre el logo: van las mismas pastillas, con la misma regla.' },
        { d: null, m: ['.ChannelSelectorMenu .ChannelSelectorItemCurrent .ChannelSelectorIcon', 40, 40], t: '<b>Tienda actual en el menú, igual que en la lista del logo:</b> el ✓ sobre el ícono (círculo de 18 px en el color de la tienda, con borde blanco de 2 px y el tilde blanco, en la esquina inferior derecha del ícono, 6 px hacia afuera), el nombre en negrita y el borde del ícono. Sin fondo, como en la lista del logo (sobre el gris del menú, el color claro da 1,01:1 y no se distinguiría). Las tiendas no llevan flecha: en el menú la flecha significa desplegar subopciones (por ejemplo, «Ocasiones» abre Asado, Mi Bebé, Picada y Tea Time), no ir a otra pantalla.' },
        { d: null, m: ['.ChannelSelectorMenu .ChannelSelectorItem:not(.ChannelSelectorItemCurrent) .ChannelSelectorBadge.ConCarrito', 0, 0], t: 'Hoy el CSS del sitio oculta la pastilla en el menú (<code>.ChannelSelectorMenu .ChannelSelectorBadge { display: none }</code>, en <code>hanoi.min.css</code>): hay que mostrarla.' },
        { d: null, m: ['.ChannelSelectorMenu .ChannelSelectorItem:not(.ChannelSelectorItemCurrent) .ChannelSelectorBadge.ConCarrito', 40, 24], t: 'En el menú las otras tiendas no llevan flecha (el sitio la oculta), pero su lugar quedaba y con él la separación de 15 px a la derecha de la pastilla. Hay que sacar ese lugar (<code>.ChannelSelectorState { display: none }</code>, igual que en la lista del logo): así todas las pastillas terminan en el mismo lugar, al final de la fila.' },
        { d: null, m: ['.ChannelSelectorMenu [data-tienda="express"]', 14, 0], t: 'Al tocar otra tienda, cambia directo, sin confirmación, como en la lista del logo. En demo el menú muestra Super y Express (con un ícono de prueba): se armó con Super, Express y TiendaFarma (los nombres y el orden de producción).' }
      ],
      get lateral() { return notasLateral(); },
      // página del carrito: en desktop el aviso va debajo de la fila del título; en mobile, entre el título y «Vaciar Carrito»
      get carrito() { return [
        { d: '#TituloCarritoTienda', m: null, t: '<b>Título:</b> «Tu carrito de &lt;tienda actual&gt; (N productos)». La celda vacía del medio de esta fila trae <code>min-width: 50%</code> en línea: con el título nuevo, a 1024 px de ancho «Vaciar Carrito» se sale de la columna y queda encima de la del resumen (48 px con «Super», 63 con «Express» y 108 con «TiendaFarma»); a 1280 y 1440 entra. Hay que sacarle ese mínimo para que el botón quede alineado al borde derecho.' },
        { d: null, m: '#TituloCarritoTienda', t: '<b>Título:</b> «Tu carrito de &lt;tienda actual&gt; (N productos)».' },
        { d: '.FichasRotulo', m: null, t: '<b>Debajo de la fila del título, sin fondo:</b> ' + TEXTO_AVISO + ' Margen de 12 px arriba y 20 px abajo. Con 3 tiendas entran en una línea de 992 px de ancho para arriba.' },
        { d: null, m: '.FichasRotulo', t: '<b>En mobile, entre el título y «Vaciar Carrito»</b> (que en mobile va debajo del título), sin fondo: 6 px debajo del título, así se leen como su subtítulo, y 12 px antes de «Vaciar Carrito». ' + TEXTO_AVISO + ' Con una tienda entran en una línea (medido a 360 y 390 px de ancho); con dos o más, las fichas pasan al renglón siguiente.' }
      ].concat(notasFicha(true, false), [
        { d: null, m: '#W0006W0234MAINTABLE', t: 'Este resumen es el mismo componente que el del checkout: el aviso del checkout va solo en el checkout; si no, en esta página aparecería dos veces.' }
      ], NOTAS_CABECERA_DESKTOP); },
      get checkout() { return notasCheckout(); }
    }
  });
})();
