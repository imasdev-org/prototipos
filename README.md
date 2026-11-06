# Prototipos

Prototipos navegables de las features en diseño, todos en un mismo repositorio y publicados con GitHub Pages.

**Índice:** <https://imasdev-org.github.io/prototipos/>

Cada prototipo vive en su carpeta y se abre en `https://imasdev-org.github.io/prototipos/<carpeta>/`.

| Carpeta | Prototipo |
|---|---|
| [`suscripciones`](suscripciones/) | Suscripciones · Tienda Inglesa web y app (WI-14058) |
| [`carritos-por-tienda`](carritos-por-tienda/) | Carritos por tienda · Tienda Inglesa web (WI-13898) |
| [`selector-millas-itau`](selector-millas-itau/) | Selector de millas · Tienda Volar (Itaú) |
| [`cobertura-domicilios-web`](cobertura-domicilios-web/) | Alta de domicilio · Tienda Inglesa web (WI-12790) |

## Sumar un prototipo

1. Copiar la plantilla en una carpeta nueva, sin su `.git`. El nombre de la carpeta es el de la feature, en minúsculas y con guiones:
   `git clone C:\Users\nberriel\Documents\GitHub\plantilla-prototipos <este repo>\<feature>` y después borrar `<feature>\.git`.
   Borrar también `.githooks`, `.gitattributes` y `.nojekyll` de la carpeta nueva: los de la raíz del repo valen para todos los prototipos.
2. Usar solo rutas relativas (`css/...`, `js/...`). Una ruta que empieza con `/` apunta a la raíz del sitio y no carga dentro de una carpeta.
3. Agregar la tarjeta en la lista `PROTOTIPOS` de [`index.html`](index.html) y la fila en la tabla de arriba.

## Versión en cada commit

GitHub Pages deja los archivos en la caché del navegador hasta 10 minutos. El hook de `.githooks/pre-commit` corre el `herramientas/subir-version.js` de cada carpeta tocada en el commit, y ese script le pone `?v=fecha-hora` a los archivos que carga su `index.html`. Se activa una vez por clon:

```
git config core.hooksPath .githooks
```

## Prototipos ya implementados

No se borran. Se marcan con `archivo: true` en la lista de `index.html` y pasan a la sección «Archivo» del índice. La carpeta no se mueve, así los links que ya circularon siguen funcionando.
