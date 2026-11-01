#!/bin/bash
# PAN21 Meldestelle: Must-Use-Plugin in alle WordPress-Installationen des Servers legen
URL="https://shop.pan21.com/meldestelle/pan21-meldestelle.txt"
TMP=$(mktemp); curl -fsS "$URL" -o "$TMP" || { echo "Download fehlgeschlagen"; exit 1; }
grep -q "PAN21 Meldestelle" "$TMP" || { echo "Datei ungueltig"; exit 1; }
n=0
for cfg in $(find /var/www/vhosts -maxdepth 5 -name wp-config.php 2>/dev/null); do
  base=$(dirname "$cfg"); wc="$base/wp-content"
  [ -d "$wc" ] || continue
  owner=$(stat -c '%U:%G' "$wc")
  mkdir -p "$wc/mu-plugins"
  cp "$TMP" "$wc/mu-plugins/pan21-meldestelle.php"
  chown "$owner" "$wc/mu-plugins" "$wc/mu-plugins/pan21-meldestelle.php"
  chmod 644 "$wc/mu-plugins/pan21-meldestelle.php"
  echo "OK  $base"; n=$((n+1))
done
rm -f "$TMP"
echo "Fertig: $n WordPress-Installationen versorgt."
