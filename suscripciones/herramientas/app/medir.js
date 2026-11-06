// Mide colores y alturas de tinta sobre las capturas reales de la app (3x: 1 pt = 3 px).
const fs = require('fs'), path = require('path');
const { chromium } = require('C:/Users/nberriel/Documents/GitHub/Hanoi_TestUI/node_modules/playwright');
const DIR = __dirname;
const img = f => 'data:image/png;base64,' + fs.readFileSync(path.join(DIR, f)).toString('base64');
const PEDIDOS = {
  '04-membresias.png': { borde_tarjeta: [[30, 600], [33, 600], [36, 600]], borde_boton: [[100, 634], [103, 634]], estrella: [[1030, 448], [1000, 420], [1035, 405]], fondo: [[600, 2200]],
    tinta: { titulo_grupo: [96, 372, 400, 441], subtitulo: [96, 468, 600, 531], texto_boton: [339, 597, 840, 675], nav_titulo: [426, 183, 753, 264] } },
  '02-mi-cuenta.png': { fondo: [[600, 1090]], tarjeta: [[600, 1300]], nav_linea: [[600, 293], [600, 294], [600, 295]],
    tinta: { item: [363, 1146, 786, 1254], nombre: [390, 606, 800, 684], email: [370, 690, 820, 762], puntos: [549, 786, 760, 879] } },
  '05-privacidad.png': { radio: [[30, 450], [33, 450], [36, 450], [40, 450]], aceptar: [[1000, 230]],
    tinta: { opcion: [150, 381, 1000, 516] } },
  '06-editar-datos.png': { linea: [[300, 476], [300, 477], [300, 478]], etiqueta_nombre: [], tinta: { etiqueta: [93, 387, 429, 441], valor: [444, 342, 1086, 477], puntos_titulo: [63, 1287, 1116, 1380] } }
};
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  for (const [f, q] of Object.entries(PEDIDOS)) {
    const r = await p.evaluate(async ([src, q]) => {
      const im = new Image(); im.src = src; await im.decode();
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
      const hex = (px, py) => { const d = x.getImageData(px, py, 1, 1).data; return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); };
      const out = {};
      for (const [k, v] of Object.entries(q)) {
        if (k === 'tinta') {
          out.tinta = {};
          for (const [n, [x0, y0, x1, y1]] of Object.entries(v)) {
            const d = x.getImageData(x0, y0, x1 - x0, y1 - y0).data, w = x1 - x0; let top = -1, bot = -1, oscuro = [255, 255, 255], suma = 0;
            for (let yy = 0; yy < y1 - y0; yy++) for (let xx = 0; xx < w; xx++) { const i = (yy * w + xx) * 4, l = d[i] + d[i + 1] + d[i + 2]; if (l < 560) { if (top < 0) top = yy; bot = yy; } if (l < suma || suma === 0) { suma = l; oscuro = [d[i], d[i + 1], d[i + 2]]; } }
            out.tinta[n] = { alto_px: bot - top + 1, alto_pt: ((bot - top + 1) / 3).toFixed(1), color_mas_oscuro: '#' + oscuro.map(v => v.toString(16).padStart(2, '0')).join('') };
          }
        } else out[k] = v.map(([a, bb]) => a + ',' + bb + ' ' + hex(a, bb));
      }
      return out;
    }, [img(f), q]);
    console.log('== ' + f + '\n' + JSON.stringify(r, null, 1));
  }
  await b.close();
})();
