# SkyWalking OAP on Oracle Cloud (Always Free)

Deploy real Apache SkyWalking OAP on Oracle's free ARM VM (up to 24GB RAM).

## Part A — Oracle Console (one-time)

### 1. Create a VM Instance

1. Go to **Compute → Instances → Create Instance**
2. **Name:** `skywalking-oap`
3. **Image:** Ubuntu 22.04 or 24.04 (aarch64)
4. **Shape:** `VM.Standard.A1.Flex` (Always Free)
   - **OCPUs:** 1 (or 2)
   - **Memory:** 6 GB (or 12 GB — still free)
5. **Networking:** Assign a **public IPv4**
6. **SSH keys:** Upload your public key or let Oracle generate one (download the private key)
7. Click **Create**

### 2. Open Security List (firewall)

1. Click your instance → **Subnet** → **Security List** → **Add Ingress Rules**

| Source CIDR | Protocol | Dest Port | Description |
|---|---|---|---|
| `0.0.0.0/0` | TCP | 22 | SSH |
| `0.0.0.0/0` | TCP | 12800 | SkyWalking GraphQL (SkyObserv) |
| `0.0.0.0/0` | TCP | 11800 | SkyWalking gRPC (agents) |
| `0.0.0.0/0` | TCP | 8080 | Demo app (optional) |

> For production, restrict `12800` and `11800` to your IP only.

---

## Part B — SSH into VM and deploy

### 1. Connect

```bash
ssh -i ~/.ssh/oracle_key ubuntu@<VM_PUBLIC_IP>
```

### 2. Clone repo (or copy oap-deploy folder)

```bash
git clone https://github.com/ankitchouhan119/SkyObserv.git
cd SkyObserv/oap-deploy
```

### 3. Configure environment

```bash
cp .env.example .env
nano .env
```

Fill in your Aiven OpenSearch credentials:

```
OPENSEARCH_HOST=skyobserve-es-travobuds-stg.f.aivencloud.com:16148
OPENSEARCH_USER=avnadmin
OPENSEARCH_PASSWORD=<your_actual_password>
SW_STORAGE=elasticsearch
```

### 4. Run setup script

```bash
chmod +x setup-oracle.sh
./setup-oracle.sh
```

Or manually:

```bash
docker compose up -d oap
```

### 5. Verify OAP is running (~2 min startup)

```bash
curl -s http://localhost:12800/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ version }"}' 
```

---

## Part C — Connect SkyObserv

Update SkyObserv (Render) environment variable:

```
SKYWALKING_ENDPOINT=http://<VM_PUBLIC_IP>:12800
```

Or local `.env`:

```
SKYWALKING_ENDPOINT=http://<VM_PUBLIC_IP>:12800
```

---

## Part D — Connect Travobuds (later)

Add SkyWalking agent to your travobuds app:

**Node.js:**
```bash
npm install skywalking-backend-js
```

```js
const agent = require('skywalking-backend-js');
agent.start({
  serviceName: 'travobuds-api',
  collectorAddress: '<VM_PUBLIC_IP>:11800',
});
```

**Java:**
```bash
-javaagent:/path/to/skywalking-agent.jar
-Dskywalking.agent.service_name=travobuds-api
-Dskywalking.collector.backend_service=<VM_PUBLIC_IP>:11800
```

---

## Optional: Demo app (sample traces)

```bash
# On VM — needs jarfiles from repo
docker compose --profile demo up -d
```

Demo bookstore runs on `http://<VM_PUBLIC_IP>:8080` and sends traces to OAP.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| OAP won't start | Check logs: `docker compose logs -f oap` |
| OpenSearch connection failed | Verify `.env` credentials; check Aiven allows your VM IP |
| SkyObserv can't reach OAP | Open port 12800 in Oracle Security List |
| Travobuds agent not reporting | Open port 11800; verify collector address |
