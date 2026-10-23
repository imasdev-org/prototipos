# Plantilla de prototipos

Base para armar prototipos navegables de una feature, con el mismo funcionamiento que el del selector de millas.

**Verla andando:** <https://imasdev-org.github.io/selector-millas-itau/plantilla/>

## Qué trae

| Parte | Qué hace |
|---|---|
| **Barra de control** | Negra, arriba. Con la flecha de la derecha se pliega a una solapa chica; tocando la solapa vuelve. Recuerda si quedó plegada. |
| **Vista** | Primer control de la barra, siempre: Desktop o Mobile. |
| **Controles de la feature** | Después de Vista: el paso del recorrido y lo que necesite la feature (cliente, saldo, etc.). |
| **Título** | El nombre de la feature, en la barra y en la pestaña. |
| **Notas para desarrollo** | Pines numerados sobre la pantalla y un panel con las reglas de cada paso. El botón aparece solo si el prototipo tiene notas. |
| **Zonas tocables** | Tocando un lugar que no hace nada se marcan por un momento las zonas que sí responden. |
| **Desktop y mobile** | Desktop ocupa todo el ancho, con el contenido centrado y achicado si la ventana no le da lugar. Mobile, con el ancho de un teléfono y sin barra de desplazamiento: se desplaza con el dedo, la rueda o arrastrando con el mouse. |

## Cómo arrancar un prototipo nuevo

1. Copiar la carpeta `plantilla/` con el nombre de la feature (o a un repositorio nuevo).
2. Completar `js/prototipo.js`: título, controles, pantallas y notas. Las instrucciones detalladas están en [`CLAUDE.md`](CLAUDE.md).
3. Reemplazar `css/prototipo.css` con los estilos de la feature, y poner el nombre en el `<title>` de `index.html`.
4. Activar el hook de versión una vez por clon: `git config core.hooksPath .githooks`.

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Página: carga el núcleo y el prototipo |
| `js/nucleo.js` | Barra, solapa, vista, notas y pista de zonas (no se edita) |
| `css/nucleo.css` | Estilos del núcleo (no se edita) |
| `js/prototipo.js` | Configuración, pantallas y notas de la feature (ejemplo) |
| `css/prototipo.css` | Estilos de la feature (ejemplo) |
| `herramientas/subir-version.js` y `.githooks/` | Versión `?v=` en cada commit, para que GitHub Pages no sirva archivos viejos |
