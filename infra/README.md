# SkyObserv Infrastructure

Terraform config for provisioning the AWS infra — VPC, ALB, EC2, RDS (Part 1 of DevOps assignment).

## What gets created

- VPC with public + private subnets across 2 AZs
- Internet Gateway + single NAT Gateway
- Application Load Balancer (public)
- EC2 in private subnet (nginx placeholder until Part 2 deploys actual app)
- RDS PostgreSQL in private subnet

## How to run

```bash
cd infra/terraform

cp terraform.tfvars.example terraform.tfvars
# fill in db_password

terraform init
terraform plan
terraform apply
```

After apply, grab the ALB URL:

```bash
terraform output alb_dns_name
```

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

- EC2 is in a public subnet with direct internet access — no NAT gateway needed, keeps cost down
- ALB config is in `alb.tf` but not applied (saves ~$16/month for assignment). In production, EC2 would sit behind ALB in private subnet
- `skip_final_snapshot = true` on RDS since this is for dev/assignment use
- EC2 boots with docker + CloudWatch agent via user_data; CI/CD pipeline deploys the actual app image
