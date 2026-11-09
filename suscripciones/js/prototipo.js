/*
 * Suscripciones, sobre las pantallas REALES de «Mis datos» de trunk (pantallas/*.js, generadas por
 * herramientas/capturar-trunk.mjs con estilos e imágenes del sitio en sitio/): una sola pestaña con todo lo que el
 * cliente tiene activo (Programa Puntos, membresías y apps conectadas), cada cosa con su fecha y su salida. «Borrar mi
 * cuenta» pasa a Información personal y la pestaña «Preferencias» desaparece.
 * Lo existente se reutiliza con sus clases del sitio; lo nuevo está en css/prototipo.css. Datos de ejemplo inventados.
 */
(function () {
  'use strict';
  var P = window.Prototipo, tocable = P.tocable, PANT = window.PANTALLAS;

  // ---------------------------------------------------------------- datos de ejemplo
  var PUNTOS = { desde: '12/03/2021', documento: '1.234.567-8', pais: 'Uruguay' };
  var DESDE = ['05/05/2022', '18/06/2026']; // membresías: en el orden en que las muestra el sitio
  var APPS = [
    { id: 'margarita', nombre: 'Margarita', conectada: '21/10/2026', ultimo: 'Hace 2 días',
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
  function abrir(nombre) { return function () { dlg = nombre; P.render(); }; }
  function cerrar() { dlg = null; P.render(); }
  function nuevo(doc, tag, attrs, html) {
    var n = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === 'class') n.className = attrs[k]; else n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }
  function q(raiz, sel) { return raiz.querySelector(sel); }
  function aviso(titulo, texto) { return function () { P.aviso(titulo, texto, [['Cerrar', null]]); }; }

  // Tarjeta del sitio (la de cada membresía) clonada para otro contenido: mismo componente, otros textos.
  function tarjeta(doc, molde, o) {
    var t = molde.cloneNode(true);
    t.querySelectorAll('[id]').forEach(function (e) { e.removeAttribute('id'); });
    t.id = o.id;
    q(t, '.wTxtRegularTitle').textContent = o.nombre;
    q(t, '.wTxtDescriptionGray3').innerHTML = o.descripcion;
    var b = q(t, '.wButtonCancelMembership');
    b.value = o.boton; b.title = o.boton;
    b.className = o.claseBoton ? o.claseBoton + ' btn btn-default' : 'SusAccion'; // salidas: acción de texto; «Unirme»: botón
    if (o.idBoton) b.id = o.idBoton;
    if (!o.estrella) { var img = q(t, '.ImageStarApprobedGroup'); if (img) img.closest('td').remove(); }
    if (o.gris) { t.classList.remove('wTblBorderGold'); t.classList.add('wTblBorderRadius'); }
    return t;
  }

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
    if (activa !== 'suscripciones') tocable(doc.getElementById('TBLMYGROUPS'), 'Suscripciones', ir('suscripciones'));
    var pop = doc.getElementById('TBLPOPUP'); if (pop) pop.style.display = 'none';
  }
  // Íconos que el sitio pasa como variable CSS en un style en línea: la hoja que los usa resolvería la ruta relativa
  // desde su propia carpeta. Con la ruta completa cargan desde cualquier hoja (se cambia antes de dibujar la pantalla).
  function rutasCompletas(html) {
    return html.replace(/url\((&quot;|["']?)(sitio\/[^)"'&]+)(&quot;|["']?)\)/g, function (m, a, ruta) {
      return 'url(&quot;' + new URL(ruta, document.baseURI).href + '&quot;)';
    });
  }

  // ---------------------------------------------------------------- Suscripciones (sobre Membresías)
  function suscripciones(doc, estado) {
    // Sin el título de la página real: repetía el nombre de la pestaña.
    doc.getElementById('W0175TABLE1').remove();
    var docs = doc.getElementById('W0175TABLEDOCUMENTS');
    var filas = docs.querySelectorAll('[id^="W0175Grid1ContainerRow_"]');
    var molde = q(filas[0], '.wTblBorderGold').cloneNode(true); // copia sin tocar: las membresías se modifican abajo
    var gris = true; // todas las tarjetas con borde gris (wTblBorderRadius); la estrella dorada marca la membresía activa
    var contenedor = docs.parentNode; // col-xs-12 donde está la grilla de membresías
    var bloques = nuevo(doc, 'div', { id: 'sus-bloques' });
    contenedor.insertBefore(bloques, docs);

    // Programa Puntos
    if (estado.puntos !== 'sinprograma') {
      var bp = nuevo(doc, 'div', { class: 'SusBloque', id: 'bloque-puntos' }, '<span class="wTxtRegularTitle16">Programa Puntos</span>');
      var adherido = estado.puntos === 'adherido';
      var tp = tarjeta(doc, molde, adherido
        ? { id: 'tarjeta-puntos', nombre: 'Adherido', descripcion: 'Desde el ' + (hecho.desde || PUNTOS.desde) + ' · <button type="button" class="SusEnlace" id="ver-bases">Ver bases</button>', boton: 'Salir del programa', idBoton: 'salir-puntos', gris: gris }
        : { id: 'tarjeta-puntos', nombre: 'No estás adherido', descripcion: '', boton: 'Unirme', claseBoton: 'wButtonActionDefualt', idBoton: 'unirme', gris: gris });
      // adherido: documento y país, de solo lectura como hoy, ya no en Información personal
      if (adherido) q(tp, '.TxtMarginLeft15').appendChild(nuevo(doc, 'dl', { class: 'SusDetalle', id: 'detalle-puntos' }, '<dt>Documento</dt><dd>' + PUNTOS.documento + ' · ' + PUNTOS.pais + '</dd>'));
      bp.appendChild(tp);
      bloques.appendChild(bp);
      if (adherido) {
        tocable(q(tp, '#salir-puntos'), 'Salir del Programa Puntos', abrir('salir-puntos'));
        tocable(q(tp, '#ver-bases'), 'Ver bases', abrir('bases-puntos'));
      } else tocable(q(tp, '#unirme'), 'Unirme al Programa Puntos', abrir('unirme'));
    }

    // Membresías: la grilla real, con la fecha en lugar de «Subscripción activa»
    // (una sección sin contenido no aparece)
    if (estado.membresias === 'sin') docs.remove();
    else {
      var bm = nuevo(doc, 'div', { class: 'SusBloque', id: 'bloque-membresias' }, '<span class="wTxtRegularTitle16">Membresías</span>');
      bloques.appendChild(bm);
      bm.appendChild(docs);
      Array.prototype.forEach.call(filas, function (f, i) {
        if (i === 0 && hecho.sinMembresia) { f.remove(); return; }
        var c = q(f, '.wTblBorderGold'); c.id = 'membresia-' + (i + 1);
        c.classList.remove('wTblBorderGold'); c.classList.add('wTblBorderRadius'); // borde gris; la estrella marca que está activa
        // La estrella va junto al nombre: es un dato de la membresía. Sin su celda, la acción se alinea con las de los otros bloques.
        var est = q(c, '.ImageStarApprobedGroup'), celda = est.closest('td');
        if (i === 1) { // pendiente, como hoy: sin estrella, sin fecha y sin cancelar
          celda.remove();
          var pend = q(c, '.wTxtDescriptionGray3'); pend.className = 'wTxtRegularGreenGroups'; pend.textContent = 'Su solicitud sera procesada a la brevedad.';
          q(c, '.wButtonCancelMembership').closest('td').remove();
          return;
        }
        est.className = 'SusEstrella'; est.removeAttribute('id'); est.alt = 'Membresía activa'; est.title = 'Membresía activa';
        q(c, '.wTxtRegularTitle').appendChild(est);
        celda.remove();
        q(c, '.wTxtDescriptionGray3').innerHTML = 'Miembro desde el ' + (DESDE[i] || DESDE[0]) + ' · <button type="button" class="SusEnlace" id="ver-bases-membresia-' + (i + 1) + '">Ver bases</button>';
        tocable(q(c, '#ver-bases-membresia-' + (i + 1)), 'Ver bases', abrir('bases-membresia'));
        var b = q(c, '.wButtonCancelMembership'); b.className = 'SusAccion';
        if (i === 0) { b.id = 'cancelar-membresia'; tocable(b, 'Cancelar membresía', abrir('cancelar-membresia')); }
      });
    }

    // Apps conectadas
    if (estado.apps !== 'sin') {
      var ba = nuevo(doc, 'div', { class: 'SusBloque', id: 'bloque-apps' }, '<span class="wTxtRegularTitle16">Apps conectadas</span>');
      bloques.appendChild(ba);
      appsVisibles().forEach(function (a) {
        var t = tarjeta(doc, molde, { id: 'app-' + a.id, nombre: a.nombre, descripcion: 'Conectada el ' + a.conectada + ' · <button type="button" class="SusEnlace" id="ver-bases-' + a.id + '">Ver bases</button>', boton: 'Desconectar', idBoton: 'desconectar-' + a.id, gris: gris });
        tocable(q(t, '#ver-bases-' + a.id), 'Ver bases', abrir('bases-' + a.id));
        q(t, '.TxtMarginLeft15').appendChild(nuevo(doc, 'dl', { class: 'SusDetalle', id: 'detalle-' + a.id },
          '<dt>Último acceso</dt><dd id="ultimo-' + a.id + '">' + a.ultimo + '</dd>' +
          '<dt>Tus datos</dt><dd><button type="button" class="SusEnlace" id="ver-datos-' + a.id + '">Ver mis datos</button></dd>'));
        if (numerosDe(a).length) {
          var n = nuevo(doc, 'div', { class: 'SusNumeros', id: 'numeros-' + a.id }, '<span class="SusNumerosTitulo">Dispositivos vinculados</span>');
          numerosDe(a).forEach(function (x, i) {
            var fila = nuevo(doc, 'div', { class: 'SusNumero' }, '<span>' + x[0] + '<small>Vinculado el ' + x[1] + '</small></span>');
            var dv = nuevo(doc, 'button', { type: 'button', class: 'SusAccion', id: 'desvincular-' + (i + 1) }, 'Desvincular');
            if (i === 0 && !hecho.sinNumero) tocable(dv, 'Desvincular el dispositivo', abrir('desvincular-numero')); // el diálogo habla del primer número
            fila.appendChild(dv); n.appendChild(fila);
          });
          t.appendChild(n);
        }
        if (a.id === 'margarita') {
          tocable(q(t, '#desconectar-margarita'), 'Desconectar Margarita', abrir('desconectar-app'));
          tocable(q(t, '#ver-datos-margarita'), 'Ver mis datos', abrir('ver-datos'));
        }
        ba.appendChild(t);
      });
    }

    // Sin programa de Puntos, sin membresías y sin apps: un único aviso, para no dejar la pantalla en blanco
    if (!bloques.children.length) bloques.appendChild(nuevo(doc, 'div', { class: 'SusVacio', id: 'sus-vacio' },
      GLIFO_ESTRELLA + '<div><span class="SusVacioTitulo">Aún no tenés suscripciones.</span><span class="wTxtDescriptionGray3">Cuando te sumes a una membresía o conectes una app, la vas a ver acá.</span></div>'));

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
    'ver-datos': { titulo: 'Tus datos en Margarita', texto: 'Estos son los datos que le cediste al conectarla.',
      datos: [['Nombre', 'Ana Pérez'], ['Email', 'ana.perez@ejemplo.com']] },
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
  function basesDialogo(d) { return '<div class="SusBases" id="dialogo-bases">' + d.bases.replace(/<p>(\s|&nbsp;|<br>)*<\/p>/g, '').replace(/^\s*<p><strong>[^<]*<\/strong><\/p>/, '') + '</div>'; }
  function enlacesBases(doc) {
    doc.querySelectorAll('#dialogo-bases a').forEach(function (e) { tocable(e, 'Abrir el enlace', aviso('Enlace externo', 'Abre ' + e.getAttribute('href') + ' en otra pestaña (web) o en el navegador (app).')); });
  }
  // detalle «Ver mis datos»: los datos cedidos a la app, con su valor
  function datosDialogo(d) {
    return '<dl class="SusDatos" id="dialogo-datos">' + d.datos.map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + x[1] + '</dd>'; }).join('') + '</dl>';
  }
  // alta: el formulario entero vive acá, con los textos de hoy. «Unirme» se habilita con el documento y las bases aceptadas.
  function formAlta(d, claseEnlace) {
    return '<div class="SusAlta" id="dialogo-alta"><div class="SusCampos">' +
      '<div class="SusCampo"><label for="dialogo-documento">Documento</label><input type="text" id="dialogo-documento" class="form-control" inputmode="numeric" placeholder="Sin puntos ni guiones" autocomplete="off"></div>' +
      '<div class="SusCampo"><label for="dialogo-pais">País de emisión</label><select id="dialogo-pais" class="form-control">' + d.paises.map(function (p) { return '<option>' + p + '</option>'; }).join('') + '</select></div></div><div class="SusErrorSlot" id="dialogo-error-slot"></div>' +
      '<label class="SusOpcion"><input type="checkbox" id="dialogo-opcion"><span>' + d.acepto.replace('bases y condiciones', '<button type="button" class="' + claseEnlace + ' SusEnlaceTexto" id="dialogo-ver-bases">bases y condiciones</button>') + '</span></label>' +
      '<label class="SusOpcion SusLegal" id="dialogo-banco-fila"><input type="checkbox" id="dialogo-banco"><span>' + d.legal + '</span></label></div>';
  }
  function activarAlta(doc) {
    var op = doc.getElementById('dialogo-opcion'), ac = doc.getElementById('dialogo-accion'), nu = doc.getElementById('dialogo-documento');
    function revisar() { ac.disabled = !(op.checked && nu.value.trim()); }
    op.addEventListener('change', revisar);
    nu.addEventListener('input', revisar);
  }
  function appsVisibles() { return APPS.filter(function (a) { return a.id !== hecho.sinApp; }); }
  function numerosDe(a) { return hecho.sinNumero ? a.numeros.slice(1) : a.numeros; }
  // la tarjeta actualizada es la confirmación: sin mensaje aparte
  function basesSobreAlta(doc, enApp) {
    var d = DIALOGOS['bases-puntos'], v;
    if (enApp) {
      v = nuevo(doc, 'div', { class: 'alerta-velo hoja', id: 'dialogo-sobre' }, '<div class="hoja-app hoja-bases" role="dialog"><h2>' + d.titulo + '</h2>' + basesDialogo(d) + '<button type="button" class="btn-primario" id="dialogo-sobre-cerrar">Cerrar</button></div>');
      doc.querySelector('.alerta-velo').parentNode.appendChild(v);
    } else {
      v = nuevo(doc, 'div', { class: 'PopupContainer SusDialogo SusDialogoBases', id: 'dialogo-sobre' }, '<div class="TableRoundedShadow" role="dialog"><span class="wTxtRegularTitle">' + d.titulo + '</span>' + basesDialogo(d) + '<div class="SusBotones"><input type="button" id="dialogo-sobre-cerrar" class="wButtonActionDefualt btn btn-default" value="Cerrar"></div></div>');
      doc.body.appendChild(v);
    }
    enlacesBases(doc);
    tocable(doc.getElementById('dialogo-sobre-cerrar'), 'Cerrar', function () { v.remove(); });
  }
  function terminar(doc, paso) {
    if (paso === 'unirme' && doc.getElementById('dialogo-documento').value.trim() === '12345678') {
      doc.getElementById('dialogo-documento').classList.add('SusCampoError');
      doc.getElementById('dialogo-error-slot').innerHTML = '<span class="SusError" id="dialogo-error">El documento ya está asociado a otro usuario</span>';
      return;
    }
    if (paso === 'salir-puntos') hecho.puntos = 'no';
    if (paso === 'unirme') { hecho.puntos = 'adherido'; hecho.desde = HOY; }
    if (paso === 'cancelar-membresia') hecho.sinMembresia = true;
    if (paso === 'desconectar-app') hecho.sinApp = 'margarita';
    if (paso === 'desvincular-numero') hecho.sinNumero = true;
    dlg = null; P.render();
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
        ? '<div class="SusBotones"><input type="button" id="dialogo-cancelar" class="wButtonActionDefualt btn btn-default" value="Cerrar"></div></div>'
        : '<div class="SusBotones"><input type="button" id="dialogo-cancelar" class="ButtonCancel btn btn-default" value="' + (d.cancelar || 'Cancelar') + '">' +
          '<input type="button" id="dialogo-accion" class="' + (d.alta ? 'wButtonActionDefualt' : 'wButtonActionRed') + ' btn btn-default" value="' + d.accion + '"' + (d.alta ? ' disabled' : '') + '></div></div>'));
    doc.body.appendChild(v);
    tocable(doc.getElementById('dialogo-cancelar'), d.datos || d.bases ? 'Cerrar' : 'Cerrar sin cambios', cerrar);
    if (d.bases) enlacesBases(doc);
    if (d.datos || d.bases) return;
    if (d.alta) {
      activarAlta(doc);
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
    return '<div class="card grupo' + (o.gris ? ' gris' : '') + '" id="' + o.id + '"><div class="tit">' + o.titulo + '</div><div class="des">' + o.des + '</div>' +
      (o.estrella ? '<img class="estrella" src="' + ICO('estrella') + '" alt="">' : '') + (o.extra || '') +
      (o.boton ? '<button type="button" class="' + (o.claseBoton || 'accion-app') + '" id="' + o.idBoton + '">' + o.boton + '</button>' : '') + (o.despues || '') + '</div>';
  }
  function suscripcionesApp(estado) {
    var gris = true, h = navApp('Suscripciones', 'volver') + '<div class="contenido-app" style="padding-top:4px">';
    if (estado.puntos !== 'sinprograma') {
      h += '<div class="seccion">Programa Puntos</div>';
      h += estado.puntos === 'adherido'
        ? tarjetaApp({ id: 'bloque-puntos', titulo: 'Adherido', des: 'Desde el ' + (hecho.desde || PUNTOS.desde) + ' · <button type="button" class="lnk" id="ver-bases">Ver bases</button>', extra: '<dl class="detalle" id="detalle-puntos"><dt>Documento</dt><dd>' + PUNTOS.documento + ' · ' + PUNTOS.pais + '</dd></dl>', boton: 'Salir del programa', idBoton: 'salir-puntos', gris: gris })
        : tarjetaApp({ id: 'bloque-puntos', titulo: 'No estás adherido', des: '', boton: 'Unirme', idBoton: 'unirme', claseBoton: 'btn-primario', gris: gris });
    }
    // una sección sin contenido no aparece
    var vacioM = estado.membresias === 'sin', vacioA = estado.apps === 'sin';
    var bm = vacioM ? '' : '<div class="seccion" id="bloque-membresias">Membresías</div>';
    if (!vacioM) ['Socio Acelu', 'Club del Vino'].forEach(function (g, i) {
      if (i === 0 && hecho.sinMembresia) return;
      if (i === 1) { bm += tarjetaApp({ id: 'membresia-2', titulo: g, des: '<span class="pendiente-app">Su solicitud sera procesada a la brevedad.</span>', gris: gris }); return; } // pendiente: sin estrella, sin fecha y sin cancelar
      bm += tarjetaApp({ id: 'membresia-' + (i + 1), titulo: g, des: 'Miembro desde el ' + DESDE[i] + ' · <button type="button" class="lnk" id="ver-bases-membresia-' + (i + 1) + '">Ver bases</button>', estrella: true, gris: gris, boton: 'Cancelar membresía', idBoton: i === 0 ? 'cancelar-membresia' : 'cancelar-2' });
    });
    var ba = vacioA ? '' : '<div class="seccion" id="bloque-apps">Apps conectadas</div>';
    if (!vacioA) appsVisibles().forEach(function (a) {
      var nums = numerosDe(a).length ? '<div class="numeros-app" id="numeros-' + a.id + '"><div class="rot">Dispositivos vinculados</div>' +
        numerosDe(a).map(function (x, i) { return '<div class="num"><span>' + x[0] + '<small>Vinculado el ' + x[1] + '</small></span><button type="button" class="accion-app" id="desvincular-' + (i + 1) + '">Desvincular</button></div>'; }).join('') + '</div>' : '';
      ba += tarjetaApp({ id: 'app-' + a.id, titulo: a.nombre, des: 'Conectada el ' + a.conectada + ' · <button type="button" class="lnk" id="ver-bases-' + a.id + '">Ver bases</button>', gris: gris, boton: 'Desconectar', idBoton: 'desconectar-' + a.id,
        extra: '<dl class="detalle"><dt>Último acceso</dt><dd id="ultimo-' + a.id + '">' + a.ultimo + '</dd><dt>Tus datos</dt><dd><button type="button" class="lnk" id="ver-datos-' + a.id + '">Ver mis datos</button></dd></dl>', despues: nums }); // «Desconectar» es de la app: va antes de sus dispositivos
    });
    h += bm + ba; // orden fijo: Puntos, Membresías, Apps
    // sin nada para mostrar: un único aviso
    if (estado.puntos === 'sinprograma' && vacioM && vacioA) h += '<div class="card vacio-app" id="sus-vacio">' + GLIFO_ESTRELLA + '<div><div class="t">Aún no tenés suscripciones.</div><div class="s">Cuando te sumes a una membresía o conectes una app, la vas a ver acá.</div></div></div>';
    h += '</div>';
    return h;
  }
  function campoApp(rot, val, ph, chev) { return '<div class="campo-app"><label>' + rot + '</label><div' + (ph ? ' class="ph"' : '') + '>' + val + '</div>' + (chev ? CHEV : '') + '</div>'; }
  function misDatosApp() {
    return navApp('Mis datos', 'volver', 'Aceptar') + '<div class="contenido-app" style="padding-top:5px">' +
      '<div class="card form-app" id="app-form">' + campoApp('Nombre', 'Ana') + campoApp('Apellido', 'Pérez') + campoApp('e-mail', 'ana.perez@ejemplo.com') +
      campoApp('Sexo', '', false, true) + campoApp('Fecha de nacimiento', 'Fecha de nacimiento', true) + campoApp('Celular', 'Celular', true) + '</div>' +
      '<div class="card cuenta-app" id="sus-cuenta"><div class="tit">Borrar tu cuenta</div><div class="des">Se borran tus datos, tus puntos, tus membresías y las apps conectadas. No se puede deshacer.</div>' +
      '<button type="button" class="accion-app" id="borrar-cuenta">Borrar mi cuenta</button></div>' +
      '<button type="button" class="lnk privacidad-app" id="app-privacidad">Declaración de privacidad</button></div>';
  }
  function alertaApp(paso) {
    var d = DIALOGOS[paso];
    if (d.datos) return '<div class="alerta-velo hoja"><div class="hoja-app" id="dialogo" role="dialog"><h2>' + d.titulo + '</h2><p>' + d.texto + '</p>' + datosDialogo(d) +
      '<button type="button" class="btn-primario" id="dialogo-cancelar">Cerrar</button></div></div>';
    if (d.bases) return '<div class="alerta-velo hoja"><div class="hoja-app hoja-bases" id="dialogo" role="dialog"><h2>' + d.titulo + '</h2>' + basesDialogo(d) +
      '<button type="button" class="btn-primario" id="dialogo-cancelar">Cerrar</button></div></div>';
    if (d.alta) return '<div class="alerta-velo hoja"><div class="hoja-app" id="dialogo" role="dialog"><h2>' + d.titulo + '</h2><p>' + d.texto + '</p>' + formAlta(d, 'lnk') +
      '<button type="button" class="btn-primario" id="dialogo-accion" disabled>' + d.accion + '</button><button type="button" class="hoja-cancelar" id="dialogo-cancelar">Cancelar</button></div></div>';
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
    if (paso !== 'menu' && !dlg) t('app-volver', 'Volver a Mis Datos', ir('menu'));
    t('salir-puntos', 'Salir del Programa Puntos', abrir('salir-puntos'));
    t('unirme', 'Unirme al Programa Puntos', abrir('unirme'));
    t('ver-bases', 'Ver bases', abrir('bases-puntos'));
    ['membresia-1', 'membresia-2'].forEach(function (m) { t('ver-bases-' + m, 'Ver bases', abrir('bases-membresia')); });
    APPS.forEach(function (a) { t('ver-bases-' + a.id, 'Ver bases', abrir('bases-' + a.id)); });
    t('cancelar-membresia', 'Cancelar membresía', abrir('cancelar-membresia'));
    t('desconectar-margarita', 'Desconectar Margarita', abrir('desconectar-app'));
    t('ver-datos-margarita', 'Ver mis datos', abrir('ver-datos'));
    if (!hecho.sinNumero) t('desvincular-1', 'Desvincular el dispositivo', abrir('desvincular-numero'));
    t('borrar-cuenta', 'Borrar mi cuenta', aviso('Borrar mi cuenta', 'Sigue el flujo actual: la pantalla «Borrar cuenta», que pide la contraseña para confirmar.'));
    t('app-privacidad', 'Declaración de privacidad', aviso('Declaración de privacidad', 'Abre la landing de privacidad de la tienda, como hoy.'));
    if (dlg) {
      t('dialogo-cancelar', DIALOGOS[dlg].datos || DIALOGOS[dlg].bases ? 'Cerrar' : 'Cerrar sin cambios', cerrar);
      if (DIALOGOS[dlg].bases) enlacesBases(doc);
      if (DIALOGOS[dlg].alta) { activarAlta(doc); t('dialogo-ver-bases', 'Ver las bases', function () { basesSobreAlta(doc, true); }); }
      t('dialogo-accion', DIALOGOS[dlg].accion, function () { terminar(doc, dlg); });
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
    if (estado.paso !== ultimoPaso) { dlg = null; ultimoPaso = estado.paso; } // al cambiar de paso se cierra la confirmación
    var clave = [estado.vista, estado.plataforma, estado.paso, estado.puntos, estado.membresias, estado.apps].join('|');
    if (clave !== ultimaClave) { hecho = {}; ultimaClave = clave; }
    if (hecho.puntos) estado = Object.assign({}, estado, { puntos: hecho.puntos });
    if (estado.plataforma === 'app') return pantallaApp(estado);
    var paso = estado.paso, datos = paso === 'mis-datos', base = datos ? PANT.datos : PANT.membresias;
    return {
      cabeza: base.cabeza, html: rutasCompletas(base.cuerpo), claseHtml: base.claseHtml, claseCuerpo: base.claseCuerpo,
      despues: function (doc) {
        pestanas(doc, datos ? 'datos' : 'suscripciones');
        if (datos) misDatos(doc); else suscripciones(doc, estado);
        if (dlg) dialogo(doc, dlg);
      }
    };
  }

  // ---------------------------------------------------------------- notas para desarrollo
  var NOTAS = {
    suscripciones: [
      { d: '#TBLMYGROUPS', m: '#TBLMYGROUPS', t: '<b>Después de confirmar:</b> el diálogo se cierra y la pantalla se actualiza. Ese cambio es la confirmación: sin mensajes ni avisos flotantes. Una sola espera: el botón del diálogo queda esperando hasta que la lista se actualice, sin un segundo indicador. Si la acción falla, el error aparece dentro del diálogo. En web, al abrir un diálogo el foco queda adentro, Escape lo cierra, y al cerrar vuelve al control que lo abrió; las salidas muestran el foco.' },
      { d: '#TBLMYGROUPS', m: '#TBLMYGROUPS', t: '<b>«Membresías» pasa a llamarse «Suscripciones»</b> y suma el Programa Puntos y las apps conectadas. «Preferencias» deja de existir: la baja de Puntos viene acá y «Borrar mi cuenta» va a Información personal.' },
      { d: '#TBLMYGROUPS', m: '#TBLMYGROUPS', t: 'La pestaña se muestra <b>siempre</b>, aunque el cliente no tenga nada: solo aparecen las secciones con contenido y, si no hay ninguna, un único aviso. Hoy «Membresías» depende de una configuración y «Preferencias», de que la tienda muestre el programa de fidelidad en el perfil.' },
      { d: '#bloque-puntos', m: '#bloque-puntos', t: '<b>Programa Puntos.</b> Solo en las tiendas con el programa en el perfil (la misma configuración que hoy muestra «Preferencias»). La tarjeta es la de las membresías. Una sola fecha: en el formulario de hoy, adherirse y aceptar las bases son el mismo acto. Documento y país, de solo lectura como hoy, vienen de Información personal. <i>A confirmar:</i> de qué dato sale; «CustomerPointsDateTime» no sirve, es la última actualización de puntos.' },
      { d: '#salir-puntos', m: '#salir-puntos', t: '«Salir del programa» reemplaza al check «Deseo darme de baja del Programa Puntos de Tienda Inglesa» y al botón CONFIRMAR. <b>Todas las salidas son acciones de texto:</b> rojo #C91411 (5,85:1 sobre blanco; el #ED2F48 de hoy da 4,12:1), 14 px, sin relleno, subrayado solo al pasar el mouse. A la derecha de la fila en desktop y al final de la tarjeta en mobile, con 44 px de alto para tocar. Abre una confirmación con el aviso de hoy; al confirmar hace lo mismo que hoy (aviso a Fidelidad para la baja y el borrado de datos del programa).' },
      { d: '#unirme', m: '#unirme', t: 'Sin adhesión: «Unirme» abre el alta acá mismo, sin ir a Información personal.' },
      { d: '#bloque-membresias', m: '#bloque-membresias', t: '<b>Membresías:</b> la grilla de hoy (solo los grupos de tipo membresía), con cuatro cambios: borde gris #CCC en lugar del dorado; la estrella pasa junto al nombre en desktop y arriba a la derecha en mobile, donde la acción baja y deja libre esa esquina, como en la app (hoy solo la tiene la membresía activa, y con el borde gris es su única marca visual); «Cancelar membresía» como acción de texto, alineada con las demás salidas, y «Miembro desde el …» = fecha en que se aprobó la membresía (cambia solo si cambia la aprobación), en lugar de «Subscripción activa».' },
      { d: '#membresia-2', m: '#membresia-2', t: '<b>Membresía pendiente:</b> sin estrella, sin fecha y sin «Cancelar membresía», con el texto de hoy. Si faltan documentos, el texto de hoy es «Se requieren acciones para resolver tu solicitud», con «Ver documentos».' },
      { d: '#ver-bases-membresia-1', m: '#ver-bases-membresia-1', t: '<b>Ver bases</b> en cada membresía y app: la fecha y las bases de cada caso. Abre un popup en web y una hoja en la app, sin salir de Suscripciones. <i>A confirmar:</i> hoy no se guarda qué versión aceptó cada cliente; hasta que se guarde, muestra las bases vigentes.' },
      { d: '#sus-vacio', m: '#sus-vacio', t: '<b>Sin nada para mostrar</b> (tienda sin programa, sin membresías y sin apps): un único aviso, centrado como los del sitio. Las secciones sin contenido no aparecen, porque un vacío sin acción no ayuda. Membresías sigue en el mismo lugar cuando aparece.' },
      { d: '#bloque-apps', m: '#bloque-apps', t: '<b>Apps conectadas</b> (nuevo). Misma tarjeta con borde gris, una por app: nombre, fecha de conexión, último acceso y acceso a los datos que el cliente le cedió.' },
      { d: '#ver-datos-margarita', m: '#ver-datos-margarita', t: 'Pedido de Marcelo: que el cliente pueda acceder a sus datos guardados. «Ver mis datos» muestra los datos que el cliente le cedió a la app, con su valor.' },
      { d: '#ultimo-margarita', m: '#ultimo-margarita', t: '<b>Último acceso</b>, pedido de Lali, que dice que el dato existe. <i>A confirmar con Lali:</i> de qué dato sale.' },
      { d: '#numeros-margarita', m: '#numeros-margarita', t: '<b>Dispositivos vinculados</b> (pedido de Lali), hoy solo en las apps con PAR activo (ExtAppRequirePar): cada uno con su fecha y «Desvincular». Si no queda ninguno, el bloque no aparece. Hoy el único dispositivo es el número de WhatsApp (CustomerExtAppPhone), por eso la fila dice «WhatsApp» y el número. <i>A confirmar:</i> cuando la app y la web pidan consentimiento, se suman como filas; hoy ese consentimiento es una sola fila por cliente y app, sin dato de dispositivo, así que no se podrían listar ni desvincular por separado.' },
      { d: '#desconectar-margarita', m: '#desconectar-margarita', t: '«Desconectar» corta el acceso de la app <b>en el momento</b>, desvincula todos sus dispositivos y pide borrar los datos. No cierra la sesión del cliente.' }
    ],
    'mis-datos': [
      { d: '#TBLMYDATAACTIONS', m: '#TBLMYDATAACTIONS', t: 'El formulario de Información personal no cambia.' },
      { d: '#sus-cuenta', m: '#sus-cuenta', t: '<b>Borrar mi cuenta</b> pasa acá desde Preferencias, como una zona propia al final: 48 px de aire y una línea de 1 px #E5E5E5 a todo el ancho la separan de Cancelar / Guardar, que siguen cerrando el formulario. Título y una línea que dice qué se pierde; la acción va debajo del texto, porque acá no hay tarjeta que la contenga.' },
      { d: '#borrar-cuenta', m: '#borrar-cuenta', t: 'La misma acción de texto roja que las demás salidas (#C91411, sin relleno): se encuentra, pero no compite con Guardar ni se confunde con Cancelar (hoy es un botón oscuro). Sigue al flujo actual de borrar cuenta, que pide la contraseña.' }
    ],
    'salir-puntos': [{ d: '#dialogo', m: '#dialogo', t: 'El contenido es el de hoy, tal cual: el texto del check y el aviso. El botón pasa de CONFIRMAR a «Confirmar», como el popup real de cancelar membresía. Cambia el layout: ahora es una confirmación, en el popup estándar del sitio. Al confirmar, la tarjeta pasa a «No estás adherido», sin mensaje final.' }],
    'cancelar-membresia': [{ d: '#dialogo', m: '#dialogo', t: 'Al confirmar, la membresía sale de la lista, como hace hoy el código, sin mensaje final. <i>A confirmar:</i> qué confirmación muestra hoy «Cancelar membresía».' }],
    'unirme': [{ d: '#dialogo', m: '#dialogo', t: 'El contenido es el de hoy, tal cual: el título, el texto, documento, país y los dos checks. Lo único que cambia es el layout: en lugar de desplegarse en Información personal, se abre acá, desde «Unirme». Las palabras «bases y condiciones» abren las bases encima del formulario, sin perder lo escrito. El error va junto al campo, en un lugar reservado para que no mueva el botón; en web el popup queda fijo arriba, el cursor arranca en Documento y Enter envía. <i>A confirmar:</i> si el check de Scotiabank es obligatorio (su texto varía por tienda), si se precarga el documento cuando ya existe y cómo aplica en tiendas con otro proveedor de puntos.' }],
    'ver-datos': [{ d: '#dialogo', m: '#dialogo', t: '<b>Ver mis datos:</b> los datos que el cliente le cedió a la app, con su valor. Cada fila sale solo si la app tiene ese permiso: profile (Nombre), email (Email), phone (Celular), identity (Documento, País de emisión y Fecha de nacimiento). Margarita muestra solo Nombre y Email, porque en la base local el cliente del hub (Agent-Hub Trunk) tiene profile y email. <i>A confirmar:</i> sus permisos en producción. Los dispositivos vinculados no van acá: no los entrega ningún permiso y ya están en la tarjeta. Lo que la app genera después, como las conversaciones, no se le muestra al cliente.' }],
    'desconectar-app': [
      { d: '#dialogo', m: '#dialogo', t: 'Al confirmar, la tarjeta desaparece, sin mensaje final. La app pierde el acceso en el momento, se desvinculan todos sus dispositivos y se pide borrar los datos (pedido de Marcelo): desconectar y borrar son una sola acción. Nivel básico: un mail automático al cliente. El cliente no pierde su propia sesión. <i>A confirmar:</i> quién recibe el pedido de borrar, porque ese mail no se lo avisa al equipo que borra.' }
    ],
    'bases-puntos': [{ d: '#dialogo', m: '#dialogo', t: '<b>Solo el texto de las bases</b>, no la landing de Puntos, que además trae banners, ofertas, video y preguntas frecuentes. Sale del widget de bases de esa landing (WidgetId 1105, tipo TnC, HtmlText), el mismo que muestra wTermsAndConditions. Texto real de la base local. El título del popup es propio, no sale de la landing, y el texto arranca sin su título interno ni párrafos vacíos. Título y «Cerrar» quedan fijos; scrollea solo el texto. En web, el mismo popup del sitio (Tblpopup + Componentpopup).' }],
    'bases-membresia': [{ d: '#dialogo', m: '#dialogo', t: 'El texto sale del widget de bases de la landing indicada en TermsAndConditionsLandingId. Si esa landing no tiene ese widget, se abre como hoy: pestaña nueva en web y navegador en la app. <b>Texto de ejemplo, inventado:</b> ningún grupo de la base local tiene bases cargadas.' }],
    'bases-margarita': [{ d: '#dialogo', m: '#dialogo', t: 'Muestra las bases de la app. <b>Texto de ejemplo, inventado.</b> <i>A confirmar:</i> de dónde sale ese texto, porque hoy se guarda la frase del consentimiento (ExtAppCustomerConsentText), que puede traer solo un enlace. Si solo hay un enlace, se abre afuera.' }],
    'bases-penca': [{ d: '#dialogo', m: '#dialogo', t: 'Muestra las bases de la app. <b>Texto de ejemplo, inventado.</b> <i>A confirmar:</i> de dónde sale ese texto, porque hoy se guarda la frase del consentimiento (ExtAppCustomerConsentText), que puede traer solo un enlace. Si solo hay un enlace, se abre afuera.' }],
    'desvincular-numero': [{ d: '#dialogo', m: '#dialogo', t: 'La fila sale de la lista, sin mensaje final. Corta el acceso de la app desde ese dispositivo en el momento. Si es el último de la app, la confirmación es la de «Desconectar».' }]
  };
  // Notas de la vista App (solo mobile)
  var NOTAS_APP = {
    menu: [
      { d: null, m: '#app-suscripciones', t: '<b>«Membresías» pasa a llamarse «Suscripciones»</b> (mismo componente, mismo ícono) y se muestra <b>siempre</b>: hoy solo aparece si el cliente tiene algún grupo. «Privacidad» deja de existir: la baja de Puntos va a Suscripciones; «Borrar mi cuenta» y la «Declaración de privacidad», a Mis datos.' },
      { d: null, m: '#app-lapiz', t: 'El lápiz abre «Mis datos», como hoy. Ahí pasa «Borrar mi cuenta».' }
    ],
    suscripciones: [
      { d: null, m: '#app-titulo', t: '<b>Después de confirmar:</b> el diálogo se cierra y la pantalla se actualiza. Ese cambio es la confirmación: sin mensajes ni avisos flotantes. Una sola espera: el botón del diálogo queda esperando hasta que la lista se actualice, sin un segundo indicador. Si la acción falla, el error aparece dentro del diálogo.' },
      { d: null, m: '#app-titulo', t: 'Es la pantalla «Membresías» con otro nombre, que suma Puntos y las apps conectadas. Tarjeta de hoy (descripción 15 light) con tres cambios: título 16 semibold, por debajo de la sección (17 bold); borde gris #E0E0E0 de 1 pt en lugar del naranja (la estrella sigue marcando la membresía activa) y las salidas como <b>acción de texto</b>: rojo #C91411, 15 pt, a la derecha, 44 pt de alto para tocar. «Unirme» sigue siendo botón.' },
      { d: null, m: '#bloque-puntos', t: '<b>Programa Puntos</b>, solo en las tiendas con el programa en el perfil. «Salir del programa» reemplaza a la opción «Deseo darme de baja del Programa Puntos de Tienda Inglesa» + «Aceptar» de Privacidad. <i>A confirmar:</i> de qué dato sale la fecha de adhesión.' },
      { d: null, m: '#bloque-membresias', t: '<b>Membresías</b>, como hoy, con «Miembro desde el …» en lugar de «Subscripción activa».' },
      { d: null, m: '#membresia-2', t: '<b>Membresía pendiente:</b> sin estrella, sin fecha y sin «Cancelar membresía», con el texto de hoy. Si faltan documentos, el texto de hoy es «Se requieren acciones para resolver tu solicitud», con «Ver documentos».' },
      { d: null, m: '#ver-bases-membresia-1', t: '<b>Ver bases</b> en cada membresía y app: la fecha y las bases de cada caso. Abre un popup en web y una hoja en la app, sin salir de Suscripciones. <i>A confirmar:</i> hoy no se guarda qué versión aceptó cada cliente; hasta que se guarde, muestra las bases vigentes.' },
      { d: null, m: '#sus-vacio', t: '<b>Sin nada para mostrar:</b> un único aviso; las secciones sin contenido no aparecen.' },
      { d: null, m: '#bloque-apps', t: '<b>Apps conectadas</b> (nuevo): nombre, fecha de conexión, el último acceso (<i>a confirmar con Lali</i> de qué dato sale) y acceso a los datos que el cliente le cedió.' },
      { d: null, m: '#numeros-margarita', t: 'Dispositivos vinculados (pedido de Lali), hoy solo en las apps con PAR activo (ExtAppRequirePar), con «Desvincular» cada uno. Si no queda ninguno, el bloque no aparece. Hoy el único dispositivo es el número de WhatsApp. <i>A confirmar:</i> cuando la app y la web pidan consentimiento, se suman como filas; hoy ese consentimiento es una sola fila por cliente y app, sin dato de dispositivo.' }
    ],
    'mis-datos': [
      { d: null, m: '#app-form', t: 'La edición de «Mis datos» no cambia.' },
      { d: null, m: '#sus-cuenta', t: '<b>Borrar tu cuenta</b> pasa acá desde Privacidad (hoy: opción «Deseo cancelar mi cuenta de Tienda Inglesa» + «Aceptar»). Tarjeta propia al final, con la misma acción de texto roja que las demás salidas. Sigue a la pantalla actual de borrar cuenta, que pide la contraseña.' },
      { d: null, m: '#app-privacidad', t: '<b>Declaración de privacidad</b>, desde Privacidad: al desaparecer ese panel, este es su único acceso en la app. Solo se muestra si la tienda la tiene configurada (PrivacyPagesConfiguration.Privacy mayor que 0) y abre la misma landing de hoy. En el prototipo se ve siempre. En la web sigue en el pie del sitio.' }
    ],
    'salir-puntos': [{ d: null, m: '#dialogo', t: 'El contenido es el de hoy: la opción «Deseo darme de baja del Programa Puntos de Tienda Inglesa» y «Aceptar». Cambia solo el layout: ahora es una alerta nativa de iOS. <i>A confirmar:</i> que el aviso de la app sea este mismo texto, porque en la app sale de un parámetro.' }],
    'cancelar-membresia': [{ d: null, m: '#dialogo', t: 'Al confirmar, la membresía sale de la lista, sin mensaje final. <i>A confirmar:</i> qué confirmación muestra hoy «Cancelar membresía» en la app.' }],
    'unirme': [{ d: null, m: '#dialogo', t: 'El contenido es el de hoy, tal cual: el título, el texto, documento, país y los dos checks. Lo único que cambia es el layout: en lugar de desplegarse en Información personal, se abre acá, desde «Unirme». Las palabras «bases y condiciones» abren las bases encima del formulario, sin perder lo escrito. El error va junto al campo, en un lugar reservado para que no mueva el botón; en web el popup queda fijo arriba, el cursor arranca en Documento y Enter envía. <i>A confirmar:</i> si el check de Scotiabank es obligatorio (su texto varía por tienda), si se precarga el documento cuando ya existe y cómo aplica en tiendas con otro proveedor de puntos. En la app es una hoja, porque una alerta de iOS no admite un check.' }],
    'ver-datos': [{ d: null, m: '#dialogo', t: '<b>Ver mis datos:</b> los datos que el cliente le cedió a la app, con su valor. Cada fila sale solo si la app tiene ese permiso: profile (Nombre), email (Email), phone (Celular), identity (Documento, País de emisión y Fecha de nacimiento). Margarita muestra solo Nombre y Email, porque en la base local el cliente del hub (Agent-Hub Trunk) tiene profile y email. <i>A confirmar:</i> sus permisos en producción. Los dispositivos vinculados no van acá: no los entrega ningún permiso y ya están en la tarjeta. Lo que la app genera después, como las conversaciones, no se le muestra al cliente.' }],
    'desconectar-app': [{ d: null, m: '#dialogo', t: 'Al confirmar, la tarjeta desaparece, sin mensaje final. La app pierde el acceso en el momento, se desvinculan sus dispositivos y se pide borrar los datos (pedido de Marcelo): desconectar y borrar son una sola acción. Nivel básico: un mail automático al cliente. <i>A confirmar:</i> quién recibe el pedido de borrar, porque ese mail no se lo avisa al equipo que borra.' }],
    'bases-puntos': [{ d: null, m: '#dialogo', t: '<b>Solo el texto de las bases</b>, no la landing de Puntos, que además trae banners, ofertas, video y preguntas frecuentes. Sale del widget de bases de esa landing (WidgetId 1105, tipo TnC, HtmlText), el mismo que muestra wTermsAndConditions. Texto real de la base local. El título del popup es propio, no sale de la landing, y el texto arranca sin su título interno ni párrafos vacíos. Título y «Cerrar» quedan fijos; scrollea solo el texto. En la app es una llamada Popup de tamaño Large; el panel de bases de cupones (sdInfoPopup) hoy muestra texto plano y este texto es HTML.' }],
    'bases-membresia': [{ d: null, m: '#dialogo', t: 'El texto sale del widget de bases de la landing indicada en TermsAndConditionsLandingId. Si esa landing no tiene ese widget, se abre como hoy: pestaña nueva en web y navegador en la app. <b>Texto de ejemplo, inventado:</b> ningún grupo de la base local tiene bases cargadas.' }],
    'bases-margarita': [{ d: null, m: '#dialogo', t: 'Muestra las bases de la app. <b>Texto de ejemplo, inventado.</b> <i>A confirmar:</i> de dónde sale ese texto, porque hoy se guarda la frase del consentimiento (ExtAppCustomerConsentText), que puede traer solo un enlace. Si solo hay un enlace, se abre afuera.' }],
    'bases-penca': [{ d: null, m: '#dialogo', t: 'Muestra las bases de la app. <b>Texto de ejemplo, inventado.</b> <i>A confirmar:</i> de dónde sale ese texto, porque hoy se guarda la frase del consentimiento (ExtAppCustomerConsentText), que puede traer solo un enlace. Si solo hay un enlace, se abre afuera.' }],
    'desvincular-numero': [{ d: null, m: '#dialogo', t: 'La fila sale de la lista, sin mensaje final. Corta el acceso desde ese dispositivo en el momento. Si es el último, es «Desconectar».' }]
  };
  Object.keys(NOTAS_APP).forEach(function (k) { NOTAS['app-' + k] = NOTAS_APP[k]; });

  function claveNotas(e) { return (e.plataforma === 'app' ? 'app-' : '') + (dlg || e.paso); }

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
        ['mis-datos', 'Información personal / Mis datos']
      ] },
      { id: 'puntos', nombre: 'Puntos', opciones: [['adherido', 'Adherido'], ['no', 'No adherido'], ['sinprograma', 'Tienda sin programa']], mostrar: function (e) { return e.paso === 'suscripciones'; } },
      { id: 'membresias', nombre: 'Membresías', opciones: [['con', 'Con membresías'], ['sin', 'Sin membresías']], mostrar: function (e) { return e.paso === 'suscripciones'; } },
      { id: 'apps', nombre: 'Apps', opciones: [['con', 'Con apps'], ['sin', 'Sin apps']], mostrar: function (e) { return e.paso === 'suscripciones'; } }
    ],
    pantalla: pantalla,
    claveNotas: claveNotas,
    notas: NOTAS
  });
})();
