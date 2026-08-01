#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# MongoDB kunlik zaxirasi.
# crontab: 0 3 * * * /var/www/gozalayol/deploy/backup.sh >> /var/log/gozalayol/backup.log 2>&1
# ─────────────────────────────────────────────────────────────
set -euo pipefail

DB_NAME="${DB_NAME:-gozal_ayol}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/gozalayol}"
UPLOADS_DIR="${UPLOADS_DIR:-/var/www/gozalayol/uploads}"
KEEP_DAYS="${KEEP_DAYS:-14}"

STAMP="$(date +%Y-%m-%d_%H%M)"
mkdir -p "$BACKUP_DIR"

echo "[$(date '+%F %T')] zaxira boshlandi: $STAMP"

# ── Baza
mongodump --db="$DB_NAME" --archive="$BACKUP_DIR/db-$STAMP.gz" --gzip --quiet

# ── Rasmlar
# Bazadagi fayl nomlari rasmlarsiz ma'nosiz: ikkalasi birga saqlanadi
if [ -d "$UPLOADS_DIR" ]; then
  tar -czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"
fi

# ── Eskilarini tozalash
find "$BACKUP_DIR" -name 'db-*.gz' -mtime "+$KEEP_DAYS" -delete
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime "+$KEEP_DAYS" -delete

# ⚠️ Tekshirilmagan zaxira — zaxira emas.
# Arxiv bo'sh yoki juda kichik bo'lsa, jimgina o'tib ketmaydi
SIZE=$(stat -c%s "$BACKUP_DIR/db-$STAMP.gz")
if [ "$SIZE" -lt 1024 ]; then
  echo "❌ XATO: zaxira juda kichik ($SIZE bayt). Tekshiring!"
  exit 1
fi

echo "[$(date '+%F %T')] tayyor: $(du -sh "$BACKUP_DIR" | cut -f1) jami"
