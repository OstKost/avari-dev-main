#!/usr/bin/env bash
# Installed root-owned on master node M0; git archive arrives on stdin.
set -euo pipefail
[[ $# == 1 && $1 =~ ^[a-f0-9]{40}$ ]] || { echo "Usage: avari-site-deploy <40-char SHA>" >&2; exit 2; }

exec 9>/var/lock/avari-site-deploy.lock
flock -w 300 9

base="/var/www/avari.dev"
release="$1"
mkdir -p "$base/releases" "$base/backups"
stage=$(mktemp -d "$base/releases/.incoming.XXXXXX")
trap 'rm -rf "$stage"' EXIT

# Extract git archive stream
tar --extract --gzip --no-same-owner --no-same-permissions --file=- --directory="$stage"

# Validate critical site files
if [[ ! -s "$stage/index.html" || ! -d "$stage/assets" || ! -d "$stage/screenshots" ]]; then
  echo "Error: Release archive missing essential site files (index.html, assets, screenshots)" >&2
  exit 1
fi

# Move staging into release directory
rm -rf "$base/releases/$release"
mv "$stage" "$base/releases/$release"
trap - EXIT

# Atomic symlink update: current -> releases/$release
ln -sfn "$base/releases/$release" "$base/current.next"
mv -T "$base/current.next" "$base/current"

# Ensure /var/www/stubs/avari.dev points to the new current release
if [[ -d /var/www/stubs/avari.dev && ! -L /var/www/stubs/avari.dev ]]; then
  # First time migration: backup old directory and create symlink
  mv /var/www/stubs/avari.dev "$base/backups/initial-migration-$(date -u +%Y%m%d%H%M%S)"
fi
ln -sfn "$base/current" /var/www/stubs/avari.dev

# Keep only latest 5 releases, purge older ones
find "$base/releases" -maxdepth 1 -mindepth 1 -type d ! -name ".*" | sort -r | tail -n +6 | xargs -r rm -rf

echo "Successfully deployed avari.dev release $release"
