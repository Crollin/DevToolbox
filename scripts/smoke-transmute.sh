#!/usr/bin/env bash
# Smoke File Converter contre une instance Transmute + backend DevToolbox.
# Prérequis :
#   - Backend avec TRANSMUTE_BASE_URL + TRANSMUTE_API_KEY
#   - Variables : DEVTOOLBOX_API (défaut http://localhost:1400/api)
#                 DEVTOOLBOX_EMAIL / DEVTOOLBOX_PASSWORD (compte existant)
#                 SMOKE_IMAGE (chemin fichier image)
#                 SMOKE_DOC (chemin fichier document optionnel)
#
# Usage :
#   DEVTOOLBOX_EMAIL=you@example.com DEVTOOLBOX_PASSWORD=secret \
#   SMOKE_IMAGE=./photo.jpg SMOKE_DOC=./notes.md \
#   ./scripts/smoke-transmute.sh

set -euo pipefail

API="${DEVTOOLBOX_API:-http://localhost:1400/api}"
EMAIL="${DEVTOOLBOX_EMAIL:?DEVTOOLBOX_EMAIL requis}"
PASSWORD="${DEVTOOLBOX_PASSWORD:?DEVTOOLBOX_PASSWORD requis}"
IMAGE="${SMOKE_IMAGE:?SMOKE_IMAGE requis (chemin fichier)}"
DOC="${SMOKE_DOC:-}"

echo "== Config =="
curl -sS "$API/config" | tee /tmp/dt-config.json
echo
grep -q '"transmuteEnabled":true' /tmp/dt-config.json || {
  echo "transmuteEnabled n’est pas true — configure TRANSMUTE_* sur le backend"
  exit 1
}

echo "== Login =="
TOKEN=$(curl -sS -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')

auth=(-H "Authorization: Bearer $TOKEN")

convert_one() {
  local file="$1"
  local prefer="$2"
  echo "== Upload $file =="
  UP=$(curl -sS -X POST "$API/transmute/files" "${auth[@]}" -F "file=@${file}")
  echo "$UP"
  FILE_ID=$(echo "$UP" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')
  FMT=$(echo "$UP" | python3 -c "import sys,json; f=json.load(sys.stdin)['compatibleFormats']; print('$prefer' if '$prefer' in f else (f[0] if f else ''))")
  if [[ -z "$FMT" ]]; then
    echo "Aucun format compatible"
    exit 1
  fi
  echo "== Convert → $FMT =="
  CONV=$(curl -sS -X POST "$API/transmute/conversions" "${auth[@]}" \
    -H 'Content-Type: application/json' \
    -d "{\"fileId\":\"$FILE_ID\",\"outputFormat\":\"$FMT\"}")
  echo "$CONV"
  OUT_ID=$(echo "$CONV" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')
  OUT="/tmp/dt-transmute-${OUT_ID}.${FMT}"
  curl -sS -o "$OUT" "$API/transmute/files/${OUT_ID}/download" "${auth[@]}"
  echo "OK → $OUT ($(wc -c < "$OUT") octets)"
}

convert_one "$IMAGE" "webp"
if [[ -n "$DOC" ]]; then
  convert_one "$DOC" "pdf"
fi

echo "Smoke Transmute terminé."
