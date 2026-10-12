#!/usr/bin/env bash
# Fails the build if a SECRET Supabase key was pasted where the public one belongs.
# Everything VITE_* is bundled into the website, so a secret key here would be public to the world.
set -euo pipefail
key="${VITE_SUPABASE_PUBLISHABLE_KEY:-}"

if [ -z "$key" ] || [ -z "${VITE_SUPABASE_URL:-}" ]; then
  echo "ERROR: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set."; exit 1
fi
case "$key" in
  sb_secret_*) echo "ERROR: this is a SECRET key (sb_secret_...). Use the publishable key."; exit 1 ;;
esac
# Legacy JWT-style keys: decode the payload and make sure the role is not service_role
if [[ "$key" == eyJ* ]]; then
  payload=$(echo "$key" | cut -d. -f2 | tr '_-' '/+')
  while [ $(( ${#payload} % 4 )) -ne 0 ]; do payload="${payload}="; done
  if echo "$payload" | base64 -d 2>/dev/null | grep -q '"role":"service_role"'; then
    echo "ERROR: this is the service_role key. Use the anon / publishable key."; exit 1
  fi
fi
echo "OK: key looks like a public (anon/publishable) key."
