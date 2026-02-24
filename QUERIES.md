Perfect bro 🔥
Ab main tumhe **ALL useful SkyWalking GraphQL queries** de raha hoon jo tumhare K8S UI + metrics + debugging ke kaam aayengi.

Ye sab **terminal se directly test kar sakte ho**.

---

# 🧠 1️⃣ List Clusters (K8S Layer)

```bash
curl -s -X POST http://localhost:12800/graphql \
-H "Content-Type: application/json" \
-d '{"query":"{ listServices(layer: \"K8S\") { name id } }"}' \
| python3 -m json.tool
```

---

# 🧠 2️⃣ List K8S Services (Namespace level services)

```bash
curl -s -X POST http://localhost:12800/graphql \
-H "Content-Type: application/json" \
-d '{"query":"{ listServices(layer: \"K8S_SERVICE\") { name id } }"}' \
| python3 -m json.tool
```

---

# 🧠 3️⃣ List Pods (Instances of Service)

👉 Replace `SERVICE_ID`

```bash
curl -s -X POST http://localhost:12800/graphql \
-H "Content-Type: application/json" \
-d '{"query":"{ listInstances(serviceId:\"SERVICE_ID\", duration:{start:\"2026-02-19 1200\", end:\"2026-02-19 1300\", step:MINUTE}) { id name } }"}' \
| python3 -m json.tool
```

---

# 🧠 4️⃣ Get Single Pod Detail

```bash
curl -s -X POST http://localhost:12800/graphql \
-H "Content-Type: application/json" \
-d '{"query":"{ getInstance(instanceId:\"INSTANCE_ID\") { name id attributes { name value } } }"}' \
| python3 -m json.tool
```

---

# 🧠 5️⃣ List ALL Available Metrics

```bash
curl -s -X POST http://localhost:12800/graphql \
-H "Content-Type: application/json" \
-d '{"query":"{ listMetrics { name } }"}' \
| python3 -m json.tool
```

---

# 🔥 6️⃣ Cluster CPU Usage

```bash
curl -s -X POST http://localhost:12800/graphql \
-H "Content-Type: application/json" \
-d '{"query":"{ execExpression(expression:\"k8s_cluster_cpu_cores\", entity:{ scope:Service, serviceName:\"k8s-cluster::\", normal:true }, duration:{start:\"2026-02-19 1200\", end:\"2026-02-19 1230\", step:MINUTE}) { results { values { id value } } error } }"}' \
| python3 -m json.tool
```

---

# 🔥 7️⃣ Cluster Memory Usage

```bash
curl -s -X POST http://localhost:12800/graphql \
-H "Content-Type: application/json" \
-d '{"query":"{ execExpression(expression:\"k8s_cluster_memory_total\", entity:{ scope:Service, serviceName:\"k8s-cluster::\", normal:true }, duration:{start:\"2026-02-19 1200\", end:\"2026-02-19 1230\", step:MINUTE}) { results { values { id value } } error } }"}' \
| python3 -m json.tool
```

---

# 🔥 8️⃣ Node CPU Usage

```bash
curl -s -X POST http://localhost:12800/graphql \
-H "Content-Type: application/json" \
-d '{"query":"{ execExpression(expression:\"k8s_node_cpu_usage\", entity:{ scope:Service, serviceName:\"k8s-cluster::\", normal:true }, duration:{start:\"2026-02-19 1200\", end:\"2026-02-19 1230\", step:MINUTE}) { results { values { id value } } error } }"}' \
| python3 -m json.tool
```

---

# 🔥 9️⃣ Node Memory Usage

```bash
curl -s -X POST http://localhost:12800/graphql \
-H "Content-Type: application/json" \
-d '{"query":"{ execExpression(expression:\"k8s_node_memory_usage\", entity:{ scope:Service, serviceName:\"k8s-cluster::\", normal:true }, duration:{start:\"2026-02-19 1200\", end:\"2026-02-19 1230\", step:MINUTE}) { results { values { id value } } error } }"}' \
| python3 -m json.tool
```

---

# 🔥 🔟 Pod CPU Usage

```bash
curl -s -X POST http://localhost:12800/graphql \
-H "Content-Type: application/json" \
-d '{"query":"{ execExpression(expression:\"k8s_service_pod_cpu_usage\", entity:{ scope:ServiceInstance, serviceName:\"k8s-cluster::kube-state-metrics.kube-system\", serviceInstanceName:\"POD_NAME\", normal:true }, duration:{start:\"2026-02-19 1200\", end:\"2026-02-19 1230\", step:MINUTE}) { results { values { id value } } error } }"}' \
| python3 -m json.tool
```

---

# 🔥 11️⃣ Pod Memory Usage

```bash
curl -s -X POST http://localhost:12800/graphql \
-H "Content-Type: application/json" \
-d '{"query":"{ execExpression(expression:\"k8s_service_pod_memory_usage\", entity:{ scope:ServiceInstance, serviceName:\"k8s-cluster::kube-state-metrics.kube-system\", serviceInstanceName:\"POD_NAME\", normal:true }, duration:{start:\"2026-02-19 1200\", end:\"2026-02-19 1230\", step:MINUTE}) { results { values { id value } } error } }"}' \
| python3 -m json.tool
```

---

# 🔥 12️⃣ Total Pods in Cluster

```bash
curl -s -X POST http://localhost:12800/graphql \
-H "Content-Type: application/json" \
-d '{"query":"{ execExpression(expression:\"k8s_cluster_pod_total\", entity:{ scope:Service, serviceName:\"k8s-cluster::\", normal:true }, duration:{start:\"2026-02-19 1200\", end:\"2026-02-19 1230\", step:MINUTE}) { results { values { id value } } error } }"}' \
| python3 -m json.tool
```

---

# 🔥 13️⃣ Node Status

```bash
curl -s -X POST http://localhost:12800/graphql \
-H "Content-Type: application/json" \
-d '{"query":"{ execExpression(expression:\"k8s_node_node_status\", entity:{ scope:Service, serviceName:\"k8s-cluster::\", normal:true }, duration:{start:\"2026-02-19 1200\", end:\"2026-02-19 1230\", step:MINUTE}) { results { values { id value } } error } }"}' \
| python3 -m json.tool
```

---

# 🚨 IMPORTANT NOTES

* Duration range **500 minutes se zyada nahi ho sakta**
* serviceName usually = `"k8s-cluster::"`
* step = `MINUTE` recommended
* Empty results = metric exist karta hai but data nahi aa raha

---

# 💪 If You Want

Main tumhare liye:

* 🔥 Complete working MQE dashboard config
* 🔥 Correct UI-ready queries
* 🔥 Auto dynamic duration queries
* 🔥 Proper production K8S observability architecture

Sab bana sakta hoon.

Tu ab advanced level pe aa gaya hai 😎
