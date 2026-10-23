// Exporta tableros de Penpot a herramientas/penpot/<nombre>.json (más sus imágenes).
// Se ejecuta DENTRO del plugin de Penpot (por ejemplo con la herramienta execute_code del MCP de Penpot),
// con la página «WI-13915 · Propuesta» abierta y un receptor local escuchando en http://127.0.0.1:8766
// que guarde el cuerpo de cada POST /save?f=<ruta>. Después: node herramientas/construir.js <carpeta de imágenes>.
//
// Formato de cada nodo: { k: 'b' caja | 'e' elipse | 't' texto | 'v' vector | 'g' grupo, id, nm, x, y, w, h,
//   f: rellenos, s: trazos, r: radios, sh: sombras, op, clip, t: estilos de texto, svg, c: hijos }
// x/y son relativos al tablero contenedor; los grupos no tienen caja propia.

const RECEPTOR = 'http://127.0.0.1:8766/save?f=';
const TABLEROS = {
  'ficha-desktop': 'Propuesta · 01z7 Producto · con sesión · sin selector: precio en millas (tinte al 8 %, desaturado) · Desktop 1440',
  'ficha-mobile': 'Propuesta · 01z7 Producto · con sesión · sin selector: precio en millas (tinte al 8 %, desaturado) · Mobile 390',
  'cajon-desktop': 'Propuesta · 02 Carrito lateral · solo pesos · Desktop (panel 400)',
  'cajon-mobile': 'Propuesta · 02 Carrito lateral · solo pesos · Mobile 390 (panel 351)',
  'carrito-desktop': 'Propuesta · 03 Carrito completo · solo pesos · Desktop 1440',
  'carrito-mobile': 'Propuesta · 03 Carrito completo · solo pesos · Mobile 390',
  'entrega-desktop': 'Alternativa · 04 Checkout · Entrega (domicilio) · millas parcial · pregunta + panel · Desktop 1440',
  'entrega-mobile': 'Alternativa · 04 Checkout · Entrega (domicilio) · millas parcial · pregunta + panel · Mobile 390',
  'entrega-retiro-desktop': 'Alternativa · 04 Checkout · Entrega (retiro) · millas parcial · pregunta + panel · Desktop 1440',
  'entrega-retiro-mobile': 'Alternativa · 04 Checkout · Entrega (retiro) · millas parcial · pregunta + panel · Mobile 390'
};

function serializar(raiz) {
  const imagenes = {};
  const color = (c, o) => { if (!c) return null; o = o == null ? 1 : o; if (o >= 1) return c; const n = parseInt(c.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${+o.toFixed(3)})`; };
  const rellenos = (fills) => {
    if (!fills || fills === 'mixed') return null;
    const out = [];
    for (const f of fills) {
      if (f.fillImage) { const fi = f.fillImage; imagenes[fi.id] = fi; out.push({ img: fi.id, ext: (fi.mtype || '').split('/')[1], op: f.fillOpacity }); }
      else if (f.fillColorGradient) { const g = f.fillColorGradient; out.push({ grad: { type: g.type, sx: g.startX, sy: g.startY, ex: g.endX, ey: g.endY, stops: g.stops.map(s => [color(s.color, s.opacity), s.offset]) } }); }
      else if (f.fillColor) out.push({ c: color(f.fillColor, f.fillOpacity) });
    }
    return out.length ? out : null;
  };
  const trazos = (st) => (!st || st === 'mixed') ? null : st.filter(s => s.strokeColor && (s.strokeWidth || 0) > 0).map(s => ({ c: color(s.strokeColor, s.strokeOpacity), w: s.strokeWidth, a: s.strokeAlignment, st: s.strokeStyle }));
  const sombras = (sh) => (!sh || !sh.length) ? null : sh.filter(s => !s.hidden).map(s => ({ in: s.style === 'inner-shadow', x: s.offsetX, y: s.offsetY, b: s.blur, s: s.spread, c: color(s.color && s.color.color, s.color && s.color.opacity) }));
  const radios = (s) => { const r = [s.borderRadiusTopLeft, s.borderRadiusTopRight, s.borderRadiusBottomRight, s.borderRadiusBottomLeft].map(v => typeof v === 'number' ? v : 0); return r.some(v => v) ? r : null; };
  const esVectorial = (g) => { let ok = true; (function w(s) { if (!ok) return; if (s.type === 'text' || s.type === 'board') ok = false; if (s.children) s.children.forEach(w); })(g); return ok; };
  const svg = (s) => penpot.generateMarkup([s], { type: 'svg' }).replace(/ id="[^"]*"/g, '').replace(/ style="-webkit-print-color-adjust::exact"/, '').replace(/\n\s*/g, '');
  const ESTILOS = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textDecoration', 'textTransform', 'growType'];
  function texto(s) {
    const t = { chars: s.characters, textAlign: s.align, verticalAlign: s.verticalAlign, fill: rellenos(s.fills) };
    for (const k of ESTILOS) t[k] = s[k];
    if (['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fills', 'textDecoration', 'lineHeight', 'letterSpacing'].some(k => s[k] === 'mixed')) {
      const tramos = [];
      for (let i = 0; i < s.characters.length; i++) {
        const r = s.getRange(i, i + 1);
        const sig = { fontFamily: r.fontFamily, fontSize: r.fontSize, fontWeight: r.fontWeight, fontStyle: r.fontStyle, textDecoration: r.textDecoration, fill: rellenos(r.fills), lineHeight: r.lineHeight, letterSpacing: r.letterSpacing };
        const clave = JSON.stringify(sig);
        if (tramos.length && tramos[tramos.length - 1].clave === clave) tramos[tramos.length - 1].t += s.characters[i];
        else tramos.push({ clave, t: s.characters[i], sig });
      }
      t.runs = tramos.map(r => Object.assign({ t: r.t }, r.sig));
    }
    return t;
  }
  function nodo(s, ox, oy) {
    if (s.hidden) return null;
    const n = { k: '', id: s.id, nm: s.name, x: +(s.x - ox).toFixed(2), y: +(s.y - oy).toFixed(2), w: +s.width.toFixed(2), h: +s.height.toFixed(2) };
    if (s.opacity != null && s.opacity < 1) n.op = s.opacity;
    if (s.rotation) n.rot = s.rotation;
    const sh = sombras(s.shadows); if (sh && sh.length) n.sh = sh;
    if (s.blur && !s.blur.hidden && s.blur.value) n.blur = s.blur.value;
    if (s.type === 'text') { n.k = 't'; n.t = texto(s); return n; }
    if (['path', 'bool', 'svg-raw'].includes(s.type) || (s.type === 'group' && esVectorial(s))) { n.k = 'v'; n.svg = svg(s); n.ax = +s.x.toFixed(2); n.ay = +s.y.toFixed(2); return n; }
    if (s.type === 'group') { n.k = 'g'; n.c = s.children.map(c => nodo(c, ox, oy)).filter(Boolean); return n; }
    n.k = s.type === 'ellipse' ? 'e' : 'b';
    n.f = rellenos(s.fills); n.s = trazos(s.strokes); n.r = radios(s);
    if (s.type === 'board') { n.clip = !!s.clipContent; n.c = (s.children || []).map(c => nodo(c, s.x, s.y)).filter(Boolean); }
    return n;
  }
  return { arbol: nodo(raiz, raiz.x, raiz.y), imagenes };
}

const tableros = penpot.currentPage.root.children.filter(s => s.type === 'board');
const enviadas = {};
const resultado = {};
for (const [nombre, titulo] of Object.entries(TABLEROS)) {
  const tablero = tableros.find(s => s.name === titulo);
  if (!tablero) { resultado[nombre] = 'no encontrado'; continue; }
  const { arbol, imagenes } = serializar(tablero);
  await fetch(RECEPTOR + encodeURIComponent(nombre + '.json'), { method: 'POST', body: JSON.stringify(arbol) });
  for (const [id, fi] of Object.entries(imagenes)) {
    if (enviadas[id]) continue;
    await fetch(RECEPTOR + encodeURIComponent('img/' + id + '.' + (fi.mtype || 'image/png').split('/')[1]), { method: 'POST', body: await fi.data() });
    enviadas[id] = true;
  }
  resultado[nombre] = 'ok';
}
return resultado;
