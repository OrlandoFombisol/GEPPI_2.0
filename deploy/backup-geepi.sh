#!/bin/bash
# Respaldo diario de GEEPI: base de datos (usuarios, tablas y datos) y archivos de evidencias.
# Se conservan 14 días, igual que ATLAS. Lo corre el cron del servidor junto al de ATLAS.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p respaldos && chmod 700 respaldos
FECHA=$(date +%F)
docker compose -p geepi exec -T db pg_dumpall -U postgres | gzip > "respaldos/geepi_db_$FECHA.sql.gz.tmp"
mv "respaldos/geepi_db_$FECHA.sql.gz.tmp" "respaldos/geepi_db_$FECHA.sql.gz"
docker run --rm -v geepi_geepi-archivos:/archivos:ro -v "$PWD/respaldos:/respaldos" alpine:3.20 \
  tar czf "/respaldos/geepi_archivos_$FECHA.tar.gz" -C /archivos .
find respaldos -name "geepi_*" -mtime +14 -delete
echo "$(date -Is) respaldo GEEPI ok"
