// Convierte el árbol exportado de Penpot (ver penpot-exportar.js) en HTML con elementos reales:
// textos como texto, cajas como <div> y vectores como <svg>. Todo con posición absoluta, como en el diseño.
const r2 = (v) => +(+v).toFixed(2);
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function fondo(f, rutaImg) {
  if (!f || !f.length) return '';
  const capas = f.map(x => { // Penpot y CSS: el primer relleno queda arriba
    if (x.img) return { img: `url(${rutaImg}${x.img}.${x.ext})` };
    if (x.grad) {
      const g = x.grad;
      if (g.type === 'radial') return { grad: `radial-gradient(circle at ${r2(g.sx * 100)}% ${r2(g.sy * 100)}%, ${g.stops.map(s => `${s[0]} ${r2(s[1] * 100)}%`).join(', ')})` };
      const ang = Math.atan2(g.ex - g.sx, -(g.ey - g.sy)) * 180 / Math.PI;
      return { grad: `linear-gradient(${r2(ang)}deg, ${g.stops.map(s => `${s[0]} ${r2(s[1] * 100)}%`).join(', ')})` };
    }
    return { c: x.c };
  });
  if (capas.length === 1 && capas[0].c) return `background:${capas[0].c};`;
  // en CSS solo la última capa puede ser un color: las demás van como degradé plano
  const partes = capas.map(c => c.img || c.grad || `linear-gradient(${c.c}, ${c.c})`);
  const hayImg = capas.some(c => c.img);
  return `background-image:${partes.join(',')};` + (hayImg ? 'background-size:100% 100%;background-repeat:no-repeat;' : '');
}
function sombras(n) {
  const out = (n.sh || []).map(s => `${s.in ? 'inset ' : ''}${r2(s.x)}px ${r2(s.y)}px ${r2(s.b)}px ${r2(s.s || 0)}px ${s.c}`);
  return out.length ? `box-shadow:${out.join(',')};` : '';
}
function trazos(n) {
  const s = (n.s || [])[0];
  if (!s) return '';
  const estilo = s.st && s.st !== 'solid' && s.st !== 'none' ? s.st : 'solid';
  const off = s.a === 'inner' ? -s.w : s.a === 'center' ? -s.w / 2 : 0;
  return `outline:${r2(s.w)}px ${estilo} ${s.c};outline-offset:${r2(off)}px;`;
}
function radio(n) {
  if (!n.r) return n.k === 'e' ? 'border-radius:50%;' : '';
  const [a, b, c, d] = n.r;
  return a === b && b === c && c === d ? `border-radius:${r2(a)}px;` : `border-radius:${r2(a)}px ${r2(b)}px ${r2(c)}px ${r2(d)}px;`;
}
function caja(n, anclaDerecha, anchoPadre) {
  const h = anclaDerecha ? `right:${r2(anchoPadre - n.x - n.w)}px;` : `left:${r2(n.x)}px;width:${r2(n.w)}px;`;
  return `${h}top:${r2(n.y)}px;height:${r2(n.h)}px;` +
    (n.op != null ? `opacity:${n.op};` : '') + (n.rot ? `transform:rotate(${n.rot}deg);` : '') + (n.blur ? `filter:blur(${n.blur}px);` : '');
}
const ALINEAR_V = { center: 'center', bottom: 'flex-end' };
function estiloTexto(t, fuentes) {
  const fam = t.fontFamily && t.fontFamily !== 'mixed' ? t.fontFamily : null;
  if (fam) fuentes.add(fam);
  let s = '';
  if (fam) s += `font-family:'${fam}',sans-serif;`;
  if (t.fontSize && t.fontSize !== 'mixed') s += `font-size:${t.fontSize}px;`;
  if (t.fontWeight && t.fontWeight !== 'mixed') s += `font-weight:${t.fontWeight};`;
  if (t.fontStyle === 'italic') s += 'font-style:italic;';
  if (t.lineHeight && t.lineHeight !== 'mixed') s += `line-height:${t.lineHeight};`;
  if (t.letterSpacing && t.letterSpacing !== 'mixed' && +t.letterSpacing) s += `letter-spacing:${t.letterSpacing}px;`;
  if (t.textDecoration && t.textDecoration !== 'none' && t.textDecoration !== 'mixed') s += `text-decoration:${t.textDecoration};`;
  if (t.textTransform && t.textTransform !== 'none' && t.textTransform !== 'mixed') s += `text-transform:${t.textTransform};`;
  const f = t.fill && t.fill[0];
  if (f && f.c) s += `color:${f.c};`;
  return s;
}
function nodo(n, o, fuentes, anchoPadre) {
  if (o.omitir.has(n.id)) return '';
  if (o.mover[n.id]) n = Object.assign({}, n, { x: n.x + o.mover[n.id][0], y: n.y + o.mover[n.id][1] });
  const marca = o.marcar[n.id] ? ` data-k="${o.marcar[n.id]}"` : '';
  const derecha = o.derecha.has(n.id);
  if (n.k === 'g') {
    const hijos = (n.c || []).map(c => nodo(c, o, fuentes, anchoPadre)).join('');
    return n.op != null || marca ? `<div class="g" style="${n.op != null ? 'opacity:' + n.op : ''}"${marca}>${hijos}</div>` : hijos;
  }
  if (n.k === 'v') {
    // el viewBox del SVG incluye el trazo: se ubica por su origen respecto de la caja de la forma
    const vb = /viewBox="([-\d.]+) ([-\d.]+)/.exec(n.svg);
    const dx = vb && n.ax != null ? r2(+vb[1] - n.ax) : 0, dy = vb && n.ay != null ? r2(+vb[2] - n.ay) : 0;
    const svg = n.svg.replace('<svg ', `<svg aria-hidden="true" style="left:${dx}px;top:${dy}px" `);
    return `<div class="v" style="${caja(n)}"${marca}>${svg}</div>`;
  }
  if (n.k === 't') {
    const t = n.t;
    const contenido = t.runs ? t.runs.map(r => `<span style="${estiloTexto(r, fuentes)}">${esc(r.t)}</span>`).join('') : esc(t.chars);
    const ws = t.growType === 'auto-width' ? 'pre' : 'pre-wrap';
    const jc = ALINEAR_V[t.verticalAlign] ? `justify-content:${ALINEAR_V[t.verticalAlign]};` : '';
    const ta = t.textAlign && t.textAlign !== 'left' ? `text-align:${t.textAlign};` : '';
    return `<div class="t" style="${caja(n, derecha, anchoPadre)}${jc}${ta}white-space:${ws};${estiloTexto(t, fuentes)}"${marca}><span>${contenido}</span></div>`;
  }
  // tablero, rectángulo o elipse
  const hijos = (n.c || []).map(c => nodo(c, o, fuentes, n.w)).join('');
  const st = caja(n) + fondo(n.f, o.rutaImg) + radio(n) + sombras(n) + trazos(n) + (n.clip ? 'overflow:hidden;' : '');
  return `<div class="b" style="${st}"${marca}>${hijos}</div>`;
}
// Busca ids completos a partir de sus últimos caracteres (los ids de Penpot comparten prefijo por tablero).
function resolver(arbol, sufijos) {
  const encontrados = {};
  (function w(n) { for (const s of sufijos) if (n.id.endsWith(s)) (encontrados[s] = encontrados[s] || []).push(n.id); (n.c || []).forEach(w); })(arbol);
  for (const s of sufijos) {
    if (!encontrados[s]) throw new Error('No existe el nodo …' + s);
    if (encontrados[s].length > 1) throw new Error('Sufijo ambiguo …' + s);
  }
  return Object.fromEntries(sufijos.map(s => [s, encontrados[s][0]]));
}
function gen(arbol, opciones) {
  const op = Object.assign({ omitir: [], marcar: {}, derecha: [], mover: {}, rutaImg: 'assets/img/' }, opciones || {});
  const ids = resolver(arbol, [...new Set([...op.omitir, ...Object.keys(op.marcar), ...op.derecha, ...Object.keys(op.mover)])]);
  const o = {
    rutaImg: op.rutaImg,
    omitir: new Set(op.omitir.map(s => ids[s])),
    derecha: new Set(op.derecha.map(s => ids[s])),
    marcar: Object.fromEntries(Object.entries(op.marcar).map(([s, k]) => [ids[s], k])),
    mover: Object.fromEntries(Object.entries(op.mover).map(([s, d]) => [ids[s], d]))
  };
  const fuentes = new Set();
  const html = (arbol.c || []).map(c => nodo(c, o, fuentes, arbol.w)).join('');
  const imagenes = new Set();
  html.replace(/url\(([^)]+)\)/g, (m, u) => { imagenes.add(u.split('/').pop()); return m; });
  return { html, fuentes: [...fuentes], imagenes: [...imagenes], ancho: arbol.w, alto: arbol.h, bandas: bandas(arbol) };
}
// Franjas de color que ocupan todo el ancho del tablero (por ejemplo el pie gris): el prototipo
// las extiende hasta los bordes de la ventana. Las blancas no hace falta extenderlas.
function bandas(arbol) {
  const out = [];
  (function w(n, ox, oy, prof) {
    const ax = ox + n.x, ay = oy + n.y;
    const color = n.f && n.f.length === 1 && n.f[0].c;
    if (prof > 0 && n.k === 'b' && ax <= 1 && ax + n.w >= arbol.w - 1 && color && !/^#fff(fff)?$/i.test(color)) { out.push([r2(ay), r2(n.h), color]); return; }
    if (prof < 4) (n.c || []).forEach(c => w(c, n.k === 'g' ? ox : ax, n.k === 'g' ? oy : ay, prof + 1));
  })(arbol, -arbol.x, -arbol.y, 0);
  return out;
}
module.exports = gen;
