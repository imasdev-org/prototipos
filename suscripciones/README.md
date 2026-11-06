# Plantilla de prototipos

Base para armar prototipos navegables de una feature, con el mismo funcionamiento que el del selector de millas.

**Verla andando:** abrir `index.html` en el navegador (no necesita build ni servidor).

## Qué trae

| Parte | Qué hace |
|---|---|
| **Barra de control** | Negra, arriba. Con la flecha de la derecha se pliega a una solapa chica; tocando la solapa vuelve. Recuerda si quedó plegada. |
| **Vista** | Primer control de la barra, siempre: Desktop o Mobile. Con una ventana de menos de 700 px (un teléfono) arranca en Mobile; si no, en la vista que diga `vistaInicial` (Desktop si no se indica). |
| **Controles de la feature** | Después de Vista: el paso del recorrido y lo que necesite la feature (cliente, saldo, etc.). |
| **Título** | El nombre de la feature, en la barra y en la pestaña. |
| **Notas para desarrollo** | Pines numerados sobre la pantalla y un panel con las reglas de cada paso. El botón aparece solo si el prototipo tiene notas. |
| **Zonas tocables** | Tocando un lugar que no hace nada se marcan por un momento los elementos que sí responden. |
| **Desktop y mobile** | Pantallas fluidas: el contenido ocupa todo el ancho hasta 1200 px (`desktop.anchoContenido`), centrado. Cada pantalla se dibuja en un marco del ancho de la vista, así su CSS responde como en un navegador de verdad. Desktop ocupa todo el ancho de la ventana. Mobile, con el ancho de un teléfono (`mobile.ancho`, 390 px), sin marco y de borde a borde en alto; en una ventana de 600 px o menos ocupa todo el ancho. Sin barra de desplazamiento: se desplaza con el dedo, la rueda o arrastrando con el mouse. |

## Cómo arrancar un prototipo nuevo

Todos los prototipos viven en un mismo repositorio, `prototipos` (`C:\Users\nberriel\Documents\GitHub\prototipos`), uno por carpeta. No se crea un repositorio por prototipo.

1. Copiar esta plantilla a una carpeta nueva de `prototipos`, con el nombre de la feature en minúsculas y con guiones. Se copia sin `.githooks`, `.gitattributes` ni `.nojekyll`, porque los de la raíz de `prototipos` valen para todos:
   ```
   mkdir C:/Users/nberriel/Documents/GitHub/prototipos/<feature>
   git -C C:/Users/nberriel/Documents/GitHub/plantilla-prototipos archive HEAD -- . ':(exclude).githooks' ':(exclude).gitattributes' ':(exclude).nojekyll' | tar -x -C C:/Users/nberriel/Documents/GitHub/prototipos/<feature>
   ```
2. Si es el primer prototipo en ese clon de `prototipos`, activar el hook de versión en su raíz: `git config core.hooksPath .githooks`.
3. Completar `js/prototipo.js`: título, controles, pantallas y notas. Las instrucciones detalladas están en [`CLAUDE.md`](CLAUDE.md).
4. Reemplazar `css/prototipo.css` con los estilos de las pantallas, y poner el nombre en el `<title>` de `index.html`.
5. Agregar el prototipo al índice de `prototipos`: la lista `PROTOTIPOS` de su `index.html` y la tabla de su `README.md`. Publicado, se abre en `https://imasdev-org.github.io/prototipos/<feature>/`.

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Página: carga el núcleo y el prototipo |
| `js/nucleo.js` | Barra, solapa, vista con el marco de la pantalla, notas y pista de zonas (no se edita) |
| `css/nucleo.css` | Estilos del núcleo (no se edita) |
| `js/prototipo.js` | Configuración, pantallas y notas de la feature (ejemplo) |
| `css/prototipo.css` | Estilos de las pantallas de la feature (ejemplo); se cargan dentro del marco |
| `herramientas/subir-version.js` y `.githooks/` | Versión `?v=` en cada commit, para que un sitio publicado no sirva archivos viejos desde la caché |

## Cambios al núcleo

Si algo de la barra, las notas o las zonas tiene que cambiar, se cambia acá y se lleva a los prototipos que lo necesiten, copiando `js/nucleo.js` y `css/nucleo.css` de la plantilla a la carpeta de cada uno.

Los prototipos armados antes de las pantallas fluidas (con coordenadas fijas, `pos` y `zona`) no reciben el núcleo nuevo sin pasar antes sus pantallas a fluidas.
