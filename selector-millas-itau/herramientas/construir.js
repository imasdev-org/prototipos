// Genera pantallas/<nombre>.js a partir de herramientas/penpot/<nombre>.json y copia las imágenes usadas.
// Uso: node herramientas/construir.js <carpeta-con-imagenes-exportadas>
//
// "omitir": partes que el prototipo reemplaza por componentes vivos (selector, Resumen, botón Continuar…)
// "marcar": nodos que el prototipo cambia según el estado (contador, precios del cliente común…)
// "derecha": textos que crecen hacia la izquierda (importes alineados a la derecha)
// "mover": correcciones de posición [dx, dy] sobre el diseño (por ejemplo, centrar el título del Resumen)
// Los ids son los últimos 6 caracteres del id de Penpot.
const fs = require('fs'), path = require('path'), gen = require('./gen');

const PANTALLAS = {
  'ficha-desktop': { // ficha sin selector (tablero «Propuesta · 01v …»): recuadro «Este producto equivale a N millas»
    omitir: ['cccd74'],
    marcar: { cd3e56: 'contador', cd3e59: 'pb-chip', cd3e5a: 'pb-chip', cd3e5c: 'saldo-encabezado', '0275b9': 'millas-recuadro', b2dc11: 'millas-texto' },
    derecha: ['cd3e5c']
  },
  'ficha-mobile': {
    omitir: ['db05e8'],
    marcar: { db5bc0: 'contador', db5b9e: 'pb-icono', ebf9e8: 'millas-recuadro', bd056d: 'millas-texto' }
  },
  'promo-desktop': { // ficha con dos promociones sin selector (tablero «Propuesta · 01x …»): el recuadro de la 01v
    omitir: ['29886c'],
    marcar: { '2988ac': 'contador', '29dd55': 'pb-chip', '29dd56': 'pb-chip', '29dd58': 'saldo-encabezado', '29dd6b': 'cocarda', '29dd6c': 'cocarda', c895bb: 'millas-recuadro', '3f58be': 'millas-texto' },
    derecha: ['29dd58']
  },
  'promo-mobile': {
    omitir: ['6aa12e'],
    marcar: { '6ad3a8': 'contador', '6ad386': 'pb-icono', '6aa14a': 'cocarda', '6ad296': 'cocarda', b900fb: 'millas-recuadro', ae9ae6: 'millas-texto' }
  },
  'cajon-desktop': { // carrito «solo pesos» (tableros «… · solo pesos · …»): encabezado y Resumen sin millas
    omitir: ['6bc607'],
    marcar: { d5e3c8: 'pb-etiqueta', d5e3d7: 'cuchillo-unidad', d5e3dc: 'cuchillo-total' },
    derecha: ['d5e3dc']
  },
  'cajon-mobile': {
    omitir: ['c5b7b0'],
    marcar: { '090379': 'pb-etiqueta', '090388': 'cuchillo-unidad', '09038d': 'cuchillo-total' },
    derecha: ['09038d']
  },
  'carrito-desktop': {
    omitir: ['a7bb9b', 'a7bb8b', 'a7bb8c', 'a7bb8d', 'a7bb8e', 'a7bb8f'],
    marcar: { a7bb61: 'pb-etiqueta', a7bb5b: 'cuchillo-unidad', a7bb5f: 'cuchillo-total', a7bb83: 'resumen-carrito', a7d52c: 'pb-chip', a7d52d: 'pb-chip', a7d52f: 'saldo-encabezado' },
    derecha: ['a7bb5f', 'a7d52f']
  },
  'carrito-mobile': {
    omitir: ['d7239b', 'd723cf', 'd723d0', 'd723d1', 'd723d2', 'd723d3'],
    marcar: { d72369: 'pb-etiqueta', d72363: 'cuchillo-unidad', d72367: 'cuchillo-total', d72408: 'pb-icono' },
    derecha: ['d72367']
  },
  'entrega-desktop': { // envío a domicilio (tablero «Alternativa · … · pregunta + panel»)
    omitir: ['71e113', '71e102', '71e178'],
    marcar: { '718ee0': 'tab-pago', '71e0fe': 'tab-confirmacion', '718ec6': 'ancla-izquierda', '71e158': 'rut', '71e15a': 'casilla-rut', '71e125': 'valor-direccion' }
  },
  'entrega-mobile': {
    omitir: ['dd8de2', 'dde78e'],
    marcar: { dde78b: 'rut', dde78d: 'casilla-rut', dde75f: 'valor-direccion' }
  },
  'entrega-retiro-desktop': { // retiro en sucursal (tablero «Alternativa · … Entrega (retiro) …»)
    omitir: ['ca95de', 'ca95cd', 'cae73f'],
    marcar: { ca95c5: 'tab-pago', ca95c9: 'tab-confirmacion', ca95ab: 'ancla-izquierda', cae71f: 'rut', cae721: 'casilla-rut', ca95f0: 'valor-direccion' }
  },
  'entrega-retiro-mobile': {
    omitir: ['875da7', '87b27b'],
    marcar: { '87b278': 'rut', '87b27a': 'casilla-rut', ae1e20: 'valor-direccion' }
  }
};

const raiz = path.join(__dirname, '..');
const origenImg = process.argv[2];
fs.mkdirSync(path.join(raiz, 'pantallas'), { recursive: true });
fs.mkdirSync(path.join(raiz, 'assets', 'img'), { recursive: true });
const fuentes = new Set(), imagenes = new Set();
for (const [nombre, cfg] of Object.entries(PANTALLAS)) {
  const arbol = JSON.parse(fs.readFileSync(path.join(__dirname, 'penpot', nombre + '.json'), 'utf8'));
  const r = gen(arbol, cfg);
  r.fuentes.forEach(f => fuentes.add(f)); r.imagenes.forEach(i => imagenes.add(i));
  const js = `window.PANTALLAS = window.PANTALLAS || {};\nwindow.PANTALLAS[${JSON.stringify(nombre)}] = ${JSON.stringify({ w: r.ancho, h: r.alto, bandas: r.bandas, html: r.html })};\n`;
  fs.writeFileSync(path.join(raiz, 'pantallas', nombre + '.js'), js);
  console.log(nombre, Math.round(js.length / 1024) + ' KB');
}
if (origenImg) for (const i of imagenes) fs.copyFileSync(path.join(origenImg, i), path.join(raiz, 'assets', 'img', i));
console.log('fuentes:', [...fuentes].join(', '), '· imágenes:', imagenes.size);
