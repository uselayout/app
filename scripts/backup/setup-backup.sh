#!/bin/bash
# Setup nightly pg_dump backup for sd_aistudio_* tables
# Run this ON the VPS: bash setup-backup.sh
set -euo pipefail

BACKUP_DIR="/opt/backups/postgres"
SCRIPT_PATH="${BACKUP_DIR}/backup.sh"

echo "==> Creating backup directory..."
sudo mkdir -p "${BACKUP_DIR}"

echo "==> Writing backup script..."
sudo tee "${SCRIPT_PATH}" > /dev/null << 'SCRIPT'
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="${BACKUP_DIR}/sd_aistudio_${TIMESTAMP}.sql.gz"

PGPASSWORD="gbeWVRpRTCVMyWxv0pxQ7rjlCJ2Ku3fN" pg_dump \
  -h 127.0.0.1 \
  -p 5432 \
  -U postgres \
  -d postgres \
  --no-owner \
  --no-privileges \
  -t 'sd_aistudio_*' \
  | gzip > "${DUMP_FILE}"

# Keep only last 14 days
find "${BACKUP_DIR}" -name "sd_aistudio_*.sql.gz" -mtime +14 -delete

echo "[$(date)] Backup complete: ${DUMP_FILE} ($(du -h "${DUMP_FILE}" | cut -f1))"
SCRIPT

sudo chmod +x "${SCRIPT_PATH}"

echo "==> Installing cron job (3am daily)..."
# Add cron job if not already present
(sudo crontab -l 2>/dev/null | grep -v "backup.sh"; echo "0 3 * * * ${SCRIPT_PATH} >> ${BACKUP_DIR}/backup.log 2>&1") | sudo crontab -

echo "==> Running test backup..."
sudo "${SCRIPT_PATH}"

echo ""
echo "==> Done! Backup schedule:"
sudo crontab -l | grep backup
echo ""
echo "Backups stored in: ${BACKUP_DIR}"
ls -lh "${BACKUP_DIR}"/*.sql.gz 2>/dev/null || true
