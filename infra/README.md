# SkyObserv Infrastructure

Terraform config for provisioning the AWS infra — VPC, ALB, EC2, RDS (Part 1 of DevOps assignment).

## What gets created

- VPC with public + private subnets across 2 AZs
- Internet Gateway
- EC2 in **public** subnet (app on port 5000, SSH on 22)
- RDS PostgreSQL in private subnet
- IAM role for EC2 (CloudWatch agent permissions)
- **Optional (off by default):** ALB (`alb.tf`) and NAT Gateway (`vpc.tf`)

CloudWatch dashboards/alarms/log groups — setup manually in AWS console (see below).

## How to run

```bash
cd infra/terraform

cp terraform.tfvars.example terraform.tfvars
# fill in db_password

terraform init
terraform plan
terraform apply
```

After apply:

```bash
terraform output app_public_ip
terraform output rds_endpoint
```

If `enable_alb = true`, also: `terraform output alb_dns_name`

## Remote state setup (optional)

Run `./backend-setup.sh` to create the S3 bucket and DynamoDB table, then uncomment the `backend "s3"` block in `versions.tf` and run:

```bash
terraform init -migrate-state
```

## Cleanup

```bash
terraform destroy
```

## Part 2: CI/CD (GitHub Actions)

Workflows are in `.github/workflows/`:

- **`ci.yml`** — runs on every PR to main: TypeScript check, `npm audit`, Trivy container scan
- **`cd.yml`** — runs on merge to main: builds Docker image → pushes to GHCR → deploys to staging → manual approval → deploys to prod + Slack notify

### Secrets needed (Settings → Secrets → Actions)

| Secret | What it is |
|---|---|
| `STAGING_HOST` | Staging EC2 public IP |
| `PROD_HOST` | Prod EC2 public IP (same as ALB target for now) |
| `SSH_PRIVATE_KEY` | Private key to SSH into EC2 |
| `SLACK_WEBHOOK` | Slack incoming webhook URL |

`GITHUB_TOKEN` is auto-provided by GitHub, no setup needed.

### Manual approval for production

Go to **Settings → Environments → production** and add yourself as a required reviewer. The CD pipeline will pause before the prod deploy step until you approve.

### `.env` file on EC2

The deploy script expects `/home/ec2-user/skyobserv.env` on both staging and prod EC2s with the app's environment variables (DB connection, session secret, etc).

## Notes

- EC2 is in a public subnet with direct internet access — no NAT needed for the assignment setup
- ALB and NAT code is in the repo for review; both default to **off** (`enable_alb = false`, `enable_nat = false`) to save cost
- `skip_final_snapshot = true` on RDS since this is for dev/assignment use
- EC2 boots with docker + CloudWatch agent via user_data; CI/CD deploys the app image

## Fresh destroy + apply

```bash
cd infra/terraform
terraform destroy    # deletes EC2, RDS, VPC — all data gone
terraform apply
```

After apply, update:

1. **GitHub secrets** — `STAGING_HOST` / `PROD_HOST` → new EC2 public IP (`terraform output app_public_ip`)
2. **EC2** — create `/home/ec2-user/skyobserv.env` with new `DATABASE_URL` (`terraform output rds_endpoint`)
3. **Redeploy app** — push to main or re-run CD workflow

## Part 3: Monitoring (manual — AWS console)

Terraform sirf infra banata hai. CloudWatch cheezein console se karni hain — EC2 pe agent user_data se install ho jata hai, bas log groups + dashboards khud banao.

### Log groups (CloudWatch → Log groups → Create)

| Name | Kya aata hai |
|------|----------------|
| `/skyobserv/app` | Docker container logs |
| `/skyobserv/access` | HTTP access log (`/var/log/skyobserv/access.log`) |
| `/skyobserv/system` | `/var/log/messages` |

Retention 7 days rakho.

Agent config EC2 `user_data` mein already hai. Agar logs nahi aa rahe to SSH karke agent restart karo:

```bash
sudo systemctl status amazon-cloudwatch-agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
```

Agent config mein `append_dimensions` → `InstanceId` zaroor ho, warna memory/disk dashboard pe data nahi dikhega.

### Dashboards (CloudWatch → Dashboards → Create)

**skyobserv-infra** — 3 widgets:
- EC2 CPU → `AWS/EC2` → `CPUUtilization` → InstanceId = apna instance
- EC2 Memory → `CWAgent` → `mem_used_percent` → InstanceId
- EC2 Disk → `CWAgent` → `disk_used_percent` → InstanceId, path `/`, fstype `xfs`

**skyobserv-rds** — RDS instance `skyobserv-postgres`:
- CPUUtilization, DatabaseConnections, FreeStorageSpace

**skyobserv-app** — pehle access log group pe metric filters banao (`/skyobserv/access`):

| Filter name | Pattern | Metric |
|-------------|---------|--------|
| request-count | `{ $.method = "*" }` | `SkyObserv/App` → RequestCount, value 1 |
| error-count | `{ $.status >= 500 }` | `SkyObserv/App` → ErrorCount, value 1 |
| latency | `{ $.duration_ms = "*" }` | `SkyObserv/App` → Latency, value `$.duration_ms` |

Phir dashboard widgets: RequestCount (Sum), Error rate (math: `100*errors/requests`), Latency (Average).

### Alarms (optional)

- `skyobserv-ec2-cpu-high` — EC2 CPU > 80% for 2 periods
- `skyobserv-rds-cpu-high` — RDS CPU > 80% for 2 periods
