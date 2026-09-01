#!/bin/bash
# Switch Oracle VM from mock-oap to real SkyWalking OAP (Java)
set -euo pipefail

cd "$(dirname "$0")"

echo "Stopping mock OAP..."
docker compose -f docker-compose.mock.yml down 2>/dev/null || true

echo "Starting real SkyWalking OAP (H2 storage, tuned for 1GB VM)..."
docker compose -f docker-compose.e2-micro.yml up -d

echo ""
echo "Waiting for OAP to start (~2 min)..."
sleep 30

for i in $(seq 1 12); do
  if curl -sf http://localhost:12800/graphql -o /dev/null 2>/dev/null; then
    echo "✅ SkyWalking OAP is up!"
    echo "   GraphQL: http://$(curl -s ifconfig.me 2>/dev/null || echo '<PUBLIC_IP>'):12800"
    echo "   gRPC:    $(curl -s ifconfig.me 2>/dev/null || echo '<PUBLIC_IP>'):11800"
    exit 0
  fi
  echo "   still starting... ($i/12)"
  sleep 15
done

echo "⚠️  OAP may still be starting. Check logs:"
echo "   docker compose -f docker-compose.e2-micro.yml logs -f oap"
