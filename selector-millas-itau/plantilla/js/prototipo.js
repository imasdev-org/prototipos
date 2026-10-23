/*
 * Prototipo de la feature: configuración de la barra, pantallas y notas para desarrollo.
 * Este archivo es un EJEMPLO: se reemplaza entero por el de cada feature (ver CLAUDE.md y README.md).
 * Las pantallas se arman en coordenadas del diseño: desktop 1440 de ancho con el contenido en 1200 centrados, mobile 390.
 */
(function () {
  'use strict';
  var P = window.Prototipo, el = P.el, pos = P.pos, zona = P.zona;

  // Texto o caja con posición absoluta dentro de la pantalla.
  function bloque(clase, x, y, w, h, contenido) {
    return pos(el('div', { class: 'bloque ' + clase }, contenido), x, y, w, h);
  }

  // ---------------------------------------------------------------- pantallas
  // pantalla(estado) devuelve { nodo, alto, bandas }. bandas = [[top, alto, color]]: franjas que en desktop llegan a los
  // bordes de la ventana (encabezado, pie). Todo lo que se toca va con zona(...) o con la clase «interactivo».
  function pantalla(estado) {
    var d = estado.vista === 'desktop', s = el('div'), x = d ? 120 : 20, ancho = d ? 1200 : 350;
    var saludo = estado.cliente === 'a' ? 'Hola, cliente A' : 'Hola, cliente B';
    if (!d) s.appendChild(bloque('encabezado', 0, 0, 390, 64)); // en desktop el encabezado es una banda (ver abajo)
    s.appendChild(bloque('marca', x, 20, 200, 24, 'Sitio de ejemplo'));
    s.appendChild(bloque('saludo', d ? 1120 : 170, 22, 200, 20, saludo));
    if (estado.paso === 'inicio') {
      s.appendChild(bloque('titulo', x, d ? 120 : 96, ancho, 36, 'Pantalla de inicio'));
      s.appendChild(bloque('texto', x, d ? 170 : 140, d ? 640 : ancho, 60, 'Reemplazá estas pantallas por las de la feature. Tocá un lugar vacío para ver las zonas que responden.'));
      s.appendChild(bloque('tarjeta', x, d ? 250 : 220, d ? 560 : ancho, 160, 'Una tarjeta de contenido'));
      s.appendChild(bloque('boton', x, d ? 440 : 410, 220, 40, 'Ver detalle'));
      s.appendChild(zona(x, d ? 440 : 410, 220, 40, 'Ver detalle', function () { P.ir('paso', 'detalle'); }));
    } else {
      s.appendChild(bloque('titulo', x, d ? 120 : 96, ancho, 36, 'Detalle'));
      s.appendChild(bloque('texto', x, d ? 170 : 140, d ? 640 : ancho, 60, 'Segundo paso del recorrido.'));
      s.appendChild(bloque('boton secundario', x, d ? 260 : 230, 220, 40, 'Volver'));
      s.appendChild(zona(x, d ? 260 : 230, 220, 40, 'Volver', function () { P.ir('paso', 'inicio'); }));
      s.appendChild(bloque('boton', d ? x + 240 : x, d ? 260 : 290, 220, 40, 'Terminar'));
      s.appendChild(zona(d ? x + 240 : x, d ? 260 : 290, 220, 40, 'Terminar', function () {
        P.aviso('Fin del recorrido', 'El resto del flujo no forma parte de este prototipo.', [['Volver a empezar', function () { P.ir('paso', 'inicio'); }], ['Cerrar', null]]);
      }));
    }
    return { nodo: s, alto: d ? 900 : 1000, bandas: d ? [[0, 64, '#F4F5F9']] : null };
  }

  // ---------------------------------------------------------------- configuración
  P.iniciar({
    titulo: 'Plantilla de prototipo',          // nombre de la feature: va en la barra y en la pestaña
    clave: 'plantilla',                         // corto y único: guarda si la barra está plegada
    vistaInicial: 'desktop',
    desktop: { anchoDiseno: 1440, anchoContenido: 1200 },
    mobile: { ancho: 390 },
    // Controles de la barra, después de Vista (que pone el núcleo). El primero es el paso del recorrido:
    // su valor elige las notas de cada pantalla. reiniciaScroll: al cambiarlo se vuelve arriba.
    controles: [
      { id: 'paso', nombre: 'Paso', opciones: [['inicio', 'Inicio'], ['detalle', 'Detalle']], reiniciaScroll: true },
      { id: 'cliente', nombre: 'Cliente', opciones: [['a', 'Cliente A'], ['b', 'Cliente B']] }
    ],
    pantalla: pantalla,
    // Notas para desarrollo, por paso. d / m: posición del pin en desktop / mobile (coordenadas del diseño; null = no va
    // en esa vista). t: HTML. Si la feature tiene notas, se completan todas (ver CLAUDE.md); sin la propiedad «notas»,
    // la barra no muestra el botón.
    notas: {
      inicio: [
        { d: [400, 138], m: [300, 114], t: '<b>Título de la pantalla.</b> Acá va la regla o el comportamiento que desarrollo tiene que implementar, con medidas, colores y fórmulas.' },
        { d: [348, 460], m: [248, 430], t: '«Ver detalle» lleva al paso Detalle. <i>A confirmar:</i> los supuestos se marcan así.' }
      ],
      detalle: [
        { d: [240, 138], m: [200, 114], t: 'Nota del segundo paso.' }
      ]
    }
  });
})();
