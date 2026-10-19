// Pone una versión nueva (fecha y hora) a los archivos que carga index.html: ?v=AAAAMMDD-HHMM.
// GitHub Pages deja los archivos en la caché del navegador hasta 10 minutos; con la versión en la URL, cada publicación
// se descarga de nuevo. Correr antes de cada commit que cambie css/, js/ o pantallas/:  node herramientas/subir-version.js
const fs = require('fs'), path = require('path');
const archivo = path.join(__dirname, '..', 'index.html');
const d = new Date(), p = n => String(n).padStart(2, '0');
const version = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
let html = fs.readFileSync(archivo, 'utf8');
const antes = html;
html = html.replace(/((?:css|js|pantallas)\/[A-Za-z0-9\-]+\.(?:css|js))(\?v=[0-9\-]+)?(")/g, '$1?v=' + version + '$3');
if (html === antes) { console.log('sin cambios (ya tiene la versión ' + version + ')'); process.exit(0); }
fs.writeFileSync(archivo, html);
console.log('versión ' + version + ' aplicada en index.html');
