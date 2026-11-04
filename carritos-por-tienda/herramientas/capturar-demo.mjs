// Captura las pantallas reales de demo para el prototipo: HTML saneado (sin scripts, ocultos ni handlers) + estilos,
// fuentes e imágenes copiados a <clon>/sitio. Escribe <clon>/pantallas/*.js.
// Uso (desde la carpeta del clon): node herramientas/capturar-demo.mjs . herramientas/demo
//   herramientas/demo: carrito, checkout y carrito lateral guardados de demo con sesión (ya saneados, datos genéricos) y la
//   cabecera con sesión (frag_*.html) que se pone sobre la home de demo, que se toma en vivo sin sesión.
//   Usa el Playwright del repo Hanoi_TestUI.
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import crypto from "crypto";
const require = createRequire("C:/Users/nberriel/Documents/GitHub/Hanoi_TestUI/package.json");
const { chromium, devices } = require("playwright");
const [OUT, DIR] = process.argv.slice(2);
const DEMO = "https://demo-web.imasdev.com/";
const ALIAS = {
  "demo-web.imasdev.com": "demo", "desa-resize.tiendainglesa.com.uy": "desa-resize", "prod-resize.tiendainglesa.com.uy": "prod-resize",
  "fonts.googleapis.com": "fuentes-css", "fonts.gstatic.com": "fuentes", "cdn.jsdelivr.net": "jsdelivr",
};
const guardados = new Map(); // clave -> { loc, url, css }
const otrosHosts = new Map();
const clave = (u) => { const x = new URL(u); x.hash = ""; if (x.hostname !== "fonts.googleapis.com") x.search = ""; return x.href; };
function rutaLocal(u) {
  const x = new URL(u);
  let p = decodeURIComponent(x.pathname);
  if (x.hostname === "fonts.googleapis.com") p = "/css-" + crypto.createHash("md5").update(x.search).digest("hex").slice(0, 10) + ".css";
  if (p.endsWith("/")) p += "index";
  return "sitio/" + ALIAS[x.hostname] + p.replace(/[<>:"|?*]/g, "_");
}
function guardar(u, body, esCss) {
  const k = clave(u); if (guardados.has(k)) return;
  const loc = rutaLocal(u);
  fs.mkdirSync(path.dirname(path.join(OUT, loc)), { recursive: true });
  fs.writeFileSync(path.join(OUT, loc), body);
  guardados.set(k, { loc, url: u, css: !!esCss });
}
function escuchar(page) {
  page.on("response", async (r) => {
    try {
      const u = r.url(); if (!/^https?:/.test(u) || r.status() !== 200) return;
      const t = r.request().resourceType(); if (!["stylesheet", "image", "font", "media"].includes(t)) return;
      const h = new URL(u).hostname;
      if (!ALIAS[h]) { otrosHosts.set(h, (otrosHosts.get(h) || 0) + 1); return; }
      guardar(u, await r.body(), t === "stylesheet" || /\.css$/i.test(new URL(u).pathname));
    } catch (e) { /* respuesta sin cuerpo */ }
  });
}
let ctxDescarga;
async function bajar(u) {
  if (guardados.has(clave(u))) return true;
  if (!ALIAS[new URL(u).hostname]) return false;
  try {
    const r = await ctxDescarga.request.get(u, { timeout: 30000 });
    if (r.status() !== 200) return false;
    const ct = r.headers()["content-type"] || "";
    if (!/image|font|css|octet|svg|woff/.test(ct)) return false;
    guardar(u, await r.body(), /css/.test(ct));
    return true;
  } catch (e) { return false; }
}

// ------------------------------------------------------------------ en la página (sin JS de la página)
const EN_PAGINA = {
  refs: () => {
    const out = new Set();
    const abs = (u, b) => { try { return new URL(u, b || document.baseURI).href; } catch (e) { return null; } };
    const deCss = (t, b) => { [...t.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)].forEach((m) => out.add(abs(m[2], b))); [...t.matchAll(/@import\s+(['"])([^'"]+)\1/g)].forEach((m) => out.add(abs(m[2], b))); };
    document.querySelectorAll("img[src], input[type=image][src], video[poster]").forEach((e) => out.add(abs(e.getAttribute("src") || e.getAttribute("poster"))));
    document.querySelectorAll("[srcset]").forEach((e) => e.getAttribute("srcset").split(",").forEach((s) => out.add(abs(s.trim().split(/\s+/)[0]))));
    document.querySelectorAll("[data-srcset]").forEach((e) => e.dataset.srcset.split(",").forEach((s) => out.add(abs(s.trim().split(/\s+/)[0]))));
    document.querySelectorAll("img[data-src], source[data-src]").forEach((e) => out.add(abs(e.dataset.src)));
    document.querySelectorAll("link[rel~=stylesheet][href]").forEach((e) => out.add(abs(e.getAttribute("href"))));
    document.querySelectorAll("[style]").forEach((e) => deCss(e.getAttribute("style")));
    document.querySelectorAll("style").forEach((e) => deCss(e.textContent));
    return [...out].filter((u) => u && /^https?:/.test(u));
  },
  // mapa: clave -> ruta local (relativa a index.html del clon)
  preparar: (mapa) => {
    const abs = (u, b) => { try { return new URL(u, b || document.baseURI).href; } catch (e) { return null; } };
    const clave = (u) => { const x = new URL(u); x.hash = ""; if (x.hostname !== "fonts.googleapis.com") x.search = ""; return x.href; };
    const loc = (u) => { const a = abs(u); if (!a || !/^https?:/.test(a)) return u; return mapa[clave(a)] || a; };
    const enCss = (t) => t.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => /^data:/.test(u) ? m : 'url("' + loc(u) + '")')
      .replace(/@import\s+(['"])([^'"]+)\1/g, (m, q, u) => '@import "' + loc(u) + '"');
    // Imágenes con lazy-load: src / srcset vacíos (el navegador los resuelve a la raíz o a la página) y la imagen real en
    // data-src / data-srcset. Se usa la real; si no hay, se saca el atributo para que no pida una página como imagen.
    const vacia = (u) => { const x = new URL(abs(u || "")); return x.hostname === "demo-web.imasdev.com" && !/\.[a-z0-9]{2,5}$/i.test(x.pathname); };
    document.querySelectorAll("img[src], source[src]").forEach((e) => { if (vacia(e.getAttribute("src"))) { if (e.dataset.src) e.setAttribute("src", e.dataset.src); else e.removeAttribute("src"); } });
    document.querySelectorAll("[srcset]").forEach((e) => { if (vacia(e.getAttribute("srcset").trim().split(/\s+/)[0])) { if (e.dataset.srcset) e.setAttribute("srcset", e.dataset.srcset); else e.removeAttribute("srcset"); } });
    document.querySelectorAll("img[src], input[type=image][src]").forEach((e) => e.setAttribute("src", loc(e.getAttribute("src"))));
    // imágenes que no se pudieron copiar (servidores que no responden, ni en demo se ven): sin src, para que no se pidan
    document.querySelectorAll("img[src]").forEach((e) => { if (/^https?:/.test(e.getAttribute("src"))) e.removeAttribute("src"); });
    document.querySelectorAll("[srcset]").forEach((e) => e.setAttribute("srcset", e.getAttribute("srcset").split(",").map((s) => { const p = s.trim().split(/\s+/); p[0] = loc(p[0]); return p.join(" "); }).join(", ")));
    document.querySelectorAll("link[rel~=stylesheet][href]").forEach((e) => e.setAttribute("href", loc(e.getAttribute("href"))));
    document.querySelectorAll("[style]").forEach((e) => e.setAttribute("style", enCss(e.getAttribute("style"))));
    document.querySelectorAll("style").forEach((e) => { e.textContent = enCss(e.textContent); });
    // fuera: scripts, marcos, ocultos (GXState incluido), metadatos y handlers en línea (llaman a gx, que no está)
    document.querySelectorAll("script, noscript, iframe, object, embed, template, input[type=hidden], link:not([rel~=stylesheet]), meta, base, title").forEach((n) => n.remove());
    document.querySelectorAll("*").forEach((e) => [...e.attributes].forEach((a) => { if (/^on/i.test(a.name) || /^javascript:/i.test(a.value)) e.removeAttribute(a.name); }));
    const cabeza = [...document.head.querySelectorAll("link[rel~=stylesheet], style")].map((e) => e.outerHTML).join("\n");
    return { cabeza, cuerpo: document.body.innerHTML, claseHtml: document.documentElement.className.trim(), claseCuerpo: document.body.className.trim() };
  },
};

// ------------------------------------------------------------------ captura
const browser = await chromium.launch();
ctxDescarga = await browser.newContext();
const frag = Object.fromEntries(["rowheader", "top", "mob"].map((n) => [n, fs.readFileSync(path.join(DIR, "frag_" + n + ".html"), "utf8")]));
const drawer = fs.readFileSync(path.join(DIR, "drawer.html"), "utf8");

// 1. Home en vivo (con JS), cabecera de sesión con datos genéricos
const vivo = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const pv = await vivo.newPage(); escuchar(pv);
await pv.goto(DEMO + "supermercado", { waitUntil: "load", timeout: 90000 });
await pv.waitForTimeout(7000);
await pv.evaluate((f) => {
  const w = document.getElementById("MPW0019gxHTMLWrpW0019"); const row = w && w.closest(".row.RowHeader"); if (row) row.outerHTML = f.rowheader;
  const top = document.getElementById("TABLEMAINHEADERWEB_MPAGE"); if (top) top.outerHTML = f.top;
  const mob = document.getElementById("SECTIONHEADERMOBILE_MPAGE"); if (mob) mob.outerHTML = f.mob;
}, frag);
await pv.waitForTimeout(1500);
let home = await pv.evaluate(() => "<!DOCTYPE html>" + document.documentElement.outerHTML);
home = home.replace(/<head([^>]*)>/i, '<head$1><base href="https://demo-web.imasdev.com/">');
await vivo.close();

// 1b. La misma home en un teléfono: el JavaScript del sitio arma distinto algunas partes según el ancho al cargar
// (categorías, pie, carruseles), así que la vista Mobile usa esta captura. Después, el menú lateral (sin sesión): se
// abre con el ícono de menú y se guarda su contenido.
const movil = await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 760 } });
const pm = await movil.newPage(); escuchar(pm);
await pm.goto(DEMO + "supermercado", { waitUntil: "load", timeout: 90000 });
await pm.waitForTimeout(7000);
await pm.evaluate((f) => {
  const w = document.getElementById("MPW0019gxHTMLWrpW0019"); const row = w && w.closest(".row.RowHeader"); if (row) row.outerHTML = f.rowheader;
  const top = document.getElementById("TABLEMAINHEADERWEB_MPAGE"); if (top) top.outerHTML = f.top;
  const mob = document.getElementById("SECTIONHEADERMOBILE_MPAGE"); if (mob) mob.outerHTML = f.mob;
}, frag);
await pm.waitForTimeout(1500);
let homeMovil = await pm.evaluate(() => "<!DOCTYPE html>" + document.documentElement.outerHTML);
homeMovil = homeMovil.replace(/<head([^>]*)>/i, '<head$1><base href="https://demo-web.imasdev.com/">');
await pm.locator("img.menuIcon:visible").first().click();
await pm.waitForTimeout(4000);
const menu = await pm.evaluate(() => document.querySelector(".gx-call-target.left").outerHTML);
await movil.close();

// 2. Cada página, sin JS: cargar a 1440 y a 390 (y los estados que muestra el prototipo) para traer sus recursos
const docs = { inicio: home, inicioMovil: homeMovil, carrito: fs.readFileSync(path.join(DIR, "cart.html"), "utf8"), checkout: fs.readFileSync(path.join(DIR, "checkout.html"), "utf8") };
const sinJs = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
const res = {};
for (const [nombre, html] of Object.entries(docs)) {
  const p = await sinJs.newPage(); escuchar(p);
  await p.setContent(html, { waitUntil: "load", timeout: 120000 }); await p.waitForTimeout(2500);
  for (const w of [390, 1440]) {
    await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(1500);
    if (nombre.startsWith("inicio")) {
      await p.evaluate(() => document.documentElement.classList.add("ChannelSheetOpen")); await p.waitForTimeout(1000);
      await p.evaluate(() => document.documentElement.classList.remove("ChannelSheetOpen"));
    }
  }
  if (nombre.startsWith("inicio")) {
    // recursos del carrito lateral (se inserta en el prototipo sobre la home)
    await p.evaluate((d) => { const r = document.querySelector(".gx-call-target.right"); if (r) { r.insertAdjacentHTML("afterend", '<div id="tmp-drawer">' + d + "</div>"); } }, drawer);
    for (const w of [390, 1440]) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(1500); }
    await p.evaluate(() => document.getElementById("tmp-drawer").remove());
  }
  const refs = await p.evaluate(EN_PAGINA.refs);
  let bajados = 0; for (const u of refs) if (!guardados.has(clave(u)) && await bajar(u)) bajados++;
  const mapa = Object.fromEntries([...guardados].map(([k, v]) => [k, v.loc]));
  res[nombre] = await p.evaluate(EN_PAGINA.preparar, mapa);
  console.log(nombre, "refs", refs.length, "bajados", bajados, "cuerpo", res[nombre].cuerpo.length, "cabeza", res[nombre].cabeza.length);
  await p.close();
}
// el carrito lateral y el menú lateral: fragmentos que el prototipo pone sobre la home, con el mismo tratamiento
for (const [nombre, frag] of Object.entries({ lateral: drawer, menu })) {
  const p = await sinJs.newPage(); escuchar(p);
  await p.setContent('<!DOCTYPE html><html><head><base href="https://demo-web.imasdev.com/"></head><body>' + frag + "</body></html>", { waitUntil: "load" });
  await p.waitForTimeout(1500);
  const refs = await p.evaluate(EN_PAGINA.refs);
  for (const u of refs) if (!guardados.has(clave(u))) await bajar(u);
  const mapa = Object.fromEntries([...guardados].map(([k, v]) => [k, v.loc]));
  res[nombre] = await p.evaluate(EN_PAGINA.preparar, mapa);
  console.log(nombre, "refs", refs.length, "cuerpo", res[nombre].cuerpo.length);
  await p.close();
}
// íconos que agrega el prototipo: carrito de cada tienda e isotipos de los avisos
for (const u of [
  DEMO + "static/icons/supermercado/ico_cart.svg?3", DEMO + "static/icons/farmacia/ico_cart.svg?3", DEMO + "static/icons/express/ico_cart.svg?3",
  "https://desa-resize.tiendainglesa.com.uy/imagenes/banners/Banner4207_a608e4ca-c1fb-4a1b-88a1-b63cb0eabb84.png",
  "https://desa-resize.tiendainglesa.com.uy/imagenes/banners/Banner2934_cc7297b2-6b1b-44f2-827f-24f71993b64c.png",
  "https://desa-resize.tiendainglesa.com.uy/logos/logo_barnys.png",
]) console.log("ícono", u.split("/").pop(), await bajar(u));

// 3. CSS guardados: sus url() e @import apuntan a las copias locales (lo que falte se baja; si no se puede, queda la URL original)
let cssBajados = 0;
for (let vuelta = 0; vuelta < 3; vuelta++) {
  for (const [, v] of [...guardados]) {
    if (!v.css) continue;
    const txt = fs.readFileSync(path.join(OUT, v.loc), "utf8");
    for (const m of txt.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)|@import\s+(['"])([^'"]+)\3/g)) {
      const u = m[2] || m[4]; if (!u || /^data:/.test(u)) continue;
      let a; try { a = new URL(u, v.url).href; } catch (e) { continue; }
      if (/^https?:/.test(a) && !guardados.has(clave(a)) && await bajar(a)) cssBajados++;
    }
  }
}
for (const [, v] of guardados) {
  if (!v.css) continue;
  const f = path.join(OUT, v.loc), dir = path.dirname(v.loc);
  const rel = (u) => {
    if (/^data:/.test(u)) return null;
    let a; try { a = new URL(u, v.url).href; } catch (e) { return null; }
    const g = guardados.get(clave(a));
    return g ? path.posix.relative(dir, g.loc) : a;
  };
  let txt = fs.readFileSync(f, "utf8");
  txt = txt.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => { const r = rel(u); return r ? 'url("' + r + '")' : m; })
    .replace(/@import\s+(['"])([^'"]+)\1/g, (m, q, u) => { const r = rel(u); return r ? '@import "' + r + '"' : m; });
  fs.writeFileSync(f, txt);
}
console.log("css: recursos bajados", cssBajados, "· archivos en sitio/", guardados.size, "· otros hosts sin copiar", JSON.stringify([...otrosHosts]));

// 4. pantallas/*.js
fs.mkdirSync(path.join(OUT, "pantallas"), { recursive: true });
for (const [nombre, r] of Object.entries(res)) {
  const js = "// Pantalla real de demo (" + nombre + "), saneada: sin scripts, campos ocultos ni datos personales. La genera la captura.\n"
    + "window.PANTALLAS = window.PANTALLAS || {};\nwindow.PANTALLAS[" + JSON.stringify(nombre) + "] = " + JSON.stringify(r) + ";\n";
  fs.writeFileSync(path.join(OUT, "pantallas", nombre + ".js"), js);
  console.log("pantallas/" + nombre + ".js", Math.round(js.length / 1024) + " KB");
}
await browser.close();
