#!/usr/bin/env bash
# Run as root on master node M0 (176.53.174.118)
set -euo pipefail

echo "==> Configuring avari-site deployment environment on M0..."

# 1. Create avari-site-deploy user if missing
if ! id -u avari-site-deploy >/dev/null 2>&1; then
  useradd -m -s /bin/bash -c "Avari.dev Site Deploy Agent" avari-site-deploy
  echo "    [+] Created user avari-site-deploy"
else
  echo "    [+] User avari-site-deploy exists"
fi

# 2. Setup SSH directory
mkdir -p /home/avari-site-deploy/.ssh
touch /home/avari-site-deploy/.ssh/authorized_keys
chown -R avari-site-deploy:avari-site-deploy /home/avari-site-deploy/.ssh
chmod 700 /home/avari-site-deploy/.ssh
chmod 600 /home/avari-site-deploy/.ssh/authorized_keys

# 3. Install deploy scripts
mkdir -p /var/www/avari.dev/releases /var/www/avari.dev/backups
chown -R root:root /var/www/avari.dev

cp /tmp/deploy.sh /usr/local/sbin/avari-site-deploy
chmod 755 /usr/local/sbin/avari-site-deploy
chown root:root /usr/local/sbin/avari-site-deploy

cp /tmp/ssh-command.sh /usr/local/sbin/avari-site-ssh-command
chmod 755 /usr/local/sbin/avari-site-ssh-command
chown root:root /usr/local/sbin/avari-site-ssh-command

# 4. Sudoers rule
cat <<'EOF' > /etc/sudoers.d/avari-site-deploy
avari-site-deploy ALL=(root) NOPASSWD: /usr/local/sbin/avari-site-deploy *
EOF
chmod 440 /etc/sudoers.d/avari-site-deploy

echo "==> Server configuration completed successfully!"
