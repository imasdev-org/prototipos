/*
 * Suscripciones, sobre las pantallas REALES de «Mis datos» de trunk (pantallas/*.js, generadas por
 * Suscripciones, sobre las pantallas REALES de «Mis datos» de trunk (pantallas/*.js, generadas por
 * herramientas/capturar-trunk.mjs con estilos e imágenes del sitio en sitio/): una sola pestaña con una lista de lo que
 * el cliente tiene activo (Programa Puntos, membresías y apps conectadas). Las fechas, las bases, los datos cedidos y las
 * salidas están en el detalle de cada servicio. «Borrar mi cuenta» pasa a Información personal y «Preferencias» desaparece.
 * Lo existente se reutiliza con sus clases del sitio; lo nuevo está en css/prototipo.css. Datos de ejemplo inventados.
 */
(function () {
  'use strict';
  var P = window.Prototipo, tocable = P.tocable, PANT = window.PANTALLAS;

  // ---------------------------------------------------------------- datos de ejemplo
  var PUNTOS = { desde: '12/03/2021', documento: '1.234.567-8', saldo: 60, valor: 10 }; // saldo: el de la cabecera del sitio; valor: lo que vale un punto en pesos
  var DESDE = ['05/05/2022', '18/06/2026']; // membresías: en el orden en que las muestra el sitio
  // datos que el cliente le cedió a cada app (según sus permisos): van en el detalle de la app
  var DATOS_CEDIDOS = { margarita: [['Nombre', 'Ana Pérez'], ['Email', 'ana.perez@ejemplo.com']], penca: [['Nombre', 'Ana Pérez'], ['Email', 'ana.perez@ejemplo.com']] };
  var BENEFICIO = '10% de descuento en tus compras'; // SummaryMsg de la membresía (texto de ejemplo, dentro de los 36 caracteres que muestra el resumen de la app)
  var MEMB = 'Socio Acelu'; // nombre de la membresía activa
  var APPS = [
    { id: 'margarita', nombre: 'Margarita', logo: 'sitio/app/margarita.png', conectada: '21/10/2026', ultimo: 'Hace 2 días',
      numeros: [['WhatsApp +598\u00a099\u00a0000\u00a0111', '21/10/2026'], ['WhatsApp +598\u00a098\u00a0000\u00a0222', '28/10/2026']] },
    { id: 'penca', nombre: 'Penca Tienda Inglesa', conectada: '02/09/2026', ultimo: 'Hace 3 semanas', numeros: [] }
  ];

  // Imágenes de los estados vacíos: siluetas claras del objeto, en el gris del cupón vacío del sitio (#DCDCDC,
  // img_cupones_empty). La estrella es shared/fontawesome-free-5.1.1-web/svgs/solid/star.svg, que ya está en los estáticos del
  // sitio (Font Awesome Free, CC BY 4.0) y tiene casi la forma del ícono de membresías de la app; el eslabón es nuevo.
  var GLIFO_ESTRELLA = '<svg class="SusGlifo" viewBox="0 0 576 512" aria-hidden="true"><path fill="#DCDCDC" d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"/></svg>';

  // ---------------------------------------------------------------- utilidades
  function ir(paso) { return function () { P.ir('paso', paso); }; }
  // Las confirmaciones no son pasos de la barra: se abren tocando la acción y se cierran desde el propio diálogo.
  var dlg = null, ultimoPaso = null;
  // resultado de lo que el cliente confirmó; se reinicia al cambiar un control de la barra
  var hecho = {}, ultimaClave = null, HOY = '09/11/2026';
  // servicio abierto en el detalle (null = la lista); no es un paso de la barra: se entra tocando la fila
  var detalle = null;
  // La barra se pinta antes que la pantalla: con el estado nuevo se calcula si el detalle o el popup abiertos siguen en pie.
  function claveDe(e) { return [e.vista, e.plataforma, e.paso, e.puntos, e.membresias, e.apps, e.alta].join('|'); }
  function popupAbierto(e) { return !!dlg && e.paso === ultimoPaso; } // al cambiar de paso se cierra
  function detalleAbierto(e) { return !!detalle && claveDe(e) === ultimaClave; } // otra combinación vuelve a la lista
  // Puntos, Membresías y Apps arman la lista: en un detalle o con un popup encima, alternarlos no cambia lo que se ve.
  function enLista(e) { return e.paso === 'suscripciones' && !detalleAbierto(e) && !popupAbierto(e); }
  function abrir(nombre) { return function () { dlg = nombre; P.render(); }; }
  // hojaActiva: la función que hace salir el sheet abierto (null si lo abierto es un popup o una alerta)
  var hojaActiva = null, ultimoDlg = null;
  function cerrar() {
    function fin() { dlg = null; P.render(); }
    if (hojaActiva) hojaActiva(fin); else fin();
  }
  function animarEntrada() { var nuevoDlg = dlg !== ultimoDlg; ultimoDlg = dlg; return nuevoDlg; } // redibujar no repite la entrada
  // Sheet real: sube desde abajo, el fondo se oscurece, baja al cerrar, se cierra tocando afuera o arrastrando hacia abajo.
  function armarHoja(doc, velo, hoja, alCerrar, animar) {
    var saliendo = false, ini = null; // el prototipo anima siempre, aunque el sistema tenga el movimiento reducido: es lo que se está mostrando
    var fondo = nuevo(doc, 'div', { class: 'SusVeloToque' });
    velo.insertBefore(fondo, velo.firstChild);
    tocable(fondo, 'Cerrar', function () { alCerrar(); });
    var agarre = nuevo(doc, 'div', { class: 'SusAgarre interactivo', 'aria-hidden': 'true' });
    hoja.insertBefore(agarre, hoja.firstChild);
    velo.classList.add('SusHoja'); hoja.classList.add('SusHojaPanel');
    if (animar) velo.classList.add('SusHojaEntra');
    function salir(fin) {
      if (saliendo) return;
      saliendo = true; velo.classList.remove('SusHojaEntra');
      hoja.style.transition = 'transform .24s cubic-bezier(.4,0,1,1)'; hoja.style.transform = 'translateY(100%)';
      fondo.style.transition = 'opacity .24s ease'; fondo.style.opacity = '0';
      setTimeout(fin, 240);
    }
    agarre.addEventListener('pointerdown', function (e) {
      e.stopPropagation(); // no es el desplazamiento simulado del núcleo
      ini = { y: e.clientY, t: e.timeStamp, dy: 0 };
      agarre.setPointerCapture(e.pointerId);
      velo.classList.remove('SusHojaEntra'); hoja.style.transition = 'none'; fondo.style.transition = 'none';
    });
    agarre.addEventListener('pointermove', function (e) {
      if (!ini) return;
      ini.dy = Math.max(0, e.clientY - ini.y);
      hoja.style.transform = 'translateY(' + ini.dy + 'px)';
      fondo.style.opacity = String(Math.max(0, 1 - ini.dy / hoja.offsetHeight));
    });
    function soltar(e) {
      if (!ini) return;
      var dy = ini.dy, rapido = dy / Math.max(1, e.timeStamp - ini.t) > .6; ini = null;
      if (dy > hoja.offsetHeight * .3 || (rapido && dy > 24)) { alCerrar(); return; }
      hoja.style.transition = 'transform .3s cubic-bezier(.32,.72,0,1)'; fondo.style.transition = 'opacity .3s ease';
      hoja.style.transform = ''; fondo.style.opacity = '';
    }
    agarre.addEventListener('pointerup', soltar);
    agarre.addEventListener('pointercancel', soltar);
    return salir;
  }
  function nuevo(doc, tag, attrs, html) {
    var n = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === 'class') n.className = attrs[k]; else n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }
  function q(raiz, sel) { return raiz.querySelector(sel); }
  function aviso(titulo, texto) { return function () { P.aviso(titulo, texto, [['Cerrar', null]]); }; }

  // ---------------------------------------------------------------- común: pestañas
  function pestanas(doc, activa) {
    var pref = doc.getElementById('TBLPREFERENCES');
    if (pref) pref.closest('.wTab').style.display = 'none';
    var grupos = doc.getElementById('TXTMYGROUPS');
    if (grupos) grupos.textContent = 'Suscripciones';
    var datos = doc.getElementById('TXTPERSONALDATA');
    if (datos) datos.className = activa === 'datos' ? 'wTxtTabActiveMedium' : 'wTxtTabInactiveMedium';
    if (grupos) grupos.className = activa === 'suscripciones' ? 'wTxtTabActiveMedium' : 'wTxtTabInactiveMedium';
    if (activa !== 'datos') tocable(doc.getElementById('TBLPERSONALDATA'), 'Información personal', ir('mis-datos'));
    if (activa !== 'suscripciones' || detalle) tocable(doc.getElementById('TBLMYGROUPS'), 'Suscripciones', detalle ? verFicha(null) : ir('suscripciones'));
    var pop = doc.getElementById('TBLPOPUP'); if (pop) pop.style.display = 'none';
  }
  // Íconos que el sitio pasa como variable CSS en un style en línea: la hoja que los usa resolvería la ruta relativa
  // desde su propia carpeta. Con la ruta completa cargan desde cualquier hoja (se cambia antes de dibujar la pantalla).
  function rutasCompletas(html) {
    return html.replace(/url\((&quot;|["']?)(sitio\/[^)"'&]+)(&quot;|["']?)\)/g, function (m, a, ruta) {
      return 'url(&quot;' + new URL(ruta, document.baseURI).href + '&quot;)';
    });
  }

  // ---------------------------------------------------------------- Suscripciones: lista y detalle
  var CHEV_WEB = '<svg class="SusChev" viewBox="0 0 10 18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M1.5 1.5l7 7.5-7 7.5"/></svg>';
  var VOLVER_WEB = '<svg viewBox="0 0 10 18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M8.5 1.5L1.5 9l7 7.5"/></svg>';
  // Ícono de cada servicio: solo las apps conectadas, que tienen identidad propia (y reconocer el logo ayuda a detectar una app que no conectaste).
  // Programas y membresías van sin ícono: la sección ya dice el tipo y un ícono igual en cada fila no distingue nada.
  // Cada app, su logo (ExtAppLogoUrl) contenido en un recuadro igual para todas; una app sin logo, su inicial en el mismo recuadro.
  function iconoServicio(tipo, a) {
    if (!a) return ''; // Puntos y membresías
    if (a.logo) return '<span class="SusLogo" aria-hidden="true"><img src="' + a.logo + '" alt=""></span>'; // ExtAppLogoUrl
    return '<span class="SusLogo" aria-hidden="true">' + a.nombre.charAt(0) + '</span>'; // app sin logo
  }
  // cada dato queda entero en su línea: si no entra, baja completo
  function partes(a, b) { return '<span class="SusParte">' + a + '</span>' + (b ? '<span class="SusSep"> · </span><span class="SusParte">' + b + '</span>' : ''); }
  function resumenApp(a) {
    return 'Último acceso ' + a.ultimo.toLowerCase(); // una sola línea: los dispositivos están en el detalle
  }
  function verFicha(id) { return function () { detalle = id; P.ir('_ficha', id || ''); }; } // irArriba: el detalle arranca desde el principio

  // Contenido del detalle, igual en web y app; cl = clase de los enlaces de cada plataforma
  function tituloSeccion(b) { return '<span class="SusFichaTit"><span>' + b.titulo + '</span></span>'; } // sin ícono: el título ya agrupa la sección
  function saldoPuntos() { return hecho.desde ? 0 : PUNTOS.saldo; } // recién adherido: todavía sin puntos
  function fichaDe(cl, enApp) {
    function lnk(id, texto) { return '<button type="button" class="' + cl + '" id="' + id + '">' + texto + '</button>'; }
    function enlaces() { return { enlaces: [].slice.call(arguments) }; } // al final, sin título: las acciones, juntas y alineadas con los rótulos
    if (detalle === 'puntos') return { id: 'ficha-puntos', titulo: 'Programa Puntos', tipo: 'Programa de puntos', soloBarra: true, icono: iconoServicio('puntos'), salida: 'Salir del programa', idSalida: 'salir-puntos', bloques: [
      { titulo: 'Tus puntos', filas: [['Saldo', saldoPuntos() + ' puntos'], ['Equivalen a', '$' + (saldoPuntos() * PUNTOS.valor).toLocaleString('es-UY')]] }, // lo que se pierde al salir: va antes de la salida
      { titulo: 'Tu adhesión', filas: [['Adherido desde', hecho.desde || PUNTOS.desde], ['Documento', PUNTOS.documento]] },
      enlaces(lnk('ver-bases', 'Ver bases y condiciones'))] };
    if (detalle === 'membresia') return { id: 'ficha-membresia', titulo: MEMB, tipo: 'Membresía', icono: iconoServicio('activa'), salida: 'Cancelar membresía', idSalida: 'cancelar-membresia', bloques: [
      { titulo: 'Tu membresía', filas: [['Beneficio', BENEFICIO, 'largo'], ['Miembro desde', DESDE[0]]] }, // el beneficio, primero: es lo que se pierde al cancelar
      enlaces(lnk('ver-bases-membresia-1', 'Ver bases y condiciones'))] };
    var a = APPS.filter(function (x) { return x.id === detalle; })[0], nums = numerosDe(a), b = [
      { id: 'conexion-' + a.id, titulo: 'Conexión a la aplicación', filas: [['Conectada el', a.conectada], ['Último acceso', '<span id="ultimo-' + a.id + '">' + a.ultimo + '</span>']] }];
    if (nums.length) b.push({ id: 'numeros-' + a.id, titulo: 'Dispositivos vinculados (' + nums.length + ')', numeros: nums });
    b.push({ id: 'datos-' + a.id, titulo: 'Datos que le cediste', filas: DATOS_CEDIDOS[a.id] }); // información, no acción: a la vista, como el resto
    b.push(enlaces(lnk('ver-bases-' + a.id, 'Ver bases y condiciones')));
    return { id: 'ficha-' + a.id, titulo: a.nombre, tipo: 'Aplicación conectada', icono: iconoServicio('app', a), salida: 'Desconectar', idSalida: 'desconectar-' + a.id, bloques: b };
  }
  // K: las clases propias de cada plataforma (el resto de la ficha es igual en web y app)
  function fichaHtml(f, K) {
    function bloque(b) {
      if (b.numeros) return '<div class="SusFichaBloque" id="' + b.id + '">' + tituloSeccion(b) +
        b.numeros.map(function (x, i) { return '<div class="' + K.fila + '"><span>' + x[0] + '<small>Vinculado el ' + x[1] + '</small></span><button type="button" class="' + K.accion + '" id="desvincular-' + (i + 1) + '">Desvincular</button></div>'; }).join('') + '</div>';
      if (b.filas) return '<div class="SusFichaBloque"' + (b.id ? ' id="' + b.id + '"' : '') + '>' + (b.titulo ? tituloSeccion(b) : '') + '<dl class="' + K.dl + '">' + b.filas.map(function (x) { var l = x[2] === 'largo' ? ' class="SusLargo"' : ''; return '<dt' + l + '>' + x[0] + '</dt><dd' + l + '>' + x[1] + '</dd>'; }).join('') + '</dl></div>';
      return '<div class="SusFichaBloque SusFichaEnlaces">' + b.enlaces.join('') + '</div>';
    }
    var cab = K.app && f.soloBarra ? '' : '<div class="SusFichaCab">' + f.icono + '<span class="SusFichaNombres"><span class="SusFichaNombre" id="ficha-titulo">' + f.titulo + '</span>' + '</span></div>'; // en la app el tipo ya está en la barra
    var salida = '<div class="SusFichaSalida"><button type="button" class="' + K.accion + '" id="' + f.idSalida + '">' + f.salida + '</button></div>'; // fuera de la ficha: la acción destructiva no se mezcla con la información
    return '<div id="' + f.id + '">' + cab + '<div class="SusFichaUna">' + f.bloques.map(bloque).join('') + '</div>' + salida + '</div>';
  }
  function fichaWeb(doc, cont) {
    cont.innerHTML = '<button type="button" class="SusVolver" id="volver-lista">' + VOLVER_WEB + 'Suscripciones</button>' + fichaHtml(fichaDe('SusEnlace', false), { dl: 'SusDetalle', fila: 'SusNumero', accion: 'SusAccion' });
    tocable(doc.getElementById('volver-lista'), 'Volver a Suscripciones', verFicha(null));
  }
  function filaWeb(o) {
    var tag = o.nav ? 'button' : 'div';
    return '<' + tag + (o.nav ? ' type="button"' : '') + ' class="SusFila' + (o.nav ? ' SusFilaNav' : '') + '" id="' + o.id + '">' + (o.logo || '') +
      '<span class="SusFilaTexto"><span class="SusFilaNombre">' + o.nombre + '</span>' + (o.sub ? '<span class="' + (o.claseSub || 'SusFilaSub') + '">' + o.sub + '</span>' : '') + (o.enlace ? '<span class="SusFilaAccion">' + o.enlace + '</span>' : '') + '</span>' +
      (o.boton || '') + (o.nav ? CHEV_WEB : '') + '</' + tag + '>';
  }
  function seccionWeb(id, titulo, filas) { return '<div class="SusBloque" id="' + id + '"><span class="wTxtRegularTitle16">' + titulo + '</span><div class="SusLista">' + filas + '</div></div>'; }
  function suscripciones(doc, estado) {
    // Sin el título de la página real: repetía el nombre de la pestaña.
    doc.getElementById('W0175TABLE1').remove();
    var docs = doc.getElementById('W0175TABLEDOCUMENTS');
    var bloques = nuevo(doc, 'div', { id: 'sus-bloques' });
    docs.parentNode.insertBefore(bloques, docs);
    docs.remove();
    doc.body.classList.toggle('SusEnDetalle', !!detalle); // en teléfono las pestañas apiladas empujaban el detalle hacia abajo
    if (detalle) { fichaWeb(doc, bloques); return; }

    var prog = '', apps = '', html = '';
    if (estado.puntos !== 'sinprograma') prog += estado.puntos === 'adherido'
      ? filaWeb({ id: 'fila-puntos', nav: true, logo: iconoServicio('puntos'), nombre: 'Programa Puntos', sub: 'Adherido desde el ' + (hecho.desde || PUNTOS.desde) })
      : filaWeb({ id: 'fila-puntos', logo: iconoServicio('puntos'), nombre: 'Programa Puntos', sub: 'No estás adherido', boton: '<input type="button" id="unirme" class="wButtonActionDefualt btn btn-default" value="Unirme">' });
    if (estado.membresias !== 'sin') {
      if (!hecho.sinMembresia) prog += filaWeb({ id: 'membresia-1', nav: true, logo: iconoServicio('activa'), nombre: MEMB, sub: 'Miembro desde el ' + DESDE[0] });
      prog += filaWeb({ id: 'membresia-2', logo: iconoServicio('pendiente'), nombre: 'Club del Vino', sub: 'Su solicitud sera procesada a la brevedad.', claseSub: 'wTxtRegularGreenGroups' }); // pendiente: no hay nada que administrar
      prog += filaWeb({ id: 'membresia-3', logo: iconoServicio('documentos'), nombre: 'Beneficio Jubilados', sub: 'Se requieren acciones para resolver tu solicitud', claseSub: 'wTxtRegularRedGroups', enlace: '<button type="button" class="SusEnlace" id="ver-documentos">Ver documentos</button>' }); // faltan documentos: su única acción
    }
    if (estado.apps !== 'sin') appsVisibles().forEach(function (a) { apps += filaWeb({ id: 'app-' + a.id, nav: true, logo: iconoServicio('app', a), nombre: a.nombre, sub: resumenApp(a) }); });
    if (prog) html += seccionWeb('bloque-programas', 'Programas y membresías', prog);
    if (apps) html += seccionWeb('bloque-apps', 'Aplicaciones conectadas', apps);
    // Sin programa de Puntos, sin membresías y sin apps: un único aviso, para no dejar la pantalla en blanco
    bloques.innerHTML = html || '<div class="SusVacio" id="sus-vacio">' + GLIFO_ESTRELLA + '<div><span class="SusVacioTitulo">Aún no tenés suscripciones.</span><span class="wTxtDescriptionGray3">Cuando te sumes a una membresía o conectes una app, la vas a ver acá.</span></div></div>';
  }
  // Lo que responde a un toque, en web y app; cada elemento existe según se esté en la lista o en un detalle
  function tocablesComunes(doc) {
    function t(id, et, f) { var e = doc.getElementById(id); if (e) tocable(e, et, f); }
    if (!doc.getElementById('unirme')) t('fila-puntos', 'Ver Programa Puntos', verFicha('puntos')); // sin adhesión la fila no abre nada: solo responde «Unirme»
    t('membresia-1', 'Ver ' + MEMB, verFicha('membresia'));
    t('ver-documentos', 'Ver documentos', aviso('Ver documentos', 'Sigue el flujo actual: la carga de documentos de la membresía, como hoy.'));
    t('salir-puntos', 'Salir del Programa Puntos', abrir('salir-puntos'));
    t('unirme', 'Unirme al Programa Puntos', abrir('unirme'));
    t('ver-bases', 'Ver bases y condiciones', abrir('bases-puntos'));
    t('ver-bases-membresia-1', 'Ver bases y condiciones', abrir('bases-membresia'));
    t('cancelar-membresia', 'Cancelar membresía', abrir('cancelar-membresia'));
    APPS.forEach(function (a) {
      var margarita = a.id === 'margarita';
      t('app-' + a.id, 'Ver ' + a.nombre, verFicha(a.id));
      t('ver-bases-' + a.id, 'Ver bases y condiciones', abrir('bases-' + a.id));
      t('desconectar-' + a.id, 'Desconectar ' + a.nombre, abrir(margarita ? 'desconectar-app' : 'desconectar-' + a.id));
    });
    if (!hecho.sinNumero) t('desvincular-1', 'Desvincular el dispositivo', abrir('desvincular-numero')); // el diálogo habla del primer número
  }

  // ---------------------------------------------------------------- Información personal: + Borrar mi cuenta
  function misDatos(doc) {
    // documento del usuario de prueba -> uno de ejemplo
    var docu = doc.getElementById('CTLCUSTOMERDOCUMENTNUMBER');
    if (docu) { docu.value = '1.234.567-8'; var ver = docu.parentNode.querySelector('p'); if (ver) ver.textContent = '1.234.567-8'; }
    // Puntos pasó entero a Suscripciones: hoy este bloque solo se ve dentro del programa
    ['TBLPOINTPROGRAM', 'TBLPOINTS'].forEach(function (id) { var e = doc.getElementById(id); if (e) e.style.display = 'none'; });
    var acciones = doc.getElementById('TBLMYDATAACTIONS');
    var fila = acciones.closest('.row');
    var bloque = nuevo(doc, 'div', { class: 'row' },
      // zona propia, separada del formulario por aire y una línea a todo el ancho; la acción es un enlace rojo,
      // sin relleno, para que se encuentre sin competir con Guardar (la confirmación con contraseña sigue igual)
      '<div class="col-xs-12"><div class="SusCuenta" id="sus-cuenta">' +
      '<span class="wProductRelatedTitle">Borrar tu cuenta</span>' +
      '<span class="LabelEdit">Se borran tus datos, tus puntos, tus membresías y las apps conectadas. No se puede deshacer.</span>' +
      '<button type="button" id="borrar-cuenta" class="SusAccion">Borrar mi cuenta</button></div></div>');
    fila.parentNode.insertBefore(bloque, fila.nextSibling);
    tocable(doc.getElementById('borrar-cuenta'), 'Borrar mi cuenta', aviso('Borrar mi cuenta', 'Sigue el flujo actual: la página «Borrar Cuenta», que pide la contraseña para confirmar.'));
  }

  // ---------------------------------------------------------------- diálogos (popup estándar del sitio)
  var DIALOGOS = {
    'salir-puntos': { titulo: 'Deseo darme de baja del Programa Puntos de Tienda Inglesa', texto: 'Al Confirmar estas aceptando la caducidad inmediata de todos los Puntos acumulados como así también del saldo de tu cuenta',
      accion: 'Confirmar', accionApp: 'Aceptar' },
    'cancelar-membresia': { titulo: '¿Cancelar tu membresía a Socio Acelu?', texto: 'Vas a dejar de recibir los beneficios del grupo.',
      accion: 'Confirmar', cancelar: 'Regresar' },
    'desconectar-app': { titulo: '¿Desconectar Margarita?', texto: 'Margarita ya no va a poder acceder a tu cuenta, se desvinculan sus 2 dispositivos y vamos a borrar tus datos en Margarita. Si querés volver a usarla, la conectás de nuevo desde Margarita.',
      accion: 'Desconectar' },
    'unirme': { titulo: 'Puntos', texto: 'Para poder comprar online y participar el programa Puntos, ingresá tu documento de identidad. ¡Juntá PUNTOS y canjealos por lo que quieras!', alta: true,
      paises: ["Uruguay","Argentina","Brasil","Chile","Paraguay","Otro"], acepto: 'Acepto suscribirme al programa de Puntos y acepto las bases y condiciones del programa establecidas',
      legal: "De conformidad con la Ley N° 18.331 de Protección de Datos Personales, presto mi consentimiento, inequívoco, libre, expreso e informado para que mis datos/información sean compartidos con Scotiabank Uruguay S.A. con la exclusiva finalidad de que éste pueda ofrecerme sus productos y servicios financieros, así como ofertas para fines informativos y/o comerciales, en virtud de la alianza comercial que mantienen el Banco y Tienda Inglesa. El responsable de la Base de datos es Tienda Inglesa., y la dirección donde Ud. podrá ejercer los derechos de acceso, rectificación, actualización, inclusión o supresión, es puntos@tiendainglesa.com.uy",
      accion: 'Unirme' },
    'desconectar-penca': { titulo: '¿Desconectar Penca Tienda Inglesa?', texto: 'Penca Tienda Inglesa ya no va a poder acceder a tu cuenta y vamos a borrar tus datos en Penca Tienda Inglesa. Si querés volver a usarla, la conectás de nuevo desde Penca Tienda Inglesa.',
      accion: 'Desconectar' },
    'desvincular-numero': { titulo: '¿Desvincular WhatsApp +598\u00a099\u00a0000\u00a0111?', texto: 'Margarita ya no va a atender pedidos desde ese número. WhatsApp +598\u00a098\u00a0000\u00a0222 sigue vinculado.',
      accion: 'Desvincular' }
  };
  // «Ver bases»: solo el texto, en un popup (web) o una hoja (app). Los enlaces del texto abren afuera.
  DIALOGOS['bases-puntos'] = { titulo: 'Bases del Programa Puntos', bases: window.BASES_PUNTOS };
  // textos de ejemplo, inventados: solo muestran cómo se ven las bases de una membresía o una app
  function basesEjemplo(nombre, secciones) {
    return '<ol>' +
      secciones.map(function (x) { return '<li><strong>' + x[0] + '</strong><br>' + x[1] + '</li>'; }).join('') + '</ol>' +
      '<p>Las presentes bases se someten a la jurisdicción de los tribunales competentes de la ciudad de Montevideo, Uruguay.</p>';
  }
  function basesApp(nombre, servicio) {
    return basesEjemplo(nombre, [
      ['El servicio', nombre + ' es ' + servicio + ', ofrecido por Tienda Inglesa a sus clientes registrados.'],
      ['Aceptación', 'Al conectar ' + nombre + ' con tu cuenta aceptás estas condiciones. Podés desconectarla cuando quieras desde Suscripciones.'],
      ['Datos que usa', nombre + ' accede a los datos que autorizaste al conectarla, y los usa solo para prestar el servicio.'],
      ['Baja y borrado', 'Al desconectar ' + nombre + ', deja de tener acceso a tu cuenta y se borran los datos que guardó.'],
      ['Cambios', 'Tienda Inglesa puede modificar estas condiciones y avisará los cambios por sus canales habituales.']
    ]);
  }
  DIALOGOS['bases-membresia'] = { titulo: 'Bases de Socio Acelu', bases: basesEjemplo('Socio Acelu', [
    ['La membresía', 'Socio Acelu es un beneficio para las personas afiliadas a la institución, que da acceso a descuentos en las compras en Tienda Inglesa.'],
    ['Quiénes pueden participar', 'Clientes mayores de 18 años, con cuenta en Tienda Inglesa, que presenten la documentación que acredite su afiliación.'],
    ['Beneficios', 'Los descuentos se aplican al identificarse como cliente, y no son acumulables con otras promociones salvo que se indique lo contrario.'],
    ['Baja', 'Podés cancelar tu membresía cuando quieras desde Suscripciones. Tienda Inglesa puede darla de baja si dejás de cumplir los requisitos.'],
    ['Cambios', 'Tienda Inglesa puede modificar estas bases y avisará los cambios por sus canales habituales.']
  ]) };
  DIALOGOS['bases-margarita'] = { titulo: 'Bases de Margarita', bases: basesApp('Margarita', 'una asistente virtual que te ayuda a buscar productos y armar tus compras') };
  DIALOGOS['bases-penca'] = { titulo: 'Bases de Penca Tienda Inglesa', bases: basesApp('Penca Tienda Inglesa', 'un juego de pronósticos deportivos') };
  var ALTA = 'vacia'; // ALTA: con «Documento ya asociado», el alta abre con el error de hoy
  function basesDialogo(d) { return '<div class="SusBases" id="dialogo-bases">' + d.bases.replace(/<p>(\s|&nbsp;|<br>)*<\/p>/g, '').replace(/^\s*<p><strong>[^<]*<\/strong><\/p>/, '') + '</div>'; }
  function enlacesBases(doc) {
    doc.querySelectorAll('#dialogo-bases a').forEach(function (e) { tocable(e, 'Abrir el enlace', aviso('Enlace externo', 'Abre ' + e.getAttribute('href') + ' en otra pestaña (web) o en el navegador (app).')); });
  }
  // detalle «Ver mis datos»: los datos cedidos a la app, con su valor
  function datosDialogo(d) {
    return '<dl class="SusDatos" id="dialogo-datos">' + d.datos.map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + x[1] + '</dd>'; }).join('') + '</dl>';
  }
  // alta: el formulario entero vive acá, con los textos de hoy. «Unirme» siempre está activo: si falta algo, el error va junto a eso.
  function formAlta(d, claseEnlace) {
    return '<div class="SusAlta" id="dialogo-alta"><div class="SusCampos">' +
      '<div class="SusCampo"><label for="dialogo-documento">Documento</label><input type="text" id="dialogo-documento" class="form-control" inputmode="numeric" placeholder="Sin puntos ni guiones" autocomplete="off"><div class="SusErrorSlot" id="dialogo-error-slot"></div></div>' + // el error, debajo de su campo
      '<div class="SusCampo"><label for="dialogo-pais">País de emisión</label><select id="dialogo-pais" class="form-control">' + d.paises.map(function (p) { return '<option>' + p + '</option>'; }).join('') + '</select></div></div>' +
      '<label class="SusOpcion"><input type="checkbox" id="dialogo-opcion"><span>' + d.acepto.replace('bases y condiciones', '<button type="button" class="' + claseEnlace + ' SusEnlaceTexto" id="dialogo-ver-bases">bases y condiciones</button>') + '</span></label><div class="SusErrorSlot SusErrorOpcion" id="dialogo-error-acepto"></div>' + // el aviso de las bases, junto a su casilla
      '<label class="SusOpcion SusLegal" id="dialogo-banco-fila"><input type="checkbox" id="dialogo-banco"><span>' + d.legal + '</span></label></div>';
  }
  function activarAlta(doc) {
    var op = doc.getElementById('dialogo-opcion'), ac = doc.getElementById('dialogo-accion'), nu = doc.getElementById('dialogo-documento');
    // al corregir, el error de ese lugar se va
    nu.addEventListener('input', function () { nu.classList.remove('SusCampoError'); doc.getElementById('dialogo-error-slot').innerHTML = ''; });
    op.addEventListener('change', function () { doc.getElementById('dialogo-error-acepto').innerHTML = ''; });
  }
  function appsVisibles() { return APPS.filter(function (a) { return (hecho.sinApps || []).indexOf(a.id) < 0; }); }
  function numerosDe(a) { return hecho.sinNumero ? a.numeros.slice(1) : a.numeros; }
  // la lista o el detalle actualizados son la confirmación: sin mensaje aparte
  function basesSobreAlta(doc, enApp) {
    var d = DIALOGOS['bases-puntos'], v;
    if (enApp) {
      v = nuevo(doc, 'div', { class: 'alerta-velo hoja', id: 'dialogo-sobre' }, '<div class="hoja-app hoja-bases" role="dialog"><h2>' + d.titulo + '</h2>' + basesDialogo(d) + '<button type="button" class="btn-secundario" id="dialogo-sobre-cerrar">Cerrar</button></div>');
      doc.querySelector('.alerta-velo').parentNode.appendChild(v);
    } else {
      v = nuevo(doc, 'div', { class: 'PopupContainer SusDialogo SusDialogoBases', id: 'dialogo-sobre' }, '<div class="TableRoundedShadow" role="dialog"><span class="wTxtRegularTitle">' + d.titulo + '</span>' + basesDialogo(d) + '<div class="SusBotones"><input type="button" id="dialogo-sobre-cerrar" class="wBtnSecondaryAction btn btn-default" value="Cerrar"></div></div>');
      doc.body.appendChild(v);
    }
    enlacesBases(doc);
    function quitar() { v.remove(); }
    var salirSobre = enApp || doc.defaultView.innerWidth < 768 ? armarHoja(doc, v, q(v, '.hoja-app, .TableRoundedShadow'), function () { salirSobre(quitar); }, true) : null;
    tocable(doc.getElementById('dialogo-sobre-cerrar'), 'Cerrar', function () { if (salirSobre) salirSobre(quitar); else quitar(); });
  }
  function errorEn(doc, slot, campo, texto) {
    if (campo) doc.getElementById(campo).classList.add('SusCampoError');
    doc.getElementById(slot).innerHTML = '<span class="SusError" id="' + (slot === 'dialogo-error-slot' ? 'dialogo-error' : slot + '-texto') + '">' + texto + '</span>';
  }
  // R2: una sola espera, en el botón; las alertas nativas de la app se cierran al tocar
  function esperar(doc, fin) {
    var b = doc.getElementById('dialogo-accion');
    if (!b || b.classList.contains('dest')) { fin(); return; }
    b.disabled = true; b.classList.add('SusEsperando'); b.setAttribute('aria-busy', 'true');
    setTimeout(function () { b.disabled = false; b.classList.remove('SusEsperando'); b.removeAttribute('aria-busy'); fin(); }, 900);
  }
  function terminar(doc, paso) {
    if (paso === 'unirme') {
      var nu = doc.getElementById('dialogo-documento'), falta = false;
      if (!nu.value.trim()) { errorEn(doc, 'dialogo-error-slot', 'dialogo-documento', 'Ingresá tu documento.'); falta = true; }
      if (!doc.getElementById('dialogo-opcion').checked) { errorEn(doc, 'dialogo-error-acepto', null, 'Para unirte, aceptá las bases y condiciones.'); falta = true; }
      if (falta) { if (doc.defaultView.innerWidth >= 768 && !nu.value.trim()) nu.focus(); return; } // lo que falta se avisa sin esperar
    }
    esperar(doc, function () { aplicarConfirmacion(doc, paso); });
  }
  // el alta tal como queda cuando el documento ya está asociado a otro usuario (control «Alta» de la barra)
  function precargarAlta(doc) {
    if (ALTA !== 'asociado') return;
    doc.getElementById('dialogo-documento').value = '12345678'; doc.getElementById('dialogo-opcion').checked = true;
    errorEn(doc, 'dialogo-error-slot', 'dialogo-documento', 'El documento ya está asociado a otro usuario');
  }
  function aplicarConfirmacion(doc, paso) {
    if (paso === 'unirme' && doc.getElementById('dialogo-documento').value.trim() === '12345678') {
      errorEn(doc, 'dialogo-error-slot', 'dialogo-documento', 'El documento ya está asociado a otro usuario');
      return;
    }
    var volverALista = false;
    if (paso === 'salir-puntos') { hecho.puntos = 'no'; volverALista = true; }
    if (paso === 'unirme') { hecho.puntos = 'adherido'; hecho.desde = HOY; }
    if (paso === 'cancelar-membresia') { hecho.sinMembresia = true; volverALista = true; }
    if (paso === 'desconectar-app' || paso === 'desconectar-penca') { hecho.sinApps = (hecho.sinApps || []).concat(paso === 'desconectar-app' ? 'margarita' : 'penca'); volverALista = true; }
    if (paso === 'desvincular-numero') hecho.sinNumero = true; // sigue en el detalle: la app continúa conectada
    function aplicar() { dlg = null; if (volverALista) verFicha(null)(); else P.render(); }
    if (hojaActiva) hojaActiva(aplicar); else aplicar();
  }
  function dialogo(doc, paso) {
    var d = DIALOGOS[paso];
    var v = nuevo(doc, 'div', { class: 'PopupContainer SusDialogo' + (d.bases ? ' SusDialogoBases' : '') + (d.alta ? ' SusDialogoAlta' : '') },
      '<div class="TableRoundedShadow" id="dialogo" role="dialog"><span class="wTxtRegularTitle">' + d.titulo + '</span>' +
      (d.texto ? '<span class="wTxtRegular1">' + d.texto + '</span>' : '') +
      (d.datos ? datosDialogo(d) : '') +
      (d.bases ? basesDialogo(d) : '') +
      (d.alta ? formAlta(d, 'SusEnlace') : '') +
      (d.datos || d.bases
        ? '<div class="SusBotones"><input type="button" id="dialogo-cancelar" class="wBtnSecondaryAction btn btn-default" value="Cerrar"></div></div>' // lo que descarta, en secundario: la única acción fuerte es la que cambia algo
        : '<div class="SusBotones"><input type="button" id="dialogo-cancelar" class="wBtnSecondaryAction btn btn-default" value="' + (d.cancelar || 'Cancelar') + '">' +
          '<input type="button" id="dialogo-accion" class="' + (d.alta ? 'wButtonActionDefualt' : 'wButtonActionRed') + ' btn btn-default" value="' + d.accion + '"></div></div>'));
    doc.body.appendChild(v);
    if (doc.defaultView.innerWidth < 768) hojaActiva = armarHoja(doc, v, q(v, '.TableRoundedShadow'), cerrar, animarEntrada()); // en teléfono, el popup es un sheet
    tocable(doc.getElementById('dialogo-cancelar'), d.datos || d.bases ? 'Cerrar' : 'Cerrar sin cambios', cerrar);
    if (d.bases) enlacesBases(doc);
    if (d.datos || d.bases) return;
    if (d.alta) {
      activarAlta(doc); precargarAlta(doc);
      var nd = doc.getElementById('dialogo-documento'), acc = doc.getElementById('dialogo-accion');
      if (doc.defaultView.innerWidth >= 768) nd.focus(); // cursor en el primer campo; en mobile no: el teclado taparía el formulario
      nd.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !acc.disabled) acc.click(); });
      tocable(doc.getElementById('dialogo-ver-bases'), 'Ver las bases', function () { basesSobreAlta(doc, false); });
    }
    tocable(doc.getElementById('dialogo-accion'), d.accion, function () {
      terminar(doc, paso);
    });
  }

  // ================================================================ APP (iOS)
  // Réplica de las pantallas reales de la app (menú «Mis Datos», «Membresías», «Privacidad» y la edición «Mis datos»),
  // capturadas en el simulador con un cliente con dos membresías. Posiciones y tamaños del árbol de XCUITest, estilos
  // del tema iOS, colores medidos y los íconos recortados de las capturas (sitio/app).
  var FUENTE_APP = '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">';
  var ICO = function (n) { return 'sitio/app/' + n + '.png'; };
  var CHEV = '<svg class="chev" viewBox="0 0 10 18" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1.5 1.5l7 7.5-7 7.5"/></svg>';
  function navApp(titulo, izquierda, derecha) {
    return '<div class="ios-estado"><span>9:41</span><span>●●●●</span></div><div class="ios-nav">' +
      (izquierda === 'menu' ? '<span class="izq menu"><img src="' + ICO('menu') + '" alt=""></span>' : '<span class="izq" id="app-volver"><img src="' + ICO('volver') + '" alt="Volver"></span>') +
      '<h1 id="app-titulo">' + titulo + '</h1>' + (derecha ? '<span class="der">' + derecha + '</span>' : '') + '</div>';
  }
  function itemApp(ico, texto, attrs) {
    return '<div class="card item"' + (attrs || '') + '><span class="ico"><img src="' + ICO(ico) + '" alt=""></span><span class="txt">' + texto + '</span></div>';
  }
  function menuApp() {
    return navApp('Mis Datos', 'menu') + '<div class="contenido-app">' +
      '<div class="card perfil" id="app-perfil"><img class="lapiz" id="app-lapiz" src="' + ICO('lapiz') + '" alt="Editar">' +
      '<img class="avatar" src="' + ICO('avatar') + '" alt=""><div class="nombre">Ana Pérez</div><div class="mail">ana.perez@ejemplo.com</div>' +
      '<div class="fila"><img src="' + ICO('puntos') + '" alt="">60 puntos</div><div class="fila stk"><img src="' + ICO('stickers') + '" alt="">60 Stickers</div></div>' +
      itemApp('domicilios', 'Mis domicilios') + itemApp('tarjetas', 'Mis tarjetas') + itemApp('pedidos', 'Mis pedidos') + itemApp('listas', 'Listas de compras') +
      itemApp('cupones', 'Mis cupones') + itemApp('misstickers', 'Mis stickers<small>60 Stickers</small>') +
      itemApp('membresias', 'Suscripciones', ' id="app-suscripciones"') +
      '<button type="button" class="btn-primario">Cambiar Contraseña</button></div>';
  }
  function tarjetaApp(o) {
    return '<div class="card grupo' + (o.gris ? ' gris' : '') + '" id="' + o.id + '">' + (o.titulo ? '<div class="tit">' + o.titulo + '</div>' : '') + '<div class="des">' + o.des + '</div>' +
      (o.estrella ? '<img class="estrella" src="' + ICO('estrella') + '" alt="">' : '') + (o.extra || '') +
      (o.boton ? '<button type="button" class="' + (o.claseBoton || 'accion-app') + '" id="' + o.idBoton + '">' + o.boton + '</button>' : '') + (o.despues || '') + '</div>';
  }
  function filaApp(o) {
    var tag = o.nav ? 'button' : 'div';
    return '<' + tag + (o.nav ? ' type="button"' : '') + ' class="fila-app" id="' + o.id + '">' + (o.logo || '') +
      '<span class="txt"><span class="nom">' + o.nombre + '</span>' + (o.sub ? '<span class="sub' + (o.pendiente ? ' pendiente-app' : '') + (o.documentos ? ' documentos-app' : '') + '">' + o.sub + '</span>' : '') + (o.enlace ? '<span class="SusFilaAccion">' + o.enlace + '</span>' : '') + '</span>' +
      (o.boton || '') + (o.nav ? CHEV : '') + '</' + tag + '>';
  }
  function fichaApp() {
    var f = fichaDe('lnk', true);
    return navApp(f.tipo, 'volver') + '<div class="contenido-app" style="padding-top:10px">' + fichaHtml(f, { dl: 'detalle', fila: 'num', accion: 'accion-app', app: true }) + '</div>';
  }
  function suscripcionesApp(estado) {
    if (detalle) return fichaApp();
    var prog = '', apps = '';
    if (estado.puntos !== 'sinprograma') prog += estado.puntos === 'adherido'
      ? filaApp({ id: 'fila-puntos', nav: true, logo: iconoServicio('puntos'), nombre: 'Programa Puntos', sub: 'Adherido desde el ' + (hecho.desde || PUNTOS.desde) })
      : filaApp({ id: 'fila-puntos', logo: iconoServicio('puntos'), nombre: 'Programa Puntos', sub: 'No estás adherido', boton: '<button type="button" class="btn-primario" id="unirme">Unirme</button>' });
    if (estado.membresias !== 'sin') {
      if (!hecho.sinMembresia) prog += filaApp({ id: 'membresia-1', nav: true, logo: iconoServicio('activa'), nombre: MEMB, sub: 'Miembro desde el ' + DESDE[0] });
      prog += filaApp({ id: 'membresia-2', logo: iconoServicio('pendiente'), nombre: 'Club del Vino', sub: 'Su solicitud sera procesada a la brevedad.', pendiente: true }); // pendiente: no hay nada que administrar
      prog += filaApp({ id: 'membresia-3', logo: iconoServicio('documentos'), nombre: 'Beneficio Jubilados', sub: 'Se requieren acciones para resolver tu solicitud', documentos: true, enlace: '<button type="button" class="lnk" id="ver-documentos">Ver documentos</button>' }); // faltan documentos: su única acción
    }
    if (estado.apps !== 'sin') appsVisibles().forEach(function (a) { apps += filaApp({ id: 'app-' + a.id, nav: true, logo: iconoServicio('app', a), nombre: a.nombre, sub: resumenApp(a) }); });
    var h = navApp('Suscripciones', 'volver') + '<div class="contenido-app" style="padding-top:4px">';
    if (prog) h += '<div class="seccion" id="bloque-programas">Programas y membresías</div><div class="card lista-app">' + prog + '</div>';
    if (apps) h += '<div class="seccion" id="bloque-apps">Aplicaciones conectadas</div><div class="card lista-app">' + apps + '</div>';
    // sin nada para mostrar: un único aviso
    if (!prog && !apps) h += '<div class="card vacio-app" id="sus-vacio">' + GLIFO_ESTRELLA + '<div><div class="t">Aún no tenés suscripciones.</div><div class="s">Cuando te sumes a una membresía o conectes una app, la vas a ver acá.</div></div></div>';
    return h + '</div>';
  }
  function campoApp(rot, val, ph, chev) { return '<div class="campo-app"><label>' + rot + '</label><div' + (ph ? ' class="ph"' : '') + '>' + val + '</div>' + (chev ? CHEV : '') + '</div>'; }
  function misDatosApp() {
    return navApp('Mis datos', 'volver', 'Aceptar') + '<div class="contenido-app" style="padding-top:5px">' +
      '<div class="card form-app" id="app-form">' + campoApp('Nombre', 'Ana') + campoApp('Apellido', 'Pérez') + campoApp('e-mail', 'ana.perez@ejemplo.com') +
      campoApp('Sexo', '', false, true) + campoApp('Fecha de nacimiento', 'Fecha de nacimiento', true) + campoApp('Celular', 'Celular', true) + '</div>' +
      '<div class="card fila-accion-app" id="privacidad-tarjeta"><button type="button" class="lnk" id="app-privacidad">Declaración de privacidad</button></div>' + // como los ajustes de iOS: cada acción, una fila en su tarjeta; lo destructivo, al final
      '<div class="card fila-accion-app" id="sus-cuenta"><button type="button" class="accion-app" id="borrar-cuenta">Borrar mi cuenta</button></div>' +
      '<p class="pie-app" id="sus-cuenta-pie">Se borran tus datos, tus puntos, tus membresías y las apps conectadas. No se puede deshacer.</p></div>';
  }
  function alertaApp(paso) {
    var d = DIALOGOS[paso];
    if (d.datos) return '<div class="alerta-velo hoja"><div class="hoja-app" id="dialogo" role="dialog"><h2>' + d.titulo + '</h2><p>' + d.texto + '</p>' + datosDialogo(d) +
      '<button type="button" class="btn-secundario" id="dialogo-cancelar">Cerrar</button></div></div>';
    if (d.bases) return '<div class="alerta-velo hoja"><div class="hoja-app hoja-bases" id="dialogo" role="dialog"><h2>' + d.titulo + '</h2>' + basesDialogo(d) +
      '<button type="button" class="btn-secundario" id="dialogo-cancelar">Cerrar</button></div></div>';
    if (d.alta) return '<div class="alerta-velo hoja"><div class="hoja-app" id="dialogo" role="dialog"><h2>' + d.titulo + '</h2><p>' + d.texto + '</p>' + formAlta(d, 'lnk') +
      '<button type="button" class="btn-primario" id="dialogo-accion">' + d.accion + '</button><button type="button" class="btn-secundario" id="dialogo-cancelar">Cancelar</button></div></div>';
    return '<div class="alerta-velo"><div class="alerta" id="dialogo" role="alertdialog"><div class="cuerpo-alerta"><h2>' + d.titulo + '</h2><p>' + d.texto + '</p></div>' +
      // iOS apila los botones cuando alguno no entra en medio ancho (la acción va arriba y Cancelar abajo)
      (d.accion.length > 11
        ? '<div class="bots apilados">' + '<button type="button" class="dest" id="dialogo-accion">' + d.accion + '</button><button type="button" id="dialogo-cancelar">' + (d.cancelar || 'Cancelar') + '</button></div></div></div>'
        : '<div class="bots"><button type="button" id="dialogo-cancelar">' + (d.cancelar || 'Cancelar') + '</button><button type="button" class="dest" id="dialogo-accion">' + (d.accionApp || d.accion) + '</button></div></div></div>');
  }
  function tocablesApp(doc, paso) {
    function t(id, et, f) { var e = doc.getElementById(id); if (e) tocable(e, et, f); }
    t('app-suscripciones', 'Suscripciones', ir('suscripciones'));
    t('app-lapiz', 'Editar mis datos', ir('mis-datos'));
    if (paso !== 'menu' && !dlg) t('app-volver', detalle ? 'Volver a Suscripciones' : 'Volver a Mis Datos', detalle ? verFicha(null) : ir('menu'));
    tocablesComunes(doc);
    t('borrar-cuenta', 'Borrar mi cuenta', aviso('Borrar mi cuenta', 'Sigue el flujo actual: la pantalla «Borrar cuenta», que pide la contraseña para confirmar.'));
    t('app-privacidad', 'Declaración de privacidad', aviso('Declaración de privacidad', 'Abre la landing de privacidad de la tienda, como hoy.'));
    if (dlg) {
      t('dialogo-cancelar', DIALOGOS[dlg].datos || DIALOGOS[dlg].bases ? 'Cerrar' : 'Cerrar sin cambios', cerrar);
      if (DIALOGOS[dlg].bases) enlacesBases(doc);
      if (DIALOGOS[dlg].alta) { activarAlta(doc); precargarAlta(doc); t('dialogo-ver-bases', 'Ver las bases', function () { basesSobreAlta(doc, true); }); }
      t('dialogo-accion', DIALOGOS[dlg].accion, function () { terminar(doc, dlg); });
      var hojaApp = doc.querySelector('.alerta-velo.hoja');
      if (hojaApp) hojaActiva = armarHoja(doc, hojaApp, q(hojaApp, '.hoja-app'), cerrar, animarEntrada()); // las alertas nativas no son sheets
    }
  }
  function pantallaApp(estado) {
    var paso = estado.paso;
    var html = paso === 'menu' ? menuApp() : paso === 'mis-datos' ? misDatosApp() : suscripcionesApp(estado);
    if (dlg) html += alertaApp(dlg);
    return { cabeza: FUENTE_APP, html: html, claseCuerpo: 'app', despues: function (doc) { tocablesApp(doc, paso); } };
  }

  // ---------------------------------------------------------------- pantalla
  function pantalla(estado) {
    hojaActiva = null; if (!dlg) ultimoDlg = null;
    if (estado.paso !== ultimoPaso) { dlg = null; ultimoPaso = estado.paso; } // al cambiar de paso se cierra la confirmación
    ALTA = estado.alta || 'vacia';
    var clave = claveDe(estado);
    if (clave !== ultimaClave) { hecho = {}; detalle = null; ultimaClave = clave; }
    if (hecho.puntos) estado = Object.assign({}, estado, { puntos: hecho.puntos });
    if (estado.plataforma === 'app') return pantallaApp(estado);
    var paso = estado.paso, datos = paso === 'mis-datos', base = datos ? PANT.datos : PANT.membresias;
    return {
      cabeza: base.cabeza, html: rutasCompletas(base.cuerpo), claseHtml: base.claseHtml, claseCuerpo: base.claseCuerpo,
      despues: function (doc) {
        pestanas(doc, datos ? 'datos' : 'suscripciones');
        if (datos) misDatos(doc); else suscripciones(doc, estado);
        tocablesComunes(doc);
        if (dlg) dialogo(doc, dlg);
      }
    };
  }

  // ---------------------------------------------------------------- notas para desarrollo
  var NOTAS = {
    suscripciones: [
      { d: null, m: '#TBLMYGROUPS', t: '<b>Sheets en mobile:</b> «Ver bases y condiciones», el alta y las confirmaciones suben desde abajo mientras el fondo se oscurece, y bajan al cerrar. Se cierran con su botón, tocando afuera o arrastrando hacia abajo desde la manija; si el arrastre no llega al 30% del alto, vuelve a su lugar. <b>Lo que descarta</b> (Cancelar, Cerrar) va en el botón secundario del sitio, .wBtnSecondaryAction (fondo #EDF5FE, texto #004795, 8,18:1), también cuando «Cerrar» es el único botón: la única acción rellena y fuerte es la que cambia algo. Reemplaza al gris de «Cancelar» (.ButtonCancel). En la implementación, si el sistema tiene el movimiento reducido, no se anima; el prototipo anima siempre para poder evaluarlo.' },
      { d: '#TBLMYGROUPS', m: '#TBLMYGROUPS', t: '<b>Lista y detalle</b> (propuesta de Marcelo). La pestaña resume qué tiene el cliente. Las salidas, las fechas de aceptación, las bases y los datos cedidos pasan al detalle de cada servicio.' },
      { d: '#TBLMYGROUPS', m: '#TBLMYGROUPS', t: '<b>Después de confirmar en un detalle:</b> vuelve a la lista con la fila ya actualizada, sin mensajes ni avisos flotantes. Desvincular un dispositivo se queda en el detalle, porque la app sigue conectada. Una sola espera: el botón del diálogo queda esperando hasta que todo esté actualizado. Si la acción falla, el error aparece dentro del diálogo. En web, al abrir un diálogo el foco queda adentro, Escape lo cierra, y al cerrar vuelve al control que lo abrió.' },
      { d: '#TBLMYGROUPS', m: '#TBLMYGROUPS', t: '<b>«Membresías» pasa a llamarse «Suscripciones»</b> y suma el Programa Puntos y las apps conectadas. «Preferencias» deja de existir: la baja de Puntos viene acá y «Borrar mi cuenta» va a Información personal.' },
      { d: '#TBLMYGROUPS', m: '#TBLMYGROUPS', t: 'La pestaña se muestra <b>siempre</b>, aunque el cliente no tenga nada: solo aparecen las secciones con contenido y, si no hay ninguna, un único aviso. Hoy «Membresías» depende de una configuración y «Preferencias», de que la tienda muestre el programa de fidelidad en el perfil.' },
      { d: '#bloque-programas', m: '#bloque-programas', t: '<b>Filas:</b> el nombre en semibold 16 #333 y debajo la descripción en regular 14 #5F6062, como en la app; toda la fila abre el detalle; separador #E5E5E5 y borde #CCC. Programas y membresías van sin ícono: la sección ya dice el tipo y cada fila se distingue por su nombre y su estado. Cada app conectada lleva su logo (ExtAppLogoUrl) a la izquierda, en un recuadro de 36 px blanco con borde #E5E5E5 y radio 8, con el logo contenido en 30 px; una app sin logo lleva su inicial en el mismo recuadro. El logo es cuadrado, con fondo transparente o propio. Cada fecha usa el mismo verbo en la lista y en el detalle. En desktop, lista y detalle miden hasta 720 px. Solo se marca lo que es excepción: una fila listada ya está activa o conectada, sin etiqueta de estado.' },
      { d: '#fila-puntos', m: '#fila-puntos', t: '<b>Programa Puntos.</b> Solo en las tiendas con el programa en el perfil (la misma configuración que hoy muestra «Preferencias»). Con adhesión, una sola línea: desde cuándo está adherido. Toda la fila abre el detalle, que tiene lo que la fila no dice. La fecha es SubscriptionDate de la metadata del cliente (código PPLETE, donde se guarda la aceptación de las bases del programa); se actualiza al readherirse. CustomerPointsDateTime no sirve: es la última actualización del saldo.' },
      { d: '#unirme', m: '#unirme', t: 'Sin adhesión, la fila no abre nada: «Unirme» abre el alta acá mismo, sin ir a Información personal.' },
      { d: '#membresia-1', m: '#membresia-1', t: '<b>Membresías:</b> solo los grupos de tipo membresía. «Miembro desde el …» = fecha en que se aprobó la membresía (CustomerGroupCustomerTimeStamp), en lugar de «Subscripción activa». Ese campo cambia cada vez que cambia la aprobación; los procesos que la cambian solos (por cantidad de compras, por cupones o por canal) tocan otros tipos de grupo, no las membresías.' },
      { d: '#membresia-2', m: '#membresia-2', t: '<b>Membresía pendiente:</b> sin flecha, porque no tiene acciones; el texto es el de hoy, en verde #008A08 (4,53:1 sobre blanco; el #00A80A del sitio da 3,18:1). Hoy el producto no permite cancelar una solicitud pendiente: el botón se oculta si la membresía no está aprobada. <i>A confirmar con Lali:</i> si debería poder cancelarse; en ese caso, la fila abre un detalle con «Cancelar solicitud».' },
      { d: '#membresia-3', m: '#membresia-3', t: '<b>Membresía con documentos pendientes:</b> el texto y el rojo #C91411 son los de hoy; si la membresía tiene su propio texto de documentación requerida, va ese, en las líneas que necesite. «Ver documentos» es su única acción y abre la carga de documentos de hoy. Va debajo del texto y no a la derecha, porque el texto es largo y en el teléfono quedaba en cuatro líneas. Sin flecha: la fila no abre un detalle. El recuadro del ícono es gris, como el pendiente, porque todavía no está aprobada.' },
      { d: '#sus-vacio', m: '#sus-vacio', t: '<b>Sin nada para mostrar</b> (tienda sin programa, sin membresías y sin apps): un único aviso, centrado como los del sitio. Las secciones sin contenido no aparecen.' },
      { d: '#app-margarita', m: '#app-margarita', t: '<b>Aplicaciones conectadas</b> (nuevo): logo, nombre y, en una sola línea, el último acceso: sirve para ver qué app hace tiempo que no se usa. Los dispositivos van en el detalle. El logo sale de ExtAppLogoUrl y el nombre, de ExtAppDisplayName o, si está vacío, de ExtAppName, como en la pantalla de consentimiento. Margarita trae su logo, cargado en el script de datos; la Penca, sin logo, muestra su inicial. <i>A confirmar con Lali:</i> de qué dato sale el último acceso.' }
    ],
    'detalle-puntos': [
      { d: '#volver-lista', m: '#volver-lista', t: '<b>Detalle:</b> dentro de la misma pestaña; «Suscripciones» o la pestaña regresan a la lista. En web mobile, las pestañas apiladas no se muestran dentro del detalle. Cabecera con el nombre de 20 (en una app, con su logo en un recuadro de 56 a la izquierda), sin el tipo de servicio debajo: lo dicen la sección de la que viene y la ficha misma. En la app, el tipo va como título de la barra. Debajo, una sola ficha con una sección por tema, separadas por una línea #E5E5E5. Todas las secciones hablan igual: título de sección y, debajo, filas con el rótulo en gris (#5F6062) y el dato en oscuro (#333). Las acciones van al final, como enlaces alineados con los rótulos, uno debajo del otro; no son filas con título. La salida va fuera de la ficha, en un bloque propio a 24 px, para no mezclar la acción destructiva con la información. Los títulos de sección no llevan ícono: el título ya agrupa. En mobile y app, la etiqueta a la izquierda y el valor a la derecha; en desktop, el valor junto a su etiqueta. En desktop la ficha mide hasta 720 px.' },
      { d: '#ficha-puntos', m: '#ficha-puntos', t: '<b>Tus puntos</b>, primero: el saldo (GetCustomerBalancePoints, del servicio de fidelidad) y cuánto vale en pesos (saldo por el valor del punto del canal, GetPointsValue; en el prototipo, $10). Va antes que la salida porque salir hace caducar todos los puntos. <i>A confirmar:</i> si el saldo se muestra igual cuando el servicio de fidelidad no responde. <b>Tu adhesión:</b> una sola fecha: en el formulario de hoy, adherirse y aceptar las bases son el mismo acto. El documento (CustomerDocumentNumber), de solo lectura como hoy, viene de Información personal; el país de emisión no se muestra acá, se pide solo en el alta porque la validación lo usa.' },
      { d: '#salir-puntos', m: '#salir-puntos', t: '«Salir del programa» reemplaza al check «Deseo darme de baja del Programa Puntos de Tienda Inglesa» y al botón CONFIRMAR. <b>Todas las salidas son acciones de texto:</b> rojo #C91411 (5,85:1 sobre blanco; el #ED2F48 de hoy da 4,12:1), 14 px, sin relleno, subrayado solo al pasar el mouse. Debajo de la ficha, en un bloque propio a 24 px, con 44 px de alto para tocar en mobile. Al confirmar hace lo mismo que hoy (aviso a Fidelidad para la baja y el borrado de datos del programa).' },
      { d: '#ver-bases', m: '#ver-bases', t: '<b>Ver bases</b> abre un popup en web y una hoja en la app, sin salir del detalle.' }
    ],
    'detalle-membresia': [
      { d: '#ficha-membresia', m: '#ficha-membresia', t: 'Detalle de una membresía activa: una sección «Tu membresía» con el beneficio primero y después la fecha de aprobación. <b>Beneficio</b>: el texto de la membresía (SummaryMsg de su metadata; el del prototipo es de ejemplo). Es corto: el resumen de compra lo corta en 45 caracteres en web y 36 en la app (MAX_STRING_SUMMARY y MAX_STRING_SUMMARY_SD). En el detalle va entero, sin ese corte. Va antes que la cancelación porque cancelar quita ese beneficio. Si la membresía no tiene ese texto, el bloque no aparece. Es el mismo texto de la línea de descuento del resumen de compra; sus variables, como [[EmployeeId]], se resuelven como ahí (GetCustomerSummaryDiscountInfo). <i>A confirmar:</i> hoy ninguna membresía de los datos de prueba tiene ese texto; falta decidir si se reusa o si el detalle lleva un texto propio. Al final, el enlace a las bases. <i>A confirmar:</i> hoy no se guarda qué versión aceptó cada cliente; hasta que se guarde, muestra las bases vigentes.' },
      { d: '#cancelar-membresia', m: '#cancelar-membresia', t: 'La misma acción de texto roja que las demás salidas. Al confirmar, vuelve a la lista y la fila ya no está.' }
    ],
    'detalle-margarita': [
      { d: '#ficha-margarita .SusFichaCab', m: '#ficha-margarita .SusFichaCab', t: '<b>Logo y nombre</b>, los mismos que muestra hoy la pantalla de consentimiento (GetConsentInfo). Logo: ExtAppLogoUrl, una URL pública a una imagen cuadrada, transparente o con fondo propio, que se muestra contenida en el recuadro (30 px en la lista, 46 en el detalle). El de Margarita se carga en el script de datos (data_for_tests, ExecList/12_ExtApp.sql, filas de Agent-Hub Trunk). Sin ExtAppLogoUrl va la inicial del nombre. Nombre: ExtAppDisplayName y, si está vacío, ExtAppName; en la base local todas las apps tienen ExtAppDisplayName vacío.' },
      { d: '#conexion-margarita', m: '#conexion-margarita', t: '<b>Conectada el</b>: la fecha del consentimiento: tabla CustomerExtAppConsent, campo ExtAppCustomerConsentDateTime. La tabla existe en la KB y en staging; en la base local todavía no.' },
      { d: '#datos-margarita', m: '#datos-margarita', t: '<b>Datos que le cediste</b> (pedido de Marcelo: que el cliente pueda acceder a sus datos guardados): una sección del detalle, no un popup, porque son pocos datos cortos y es información, no una acción. Los datos que el cliente le cedió a la app, con su valor. Cada fila sale solo si la app tiene ese permiso: profile (Nombre), email (Email), phone (Celular), identity (Documento, País de emisión y Fecha de nacimiento). Origen de cada valor, el mismo que recibe la app en su token (OIDTokenExchange): Nombre = CustomerName y CustomerLastName; Email = CustomerMail; Celular = CustomerCellPhone, salvo que el proceso del token devuelva otro número; Documento = CustomerDocumentNumber; País de emisión = el país del documento; Fecha de nacimiento = CustomerBirthday. Los permisos son los que se concedieron en la conexión (OIDCCodeScopesJson) y, si están vacíos, los de la app (ExtAppAllowScopesJson). Margarita muestra solo Nombre y Email, porque en la base local el cliente del hub (Agent-Hub Trunk) tiene profile y email. <i>A confirmar:</i> sus permisos en producción. Los dispositivos vinculados no van acá: no los entrega ningún permiso y ya están en el detalle. Lo que la app genera después, como las conversaciones, no se le muestra al cliente.' },
      { d: '#ultimo-margarita', m: '#ultimo-margarita', t: '<b>Último acceso</b>, pedido de Lali. Hoy no hay un dato por app: ExtAppCustomer no guarda fechas, y la sesión que recibe la app es la del cliente, así que su último acceso no es el de la app. OIDCCode guarda cada inicio de sesión con su fecha; <i>a confirmar</i> si registra también las renovaciones del token. Hay que armarlo, como ya estaba previsto. <i>A confirmar con Lali</i>.' },
      { d: '#numeros-margarita', m: '#numeros-margarita', t: '<b>Dispositivos vinculados</b> (pedido de Lali), hoy solo en las apps con PAR activo (ExtAppRequirePar): cada uno con su fecha (ExtAppCustomerPhoneApprovedOn) y «Desvincular». Al desvincular, la fila sale y el contador de la lista baja. Hoy el único dispositivo es el número de WhatsApp (CustomerExtAppPhone). <i>A confirmar:</i> cuando la app y la web pidan consentimiento, se suman como filas; hoy ese consentimiento es una sola fila por cliente y app, sin dato de dispositivo.' },
      { d: '#desconectar-margarita', m: '#desconectar-margarita', t: '«Desconectar» corta el acceso de la app <b>en el momento</b>, desvincula todos sus dispositivos y pide borrar los datos. No cierra la sesión del cliente.' }
    ],
    'detalle-penca': [
      { d: '#ficha-penca', m: '#ficha-penca', t: 'Una app sin dispositivos vinculados: el bloque no aparece. Lo demás es igual que en cualquier app conectada.' }
    ],
    'mis-datos': [
      { d: '#TBLMYDATAACTIONS', m: '#TBLMYDATAACTIONS', t: 'El formulario de Información personal no cambia.' },
      { d: '#sus-cuenta', m: '#sus-cuenta', t: '<b>Borrar mi cuenta</b> pasa acá desde Preferencias, como una zona propia al final: 48 px de aire y una línea de 1 px #E5E5E5 a todo el ancho la separan de Cancelar / Guardar, que siguen cerrando el formulario. Título y una línea que dice qué se pierde; la acción va debajo del texto, porque acá no hay tarjeta que la contenga.' },
      { d: '#borrar-cuenta', m: '#borrar-cuenta', t: 'La misma acción de texto roja que las demás salidas (#C91411, sin relleno): se encuentra, pero no compite con Guardar ni se confunde con Cancelar (hoy es un botón oscuro). Sigue al flujo actual de borrar cuenta, que pide la contraseña.' }
    ],
    'salir-puntos': [{ d: '#dialogo', m: '#dialogo', t: 'El contenido es el de hoy, tal cual: el texto del check y el aviso. El botón pasa de CONFIRMAR a «Confirmar», como el popup real de cancelar membresía. Cambia el layout: ahora es una confirmación, en el popup estándar del sitio. Al confirmar, vuelve a la lista con la fila en «No estás adherido» y «Unirme», sin mensaje final.' }],
    'cancelar-membresia': [{ d: '#dialogo', m: '#dialogo', t: 'Al confirmar, vuelve a la lista y la membresía ya no está, como hace hoy el código, sin mensaje final. <i>A confirmar:</i> qué confirmación muestra hoy «Cancelar membresía».' }],
    'unirme': [{ d: '#dialogo', m: '#dialogo', t: 'El contenido es el de hoy, tal cual: el título, el texto, documento, país y los dos checks. Lo único que cambia es el layout: en lugar de desplegarse en Información personal, se abre acá, desde «Unirme». Las palabras «bases y condiciones» abren las bases encima del formulario, sin perder lo escrito. Documento y País van uno debajo del otro en todos los anchos. <b>El error va debajo de su campo</b>, que se marca en rojo #C91411, en un lugar reservado para que no mueva el botón. «Unirme» está siempre activo: si falta el documento o aceptar las bases, el aviso aparece junto a eso, sin esperar. Al tocarlo con todo completo, el botón queda esperando y después se cierra. Cada casilla, alineada con la primera línea de su texto. En web el popup queda fijo arriba, el cursor arranca en Documento y Enter envía. <i>Textos nuevos, a confirmar:</i> «Ingresá tu documento.» y «Para unirte, aceptá las bases y condiciones.». Con «Alta: Documento ya asociado» en la barra, el alta abre mostrando el error de hoy, «El documento ya está asociado a otro usuario». <i>A confirmar:</i> si el check de Scotiabank es obligatorio (su texto varía por tienda), si se precarga el documento cuando ya existe y cómo aplica en tiendas con otro proveedor de puntos.' }],
    'desconectar-app': [
      { d: '#dialogo', m: '#dialogo', t: 'Al confirmar, vuelve a la lista y la fila ya no está, sin mensaje final. La app pierde el acceso en el momento, se desvinculan todos sus dispositivos y se pide borrar los datos (pedido de Marcelo): desconectar y borrar son una sola acción. Nivel básico: un mail automático al cliente. El cliente no pierde su propia sesión. <i>A confirmar:</i> quién recibe el pedido de borrar, porque ese mail no se lo avisa al equipo que borra.' }
    ],
    'bases-puntos': [{ d: '#dialogo', m: '#dialogo', t: '<b>Solo el texto de las bases</b>, no la landing de Puntos, que además trae banners, ofertas, video y preguntas frecuentes. Sale del widget de bases de esa landing (WidgetId 1105, tipo TnC, HtmlText), el mismo que muestra wTermsAndConditions. Texto real de la base local. El título del popup es propio, no sale de la landing, y el texto arranca sin su título interno ni párrafos vacíos. Título y «Cerrar» quedan fijos; scrollea solo el texto. En web, el mismo popup del sitio (Tblpopup + Componentpopup).' }],
    'bases-membresia': [{ d: '#dialogo', m: '#dialogo', t: 'El texto sale del widget de bases de la landing indicada en TermsAndConditionsLandingId. Si esa landing no tiene ese widget, se abre como hoy: pestaña nueva en web y navegador en la app. <b>Texto de ejemplo, inventado:</b> ningún grupo de la base local tiene bases cargadas.' }],
    'bases-margarita': [{ d: '#dialogo', m: '#dialogo', t: 'Muestra las bases de la app. <b>Texto de ejemplo, inventado.</b> <i>A confirmar:</i> de dónde sale ese texto, porque hoy se guarda la frase del consentimiento (ExtAppCustomerConsentText), que puede traer solo un enlace. Si solo hay un enlace, se abre afuera. Estaba previsto en la spec: hoy no se guardan las bases que aceptó cada cliente, y habrá que hacerlo.' }],
    'bases-penca': [{ d: '#dialogo', m: '#dialogo', t: 'Muestra las bases de la app. <b>Texto de ejemplo, inventado.</b> <i>A confirmar:</i> de dónde sale ese texto, porque hoy se guarda la frase del consentimiento (ExtAppCustomerConsentText), que puede traer solo un enlace. Si solo hay un enlace, se abre afuera. Estaba previsto en la spec: hoy no se guardan las bases que aceptó cada cliente, y habrá que hacerlo.' }],
    'desvincular-numero': [{ d: '#dialogo', m: '#dialogo', t: 'Sigue en el detalle: la fila sale y el contador de la lista baja, sin mensaje final. Corta el acceso de la app desde ese dispositivo en el momento. Si es el último de la app, la confirmación es la de «Desconectar».' }]
  };
  // Notas de la vista App (solo mobile)
  var NOTAS_APP = {
    menu: [
      { d: null, m: '#app-suscripciones', t: '<b>«Membresías» pasa a llamarse «Suscripciones»</b> (mismo componente, mismo ícono) y se muestra <b>siempre</b>: hoy solo aparece si el cliente tiene algún grupo. «Privacidad» deja de existir: la baja de Puntos va a Suscripciones; «Borrar mi cuenta» y la «Declaración de privacidad», a Mis datos.' },
      { d: null, m: '#app-lapiz', t: 'El lápiz abre «Mis datos», como hoy. Ahí pasa «Borrar mi cuenta».' }
    ],
    suscripciones: [
      { d: null, m: '#app-titulo', t: '<b>Sheets:</b> «Ver bases», «Ver mis datos» y el alta suben desde abajo mientras el fondo se oscurece, y bajan al cerrar. Se cierran con su botón, tocando afuera o arrastrando desde la manija. <b>Lo que descarta</b> (Cerrar, Cancelar) va en ButtonDefaultSecondary: fondo #E8EEF6 y texto #1754A5 (6,32:1); en iOS lleva borde de 1 dip #1754A5 y en Android no. Las confirmaciones siguen siendo alertas nativas.' },
      { d: null, m: '#app-titulo', t: '<b>Lista y detalle</b> (propuesta de Marcelo). La pantalla resume qué tiene el cliente. Las salidas, las fechas de aceptación, las bases y los datos cedidos pasan al detalle de cada servicio, que abre como pantalla propia, con el botón atrás de la app.' },
      { d: null, m: '#app-titulo', t: '<b>Después de confirmar en un detalle:</b> vuelve a la lista con la fila ya actualizada, sin mensajes ni avisos flotantes. Desvincular un dispositivo se queda en el detalle. Una sola espera: el botón del diálogo queda esperando hasta que todo esté actualizado. Si la acción falla, el error aparece dentro del diálogo.' },
      { d: null, m: '#bloque-programas', t: 'Es la pantalla «Membresías» con otro nombre, que suma Puntos y las apps conectadas. Sección 17 bold; fila 16 semibold con detalle 14 regular #5F6062; 44 pt o más de alto. Programas y membresías sin ícono. Cada app, su logo a la izquierda en un recuadro de 36 blanco con borde #E0E0E0; una app sin logo, su inicial en el mismo recuadro. Solo se marca lo que es excepción: una fila listada ya está activa o conectada.' },
      { d: null, m: '#fila-puntos', t: '<b>Programa Puntos</b>, solo en las tiendas con el programa en el perfil. Sin adhesión, la fila no abre nada y «Unirme» abre el alta. Fecha de adhesión: SubscriptionDate de la metadata del cliente (código PPLETE).' },
      { d: null, m: '#membresia-1', t: '<b>Membresías</b>, con «Miembro desde el …» (CustomerGroupCustomerTimeStamp, la fecha de aprobación) en lugar de «Subscripción activa».' },
      { d: null, m: '#membresia-2', t: '<b>Membresía pendiente:</b> sin flecha, porque no tiene acciones; el texto es el de hoy, en verde #008A08.' },
      { d: null, m: '#membresia-3', t: '<b>Membresía con documentos pendientes:</b> el texto de hoy en rojo #C91411, o el propio de la membresía si lo tiene. «Ver documentos» va debajo del texto y abre la pantalla de documentos de hoy. Sin flecha, como el pendiente. <i>A confirmar:</i> que la app reciba el mismo texto que la web; en la app lo manda el backend.' },
      { d: null, m: '#sus-vacio', t: '<b>Sin nada para mostrar:</b> un único aviso; las secciones sin contenido no aparecen.' },
      { d: null, m: '#app-margarita', t: '<b>Aplicaciones conectadas</b> (nuevo): logo, nombre y, en una sola línea, el último acceso (<i>a confirmar con Lali</i> de qué dato sale). Los dispositivos van en el detalle. El logo sale de ExtAppLogoUrl y el nombre, de ExtAppDisplayName o, si está vacío, de ExtAppName, como en la pantalla de consentimiento. Margarita trae su logo, cargado en el script de datos; la Penca, sin logo, muestra su inicial.' }
    ],
    'detalle-puntos': [
      { d: null, m: '#ficha-puntos', t: 'Detalle: pantalla propia. La barra dice qué tipo de servicio es («Aplicación conectada», «Programa de puntos», «Membresía»); la cabecera lleva el nombre de 20 bold; en una app, con su logo en un recuadro de 56. En Puntos no hay cabecera: la barra ya dice «Programa de puntos» y el nombre lo repetiría. El detalle tiene lo que la fila no dice: en Puntos, el saldo y cuánto vale en pesos, primero, y después la adhesión. Una sola ficha con borde #E0E0E0 y una sección por tema; la salida va debajo, fuera de la ficha. Los títulos de sección no llevan ícono.' },
      { d: null, m: '#salir-puntos', t: '«Salir del programa» reemplaza a la opción «Deseo darme de baja del Programa Puntos de Tienda Inglesa» + «Aceptar» de Privacidad. <b>Salidas:</b> en su propia tarjeta blanca debajo de la ficha (borde #E0E0E0, radio 10), como las acciones destructivas de los ajustes de iOS. Texto rojo #C91411, 16 regular, alineado con el contenido de la ficha (16 pt desde el borde); toda la fila se toca, con 48 pt de alto. Separada de la ficha para no mezclar la acción destructiva con la información.' },
      { d: null, m: '#ver-bases', t: '<b>Ver bases</b> abre una hoja, sin salir del detalle.' }
    ],
    'detalle-membresia': [
      { d: null, m: '#ficha-membresia', t: 'Detalle de una membresía activa: una sección «Tu membresía» con el beneficio primero y después la fecha de aprobación. <b>Beneficio</b>: el texto de la membresía (SummaryMsg de su metadata; el del prototipo es de ejemplo). Es corto: el resumen de compra lo corta en 45 caracteres en web y 36 en la app (MAX_STRING_SUMMARY y MAX_STRING_SUMMARY_SD). En el detalle va entero, sin ese corte. Va antes que la cancelación porque cancelar quita ese beneficio. Si la membresía no tiene ese texto, el bloque no aparece. Es el mismo texto de la línea de descuento del resumen de compra; sus variables, como [[EmployeeId]], se resuelven como ahí (GetCustomerSummaryDiscountInfo). <i>A confirmar:</i> hoy ninguna membresía de los datos de prueba tiene ese texto; falta decidir si se reusa o si el detalle lleva un texto propio. Al final, el enlace a las bases. <i>A confirmar:</i> hoy no se guarda qué versión aceptó cada cliente; hasta que se guarde, muestra las bases vigentes.' },
      { d: null, m: '#cancelar-membresia', t: 'Al confirmar, vuelve a la lista y la fila ya no está.' }
    ],
    'detalle-margarita': [
      { d: null, m: '#ficha-margarita .SusFichaCab', t: '<b>Logo y nombre</b>, los mismos que muestra hoy la pantalla de consentimiento (GetConsentInfo). Logo: ExtAppLogoUrl, una URL pública a una imagen cuadrada, transparente o con fondo propio, que se muestra contenida en el recuadro (30 px en la lista, 46 en el detalle). El de Margarita se carga en el script de datos (data_for_tests, ExecList/12_ExtApp.sql, filas de Agent-Hub Trunk). Sin ExtAppLogoUrl va la inicial del nombre. Nombre: ExtAppDisplayName y, si está vacío, ExtAppName; en la base local todas las apps tienen ExtAppDisplayName vacío.' },
      { d: null, m: '#conexion-margarita', t: '<b>Conectada el</b>: la fecha del consentimiento: tabla CustomerExtAppConsent, campo ExtAppCustomerConsentDateTime. La tabla existe en la KB y en staging; en la base local todavía no.' },
      { d: null, m: '#ultimo-margarita', t: '<b>Último acceso</b>, pedido de Lali. Hoy no hay un dato por app: ExtAppCustomer no guarda fechas, y la sesión que recibe la app es la del cliente, así que su último acceso no es el de la app. OIDCCode guarda cada inicio de sesión con su fecha; <i>a confirmar</i> si registra también las renovaciones del token. Hay que armarlo, como ya estaba previsto. <i>A confirmar con Lali</i>.' },
      { d: null, m: '#datos-margarita', t: '<b>Datos que le cediste:</b> una sección del detalle, no una hoja. Los datos que el cliente le cedió a la app, con su valor. Cada fila sale solo si la app tiene ese permiso: profile (Nombre), email (Email), phone (Celular), identity (Documento, País de emisión y Fecha de nacimiento). Origen de cada valor, el mismo que recibe la app en su token (OIDTokenExchange): Nombre = CustomerName y CustomerLastName; Email = CustomerMail; Celular = CustomerCellPhone, salvo que el proceso del token devuelva otro número; Documento = CustomerDocumentNumber; País de emisión = el país del documento; Fecha de nacimiento = CustomerBirthday. Los permisos son los que se concedieron en la conexión (OIDCCodeScopesJson) y, si están vacíos, los de la app (ExtAppAllowScopesJson). Margarita muestra solo Nombre y Email, porque en la base local el cliente del hub (Agent-Hub Trunk) tiene profile y email. <i>A confirmar:</i> sus permisos en producción. Los dispositivos vinculados no van acá: no los entrega ningún permiso y ya están en el detalle. Lo que la app genera después, como las conversaciones, no se le muestra al cliente.' },
      { d: null, m: '#numeros-margarita', t: 'Dispositivos vinculados (pedido de Lali), hoy solo en las apps con PAR activo (ExtAppRequirePar), con «Desvincular» cada uno. Si no queda ninguno, el bloque no aparece. Hoy el único dispositivo es el número de WhatsApp. <i>A confirmar:</i> cuando la app y la web pidan consentimiento, se suman como filas; hoy ese consentimiento es una sola fila por cliente y app, sin dato de dispositivo.' }
    ],
    'detalle-penca': [
      { d: null, m: '#ficha-penca', t: 'Una app sin dispositivos vinculados: el bloque no aparece.' }
    ],
    'mis-datos': [
      { d: null, m: '#app-form', t: 'La edición de «Mis datos» no cambia.' },
      { d: null, m: '#sus-cuenta', t: '<b>Borrar tu cuenta</b> pasa acá desde Privacidad (hoy: opción «Deseo cancelar mi cuenta de Tienda Inglesa» + «Aceptar»). Al final de la pantalla, como en los ajustes de iOS: una fila en su propia tarjeta, con el texto rojo #C91411 de 16 regular alineado con los campos del formulario y toda la fila tocable (48 pt). Debajo, en gris de 13, qué se pierde. Sin título: la fila ya lo dice. Sigue a la pantalla actual de borrar cuenta, que pide la contraseña.' },
      { d: null, m: '#app-privacidad', t: '<b>Declaración de privacidad</b>, una fila en su propia tarjeta, antes de Borrar mi cuenta: enlace azul #1754A5 de 16 regular, como «Ver bases y condiciones». Viene desde Privacidad: al desaparecer ese panel, este es su único acceso en la app. Solo se muestra si la tienda la tiene configurada (PrivacyPagesConfiguration.Privacy mayor que 0) y abre la misma landing de hoy. En el prototipo se ve siempre. En la web sigue en el pie del sitio.' }
    ],
    'salir-puntos': [{ d: null, m: '#dialogo', t: 'El contenido es el de hoy: la opción «Deseo darme de baja del Programa Puntos de Tienda Inglesa» y «Aceptar». Cambia solo el layout: ahora es una alerta nativa de iOS. <i>A confirmar:</i> que el aviso de la app sea este mismo texto, porque en la app sale de un parámetro.' }],
    'cancelar-membresia': [{ d: null, m: '#dialogo', t: 'Al confirmar, vuelve a la lista y la membresía ya no está, sin mensaje final. <i>A confirmar:</i> qué confirmación muestra hoy «Cancelar membresía» en la app.' }],
    'unirme': [{ d: null, m: '#dialogo', t: 'El contenido es el de hoy, tal cual: el título, el texto, documento, país y los dos checks. Lo único que cambia es el layout: en lugar de desplegarse en Información personal, se abre acá, desde «Unirme». Las palabras «bases y condiciones» abren las bases encima del formulario, sin perder lo escrito. <b>El error va debajo de su campo</b>, que se marca con el borde rojo #C91411, en un lugar reservado para que no mueva el botón. «Unirme» está siempre activo: si falta el documento o aceptar las bases, el aviso aparece junto a eso. Al tocarlo con todo completo, el botón queda esperando. Cada casilla, alineada con la primera línea de su texto. <i>Textos nuevos, a confirmar:</i> «Ingresá tu documento.» y «Para unirte, aceptá las bases y condiciones.». Con «Alta: Documento ya asociado» en la barra, el alta abre mostrando el error de hoy, «El documento ya está asociado a otro usuario». <i>A confirmar:</i> si el check de Scotiabank es obligatorio (su texto varía por tienda), si se precarga el documento cuando ya existe y cómo aplica en tiendas con otro proveedor de puntos. En la app es una hoja, porque una alerta de iOS no admite un check.' }],
    'desconectar-app': [{ d: null, m: '#dialogo', t: 'Al confirmar, vuelve a la lista y la fila ya no está, sin mensaje final. La app pierde el acceso en el momento, se desvinculan sus dispositivos y se pide borrar los datos (pedido de Marcelo): desconectar y borrar son una sola acción. Nivel básico: un mail automático al cliente. <i>A confirmar:</i> quién recibe el pedido de borrar, porque ese mail no se lo avisa al equipo que borra.' }],
    'bases-puntos': [{ d: null, m: '#dialogo', t: '<b>Solo el texto de las bases</b>, no la landing de Puntos, que además trae banners, ofertas, video y preguntas frecuentes. Sale del widget de bases de esa landing (WidgetId 1105, tipo TnC, HtmlText), el mismo que muestra wTermsAndConditions. Texto real de la base local. El título del popup es propio, no sale de la landing, y el texto arranca sin su título interno ni párrafos vacíos. Título y «Cerrar» quedan fijos; scrollea solo el texto. En la app es una llamada Popup de tamaño Large; el panel de bases de cupones (sdInfoPopup) hoy muestra texto plano y este texto es HTML.' }],
    'bases-membresia': [{ d: null, m: '#dialogo', t: 'El texto sale del widget de bases de la landing indicada en TermsAndConditionsLandingId. Si esa landing no tiene ese widget, se abre como hoy: pestaña nueva en web y navegador en la app. <b>Texto de ejemplo, inventado:</b> ningún grupo de la base local tiene bases cargadas.' }],
    'bases-margarita': [{ d: null, m: '#dialogo', t: 'Muestra las bases de la app. <b>Texto de ejemplo, inventado.</b> <i>A confirmar:</i> de dónde sale ese texto, porque hoy se guarda la frase del consentimiento (ExtAppCustomerConsentText), que puede traer solo un enlace. Si solo hay un enlace, se abre afuera. Estaba previsto en la spec: hoy no se guardan las bases que aceptó cada cliente, y habrá que hacerlo.' }],
    'bases-penca': [{ d: null, m: '#dialogo', t: 'Muestra las bases de la app. <b>Texto de ejemplo, inventado.</b> <i>A confirmar:</i> de dónde sale ese texto, porque hoy se guarda la frase del consentimiento (ExtAppCustomerConsentText), que puede traer solo un enlace. Si solo hay un enlace, se abre afuera. Estaba previsto en la spec: hoy no se guardan las bases que aceptó cada cliente, y habrá que hacerlo.' }],
    'desvincular-numero': [{ d: null, m: '#dialogo', t: 'Sigue en el detalle: la fila sale y el contador de la lista baja, sin mensaje final. Corta el acceso desde ese dispositivo en el momento. Si es el último, es «Desconectar».' }]
  };
  NOTAS['desconectar-penca'] = NOTAS['desconectar-app'];
  NOTAS_APP['desconectar-penca'] = NOTAS_APP['desconectar-app'];
  Object.keys(NOTAS_APP).forEach(function (k) { NOTAS['app-' + k] = NOTAS_APP[k]; });

  function claveNotas(e) { return (e.plataforma === 'app' ? 'app-' : '') + (dlg || (detalle && e.paso === 'suscripciones' ? 'detalle-' + detalle : e.paso)); }

  // ---------------------------------------------------------------- configuración
  P.iniciar({
    titulo: 'Suscripciones',
    clave: 'suscripciones',
    vistaInicial: 'desktop',
    desktop: { anchoContenido: 1200 },
    mobile: { ancho: 390 },
    estilos: ['css/prototipo.css'],
    controles: [
      { id: 'plataforma', nombre: 'Plataforma', opciones: [['web', 'Web'], ['app', 'App', function (e) { return e.vista === 'mobile'; }]] },
      { id: 'paso', nombre: 'Paso', reiniciaScroll: true, opciones: [
        ['menu', 'Mis Datos (menú)', function (e) { return e.plataforma === 'app'; }],
        ['suscripciones', 'Suscripciones'],
        ['mis-datos', 'Mis datos']
      ] },
      { id: 'puntos', nombre: 'Puntos', opciones: [['adherido', 'Adherido'], ['no', 'No adherido'], ['sinprograma', 'Tienda sin programa']], mostrar: enLista },
      { id: 'alta', nombre: 'Alta', opciones: [['vacia', 'Vacía'], ['asociado', 'Documento ya asociado']], mostrar: function (e) { return popupAbierto(e) && dlg === 'unirme'; } }, // solo con el alta abierta: es lo único que cambia
      { id: 'membresias', nombre: 'Membresías', opciones: [['con', 'Con membresías'], ['sin', 'Sin membresías']], mostrar: enLista },
      { id: 'apps', nombre: 'Apps', opciones: [['con', 'Con apps'], ['sin', 'Sin apps']], mostrar: enLista }
    ],
    pantalla: pantalla,
    claveNotas: claveNotas,
    notas: NOTAS
  });
})();
