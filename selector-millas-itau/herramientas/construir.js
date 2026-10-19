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
  'ficha-desktop': {
    omitir: ['dd7caa', 'dd7cab', 'dd7caf', 'dd7c47'],
    marcar: { dd7c86: 'contador', '83526c': 'pb-chip', e01037: 'pb-chip', aa568e: 'saldo-encabezado' },
    derecha: ['aa568e']
  },
  'ficha-mobile': {
    omitir: ['682520', '682521', '682525', '67c5e1'],
    marcar: { '68261e': 'contador', '6825fc': 'pb-icono' }
  },
  'cajon-desktop': {
    omitir: ['d1353b', 'd1353c'],
    marcar: { d134e6: 'pb-etiqueta', d134f5: 'cuchillo-unidad', d134fa: 'cuchillo-total' },
    derecha: ['d134fa']
  },
  'cajon-mobile': {
    omitir: ['9a9b71', '9a9b72'],
    marcar: { '9a9b1b': 'pb-etiqueta', '9a9b2a': 'cuchillo-unidad', '9a9b2f': 'cuchillo-total' },
    derecha: ['9a9b2f']
  },
  'carrito-desktop': {
    omitir: ['dad877', 'dad867', 'dad868', 'dad869', 'dad86a', 'dad86b'],
    marcar: { dad83e: 'pb-etiqueta', dad838: 'cuchillo-unidad', dad83c: 'cuchillo-total', dad85f: 'resumen-carrito', '0e70fc': 'pb-chip', '848718': 'pb-chip', '4e6230': 'saldo-encabezado' },
    derecha: ['dad83c', '4e6230']
  },
  'carrito-mobile': {
    omitir: ['1e7708', '1e773b', '1e773c', '1e773d', '1e773e', '1e773f'],
    marcar: { '1e76d7': 'pb-etiqueta', '1e76d1': 'cuchillo-unidad', '1e76d5': 'cuchillo-total', '1e7774': 'pb-icono' },
    derecha: ['1e76d5']
  },
  'entrega-desktop': { // envío a domicilio
    omitir: ['fef93d', 'feb921', '00be9b'],
    marcar: { feb919: 'tab-pago', feb91d: 'tab-confirmacion', feb8ff: 'ancla-izquierda', '006e82': 'rut', '52ab42': 'casilla-rut', fef94f: 'valor-direccion' }
  },
  'entrega-mobile': {
    omitir: ['c9a5ef'],
    marcar: { ffc169: 'rut', '65c8ad': 'casilla-rut', ffc140: 'valor-direccion' }
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
