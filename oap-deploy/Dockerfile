# SkyWalking OAP — optimized for Koyeb free tier (512MB RAM)
# Storage: H2 in-memory (no external DB needed for OAP itself)
FROM apache/skywalking-oap-server:10.0.0

# Aggressive JVM tuning to fit within 512MB container limit
ENV JAVA_OPTS="-Xms64m -Xmx360m -XX:MaxMetaspaceSize=96m \
  -XX:CompressedClassSpaceSize=32m \
  -XX:+UseSerialGC \
  -XX:+TieredCompilation -XX:TieredStopAtLevel=1"

# H2 in-memory storage — lightweight, no Elasticsearch needed
ENV SW_STORAGE=h2
ENV SW_HEALTH_CHECKER=default
ENV SW_TELEMETRY=none

# Reduce core worker threads
ENV SW_CORE_GRPC_THREAD_POOL_SIZE=4
ENV SW_CORE_REST_THREAD_POOL_SIZE=4

EXPOSE 11800 12800
