#!/bin/bash
# Captura de pantallas de la app (sim-iphone15, app de trunk) para WI-14058. Corre EN LA MAC.
export TI_BUNDLE=com.imasdev.tiendatrunk TI_UDID=74329D23-0EA7-464D-AC17-21F1841DC0A4 TI_WDA_PORT=8103
D=~/TiendaScripts/appium/dummyhost/appdrv.sh
SID=$(cat "$($D sessfile)")
O=/tmp/wi14058
swipe() { curl -s -X POST -H 'Content-Type: application/json' -d "{\"script\":\"mobile: swipe\",\"args\":[{\"direction\":\"$1\"}]}" http://127.0.0.1:4723/session/$SID/execute/sync >/dev/null; sleep 1.5; }
textos() { $D src 2>/dev/null | grep -o -E 'label="[^"]{2,120}"' | sort -u | tr '\n' ' '; echo; }
case "$1" in
  abajo)  swipe up; swipe up; $D shot $O/$2.png >/dev/null; textos;;
  arriba) swipe down; swipe down; swipe down;;
  tap)    $D tapid "$2"; sleep "${4:-6}"; $D shot $O/$3.png >/dev/null; textos;;
  shot)   $D shot $O/$2.png >/dev/null; textos;;
  back)   curl -s -X POST http://127.0.0.1:4723/session/$SID/back >/dev/null; sleep 3;;
esac
