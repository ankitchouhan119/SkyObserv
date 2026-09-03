# SkyObserv — DevOps Setup

Infrastructure, deployment, and monitoring for the SkyObserv application.
> **Challenges**: [CHALLENGES.md](./CHALLENGES.md)
> **Screenshots**: [SCREENSHOTS.md](./SCREENSHOTS.md)
> **Terraform**: [infra/terraform](https://github.com/ankitchouhan119/SkyObserv/tree/main/infra)
> **CI/CD**: [.github/workflows](https://github.com/ankitchouhan119/SkyObserv/tree/main/.github/workflows)

---

## Architecture

```
                        Internet
                           │
                    ┌──────▼──────┐
                    │  EC2 (pub)  │  :5000
                    │  t3.micro   │◄── GitHub Actions (SSH deploy)
                    └──────┬──────┘
                           │
              ┌────────────▼────────────┐
              │      VPC 10.0.0.0/16    │
              │                         │
              │  public-a  10.0.1.0/24  │
              │  public-b  10.0.2.0/24  │
              │                         │
              │  private-a 10.0.10.0/24 │
              │  private-b 10.0.11.0/24 │
              │            │            │
              │   ┌────────▼────────┐   │
              │   │  RDS PostgreSQL │   │
              │   │  db.t3.micro    │   │
              │   └─────────────────┘   │
              └─────────────────────────┘
```

EC2 sits in a public subnet for now — keeps the setup simple and avoids NAT Gateway cost. ALB + private subnet code is ready in `alb.tf` (flip `enable_alb = true` when needed).

CI/CD flow:
```
PR opened  →  CI: tests + Trivy scan
PR merged  →  build image → push GHCR → deploy staging → manual approval → deploy prod
```

---

## What Terraform creates

- VPC with public + private subnets across 2 AZs
- Internet Gateway + public route table
- EC2 in public subnet (port 5000 + 22)
- RDS PostgreSQL in private subnets
- IAM role for EC2 with CloudWatch agent permissions
- Security groups (app, rds, alb)
- **Optional:** ALB (`alb.tf`) and NAT Gateway (`vpc.tf`) — off by default

---

## Setup

### Prerequisites

- AWS CLI configured (`aws configure`)
- Terraform
- SSH key pair in AWS

### 1. Provision infra

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# set db_password and key_name

terraform init
terraform plan
terraform apply
```

```bash
terraform output app_public_ip
terraform output rds_endpoint
```

### 2. Remote state (optional but recommended)

```bash
# creates S3 bucket + DynamoDB table
./infra/terraform/backend-setup.sh

# then uncomment backend "s3" block in versions.tf and:
terraform init -migrate-state
```

### 3. GitHub secrets

| Secret | Value |
|--------|-------|
| `STAGING_HOST` | EC2 public IP |
| `PROD_HOST` | EC2 public IP |
| `SSH_PRIVATE_KEY` | Contents of `.pem` file |
| `GHCR_TOKEN` | GitHub PAT with `read:packages` |
| `SLACK_WEBHOOK` | Slack webhook (optional) |

`GITHUB_TOKEN` is injected automatically.

### 4. Env file on EC2

```bash
ssh -i ~/Downloads/skyobserv.pem ec2-user@<EC2_IP>

cat > /home/ec2-user/skyobserv.env << 'EOF'
NODE_ENV=production
PORT=5000
SESSION_COOKIE_SECURE=false
DATABASE_URL=postgresql://skyobservuser:<password>@<rds_endpoint>:5432/skyobservdb?sslmode=require
SESSION_SECRET=<random-32-char-string>
SKYOBSERV_AUTH_ENABLED=true
SKYOBSERV_ADMIN_EMAIL=<your-email>
SKYOBSERV_ADMIN_PASSWORD=<strong-password>
SKYWALKING_ENDPOINT=http://<oap-host>:12800
SKYWALKING_GRPC_COLLECTOR=<oap-host>:11800
ACCESS_LOG_PATH=/var/log/skyobserv/access.log
EOF
```

### 5. Deploy

Push to `main` or re-run the CD workflow from GitHub Actions.

First deploy — run schema migration:
```bash
sudo docker run --rm \
  --env-file /home/ec2-user/skyobserv.env \
  ghcr.io/<owner>/skyobserv:<sha> \
  npx drizzle-kit push
```

### 6. Production approval gate

Settings → Environments → `production` → add required reviewer. CD pipeline waits here before prod deploy.

### 7. CloudWatch (manual — AWS console)

EC2 user_data installs and configures the CloudWatch agent on boot. Just create the log groups in the console (7 day retention):

- `/skyobserv/app` — Docker container stdout
- `/skyobserv/access` — HTTP access logs
- `/skyobserv/system` — OS system logs

Then create dashboards:
- `skyobserv-infra` — EC2 CPU, memory (`CWAgent/mem_used_percent`), disk (`CWAgent/disk_used_percent`)
- `skyobserv-rds` — RDS CPU, connections, free storage

### 8. Destroy

```bash
cd infra/terraform
terraform destroy
```

After recreating, update GitHub secrets with new EC2 IP and update `DATABASE_URL` in `skyobserv.env`.

---

## Architecture decisions

**EC2 over ECS/EKS** — Single instance is fine at this scale. ECS would be the next step if we needed auto-scaling, but that's premature for now.

**Public subnet, no ALB** — The ALB alone costs more than the EC2. For this setup direct access on port 5000 works fine. `alb.tf` has the full config if needed.

**GHCR over ECR** — Free with GitHub, no extra AWS setup. `GITHUB_TOKEN` handles auth in Actions automatically.

**`docker image prune` on deploy** — Cleans up old images before pulling new one. Avoids disk fill on a 20GB volume. Using `system prune` was too aggressive — it removes volumes too.

**`unless-stopped` restart policy** — Lets you stop the container manually for debugging without it immediately restarting. `always` made troubleshooting painful.

**RDS in private subnet** — Even if a security group rule was misconfigured, the database isn't reachable from the internet without going through the EC2 first.

---

## Security considerations

**Secrets handling** — App secrets are in `/home/ec2-user/skyobserv.env` on the EC2, not baked into the image or committed to git. CI/CD credentials live in GitHub encrypted secrets. `.env` is in `.gitignore`.

**SSH** — Port 22 is open to `0.0.0.0/0` for convenience. In production this should be locked to a specific IP or replaced with AWS SSM Session Manager.

**RDS** — Not publicly accessible, SSL enforced (`sslmode=require`). Only the app security group can reach port 5432.

**Container** — Runs as non-root. No `--privileged`. Volume mount only for `/var/log/skyobserv`.

**Trade-offs made for this setup:**
- `SESSION_COOKIE_SECURE=false` because we're on HTTP not HTTPS
- SSH private key in GitHub secrets is fine for assignment, not ideal for production
- No HTTPS/TLS termination — would normally sit behind an ALB with ACM cert

---

## Cost optimization

Running this on ap-south-1, the monthly bill comes to roughly $25-30. The two biggest line items are RDS (~half the total) and EC2. ALB and NAT Gateway are both off — together they'd add another $40-50/month which isn't worth it for an assignment.

A few things that could cut costs further:
- Drop to `t3.nano` if the app stays light
- Schedule EC2 to stop outside working hours
- Use RDS `db.t3.micro` with single-AZ (already doing this)

---

## Backup strategy

RDS has `backup_retention_period = 7` so AWS handles daily automated backups with point-in-time recovery. For a manual snapshot before a risky deploy:

```bash
./infra/scripts/backup-rds.sh skyobserv-postgres
```

The script also deletes manual snapshots older than 30 days.

---

## Troubleshooting

**Container keeps restarting:**
```bash
sudo docker logs skyobserv --tail 50
```
Usually a bad `DATABASE_URL` or RDS not reachable yet.

**CloudWatch agent not running:**
```bash
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
```

**Disk full:**
```bash
sudo docker image prune -af
df -h
```

If still low, resize EBS from the AWS console then on the instance:
```bash
sudo growpart /dev/nvme0n1 1
sudo xfs_growfs /
```

**RDS connection refused:**
- Check security group — EC2 SG must be the allowed source on 5432
- Make sure `?sslmode=require` is in `DATABASE_URL`
