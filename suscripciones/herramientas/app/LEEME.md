# Base real de la vista App

Las pantallas de la app (menú «Mis Datos», «Membresías», «Privacidad» y la edición «Mis datos») se capturaron en el
simulador iPhone 15 del Mac, con la app de trunk local y un cliente de prueba con dos membresías.

- `cap.sh`: corre en el Mac; toca por id, desplaza y guarda capturas y textos (`/tmp/wi14058`).
- `medir.js`: mide colores y alturas de texto sobre las capturas.
- `recortar.js`: recorta los íconos reales a `sitio/app/` (rects en pt del árbol de XCUITest; captura 3x).

Las capturas no se suben al repo: tienen los datos del usuario de prueba.
