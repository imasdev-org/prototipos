// Recorta los íconos reales de las capturas de la app (rects en pt del árbol de XCUITest; la captura es 3x).
const fs = require('fs'), path = require('path');
const { chromium } = require('C:/Users/nberriel/Documents/GitHub/Hanoi_TestUI/node_modules/playwright');
const DIR = __dirname, OUT = process.argv[2];
const R = {
  '02-mi-cuenta.png': { avatar: [161, 132, 71, 71], puntos: [143, 262, 31, 31], stickers: [133, 297, 41, 26], lapiz: [358, 117, 15, 16], domicilios: [53, 382, 25, 36],
    tarjetas: [48, 487, 36, 36], pedidos: [50, 592, 32, 36], listas: [50, 697, 32, 36], cupones: [48, 802, 36, 36], menu: [8, 53, 41, 44] },
  '03-mi-cuenta-abajo.png': { misstickers: [50, 479, 31, 30], membresias: [47, 578, 37, 36], privacidad: [48, 684, 36, 36] },
  '04-membresias.png': { estrella: [331, 134, 25, 31], volver: [0, 53, 44, 44] },
  '05-privacidad.png': { radio: [10, 127, 30, 45] }
};
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage();
  for (const [f, rs] of Object.entries(R)) {
    const src = 'data:image/png;base64,' + fs.readFileSync(path.join(DIR, f)).toString('base64');
    for (const [n, [x, y, w, h]] of Object.entries(rs)) {
      const data = await p.evaluate(async ([src, x, y, w, h]) => {
        const im = new Image(); im.src = src; await im.decode();
        const c = document.createElement('canvas'); c.width = w * 3; c.height = h * 3;
        c.getContext('2d').drawImage(im, x * 3, y * 3, w * 3, h * 3, 0, 0, w * 3, h * 3);
        return c.toDataURL('image/png').split(',')[1];
      }, [src, x, y, w, h]);
      fs.writeFileSync(path.join(OUT, n + '.png'), Buffer.from(data, 'base64'));
    }
  }
  await b.close(); console.log('ok', fs.readdirSync(OUT).join(' '));
})();
