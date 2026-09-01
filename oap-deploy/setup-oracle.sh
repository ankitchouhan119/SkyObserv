#!/bin/bash
set -euo pipefail

echo "=== SkyWalking OAP — Oracle Cloud VM Setup ==="

# ── 1. Install Docker (Ubuntu) ──────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "[1/4] Installing Docker..."
  sudo apt-get update -qq
  sudo apt-get install -y ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -qq
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  sudo usermod -aG docker "$USER"
  echo "Docker installed. You may need to log out and back in for group changes."
else
  echo "[1/4] Docker already installed."
fi

# ── 2. Firewall (UFW) ───────────────────────────────────────
echo "[2/4] Opening ports 11800 (gRPC) and 12800 (GraphQL)..."
sudo ufw allow 22/tcp   2>/dev/null || true
sudo ufw allow 11800/tcp 2>/dev/null || true
sudo ufw allow 12800/tcp 2>/dev/null || true
sudo ufw --force enable 2>/dev/null || true

# ── 3. Environment file ─────────────────────────────────────
echo "[3/4] Checking .env file..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — EDIT IT with your OpenSearch password!"
  echo "  nano .env"
  exit 1
fi

# ── 4. Start SkyWalking OAP ─────────────────────────────────
echo "[4/4] Starting SkyWalking OAP..."
docker compose pull
docker compose up -d oap

echo ""
echo "=== Done! ==="
echo "Wait ~2 minutes for OAP to start, then test:"
echo "  curl http://localhost:12800/graphql"
echo ""
echo "Public URL (use VM public IP):"
echo "  SKYWALKING_ENDPOINT=http://<VM_PUBLIC_IP>:12800"
echo ""
echo "Optional demo app (generates sample traces):"
echo "  docker compose --profile demo up -d"
