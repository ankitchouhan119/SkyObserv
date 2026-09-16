#!/usr/bin/env bash
# Run SkyWalking OAP on AWS EC2 (t3.medium, 4 GB RAM) with Aiven OpenSearch.
#
# Aiven caps this cluster at 20 shards, so the index settings below are tuned
# to stay under it. SkyWalking defaults to 5 shards for segment/log indices
# (superDatasetIndexShardsFactor), which burns ~12 shards per day and blocks
# new index creation after a single day.
#
# Shard count depends on how many indices exist, not how many days they cover,
# so a 30-day dayStep keeps a month of history in the same shards a single day
# used to take. Zipkin and browser RUM receivers are off since nothing sends
# to them; leaving them on would create two permanently empty indices.
#
# dayStep cannot be changed at runtime — existing skywalking_* time-series
# indices must be dropped before restarting with a different value.
#
# Setup (one-time on EC2):
#   cp .env.example .env
#   nano .env   # fill OPENSEARCH_PASSWORD
#
# Start / restart OAP:
#   chmod +x ec2-docker-run.sh
#   ./ec2-docker-run.sh
#
# Verify (~3 min after start):
#   curl -s http://localhost:12800/graphql \
#     -H "Content-Type: application/json" \
#     -d '{"query":"{ version }"}'

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ ! -f .env ]]; then
  echo "Error: .env not found. Run: cp .env.example .env && nano .env"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

: "${OPENSEARCH_HOST:?OPENSEARCH_HOST is required in .env}"
: "${OPENSEARCH_USER:?OPENSEARCH_USER is required in .env}"
: "${OPENSEARCH_PASSWORD:?OPENSEARCH_PASSWORD is required in .env}"

docker stop skywalking-oap 2>/dev/null || true
docker rm skywalking-oap 2>/dev/null || true

docker run -d \
  --name skywalking-oap \
  --restart unless-stopped \
  --memory=2800m \
  -p 11800:11800 \
  -p 12800:12800 \
  -e SW_STORAGE=elasticsearch \
  -e SW_STORAGE_ES_CLUSTER_NODES="${OPENSEARCH_HOST}" \
  -e SW_STORAGE_ES_HTTP_PROTOCOL=https \
  -e SW_ES_USER="${OPENSEARCH_USER}" \
  -e SW_ES_PASSWORD="${OPENSEARCH_PASSWORD}" \
  -e SW_NAMESPACE=skywalking \
  -e SW_TELEMETRY=none \
  -e SW_CORE_GRPC_THREAD_POOL_SIZE=2 \
  -e SW_CORE_REST_THREAD_POOL_SIZE=2 \
  -e SW_STORAGE_ES_INDEX_SHARDS_NUMBER=1 \
  -e SW_STORAGE_ES_INDEX_REPLICAS_NUMBER=0 \
  -e SW_STORAGE_ES_SUPER_DATASET_INDEX_SHARDS_FACTOR=1 \
  -e SW_STORAGE_DAY_STEP=30 \
  -e SW_CORE_RECORD_DATA_TTL=30 \
  -e SW_CORE_METRICS_DATA_TTL=30 \
  -e SW_RECEIVER_ZIPKIN=- \
  -e SW_RECEIVER_BROWSER=- \
  -e JAVA_OPTS='-Xms768m -Xmx1536m -XX:MaxMetaspaceSize=384m -XX:CompressedClassSpaceSize=128m -XX:+UseSerialGC -XX:TieredStopAtLevel=1' \
  apache/skywalking-oap-server:10.0.0

echo ""
echo "OAP container started. Startup takes ~2-3 minutes."
echo "Check logs:  docker logs -f skywalking-oap"
echo "Health test: curl -s http://localhost:12800/graphql -H 'Content-Type: application/json' -d '{\"query\":\"{ version }\"}'"
