# Terraform Files — Walkthrough

This document explains every Terraform file in this project as if you are walking an interviewer through the code. It is written in simple English.

**Important idea to state up front:**

> I organized files by layer (network, security, compute, database) for readability. Terraform does not run files top to bottom. It builds a dependency graph from references like `aws_vpc.main.id` and creates resources in that order.

---

## How the files fit together

```
versions.tf / backend-config.hcl   →  Terraform + AWS setup, remote state
variables.tf / terraform.tfvars    →  Inputs (staging vs prod values)
vpc.tf                             →  Network (VPC, subnets, routing)
security_groups.tf                 →  Firewall rules
iam.tf                             →  Permissions for EC2
ec2.tf                             →  Application server
rds.tf                             →  PostgreSQL database
alb.tf                             →  Load balancer (optional)
outputs.tf                         →  Values you need after apply
```

---

## Execution order (what actually gets created first)

This is **not** the same as file order. This is the real dependency flow:

```
Step 1 (can run in parallel)
├── VPC                          [vpc.tf]
└── IAM role + instance profile  [iam.tf]  ← no VPC reference

Step 2
└── Internet Gateway, subnets, route tables  [vpc.tf]

Step 3
├── App security group           [security_groups.tf]
└── RDS security group           [security_groups.tf]  ← needs app SG first

Step 4
└── DB subnet group              [rds.tf]

Step 5 (can run in parallel)
├── EC2 instance                 [ec2.tf]
└── RDS PostgreSQL               [rds.tf]

Step 6 (only if enable_alb = true)
└── ALB + attach to EC2          [alb.tf]
```

---

## File-by-file explanation

### `versions.tf`

**What to say:**

> This file configures Terraform itself — which version we require, which AWS provider we use, and where state is stored.

**Key points:**

- `required_version = ">= 1.10.0"` — we need Terraform 1.10+ for S3 native locking (`use_lockfile`).
- `backend "s3" {}` — state is stored remotely in S3, not on my laptop. Actual bucket settings come from `backend-config.hcl`.
- `provider "aws"` — all resources are created in the region from `var.aws_region` (default: `ap-south-1`).

**No resources are created here.** This is configuration only.

---

### `backend-config.hcl`

**What to say:**

> This file tells Terraform which S3 bucket holds our state. We use workspaces so staging and prod have separate state files in the same bucket.

**Key points:**

| Setting | Purpose |
|---------|---------|
| `bucket` | S3 bucket name for state |
| `key` | Base state file name |
| `workspace_key_prefix` | Puts each workspace in its own folder (`skyobserv/staging/`, `skyobserv/prod/`) |
| `use_lockfile = true` | Prevents two people from running `apply` at the same time |

**Interview line:**

> "State is shared across the team via S3. Workspaces isolate staging from prod without duplicating code."

---

### `variables.tf`

**What to say:**

> This file declares what inputs the module accepts. Values are set per environment in `terraform.tfvars.stg` or `terraform.tfvars.prod`.

**Key variables:**

| Variable | What it controls |
|----------|------------------|
| `project_name` | Prefix for all resource names (`skyobserv-stg`, `skyobserv-prod`) |
| `instance_type` | EC2 size (`t3.micro` for staging, `t3.small` for prod) |
| `db_instance_class` | RDS size |
| `db_password` | Database password (sensitive, never committed) |
| `key_name` | AWS SSH key pair name for EC2 access |
| `enable_alb` | Create load balancer or not (off by default to save cost) |
| `enable_nat` | Create NAT gateway or not (off by default) |

**Interview line:**

> "Same `.tf` code for all environments. Only the `.tfvars` file changes between staging and prod."

---

### `vpc.tf` — Network layer

**What to say:**

> Everything runs inside a VPC. This file builds the network: the VPC itself, public and private subnets across two availability zones, internet access, and optional NAT.

**Resources and why they exist:**

| Resource | Purpose |
|----------|---------|
| `aws_vpc.main` | Private network (`10.0.0.0/16`). Root of the network layer. |
| `aws_internet_gateway.main` | Lets public subnets reach the internet. Depends on VPC. |
| `aws_subnet.public_a` / `public_b` | Public subnets in two AZs. EC2 goes here. Auto-assign public IP. |
| `aws_subnet.private_a` / `private_b` | Private subnets in two AZs. RDS goes here. No direct internet. |
| `aws_route_table.public` | Routes `0.0.0.0/0` traffic to the internet gateway. |
| `aws_route_table_association.*` | Attaches public subnets to the public route table. |
| `aws_eip.nat` + `aws_nat_gateway.main` | Only if `enable_nat = true`. Lets private subnets reach the internet outbound. |
| `aws_route_table.private` | Only if NAT is enabled. Routes private subnet traffic through NAT. |

**Dependencies to point at in the file:**

```hcl
vpc_id = aws_vpc.main.id                    # everywhere — VPC must exist first
gateway_id = aws_internet_gateway.main.id   # route table needs IGW
```

**Interview line:**

> "EC2 is in a public subnet for simplicity and cost. RDS is in private subnets so it is not reachable from the internet. Two AZs are required for RDS subnet group."

---

### `security_groups.tf` — Firewall rules

**What to say:**

> Security groups are virtual firewalls. They control which traffic is allowed in and out of EC2, RDS, and optionally the ALB.

**Resources:**

| Resource | Allows | Used by |
|----------|--------|---------|
| `aws_security_group.app` | Port 5000 (app), port 22 (SSH) from anywhere | EC2 |
| `aws_security_group.rds` | Port 5432 only from the app security group | RDS |
| `aws_security_group.alb` | Port 80 from anywhere (only if `enable_alb = true`) | ALB |

**Most important dependency in this file:**

```hcl
# Inside aws_security_group.rds
security_groups = [aws_security_group.app.id]
```

**What to say about this:**

> "The database only accepts connections from the app server, not from the open internet. Because RDS SG references app SG, Terraform creates app SG first, then RDS SG."

**Interview line:**

> "This is defense in depth — even if someone misconfigured a route, RDS is not publicly accessible and the security group only allows the app tier."

---

### `iam.tf` — EC2 permissions

**What to say:**

> The EC2 instance needs an IAM role so the CloudWatch agent can send logs and metrics to AWS. This file creates that role and attaches the AWS-managed CloudWatch policy.

**Resource chain:**

```
aws_iam_role.ec2
       ↓
aws_iam_role_policy_attachment.cloudwatch   (AWS managed policy)
       ↓
aws_iam_instance_profile.ec2                (attach role to EC2)
```

**Important interview point:**

> "Notice there is no `vpc_id` in this file. IAM is independent of the network. Terraform can create the IAM role at the same time as the VPC."

**Interview line:**

> "We follow least privilege — the EC2 role only gets CloudWatch agent permissions, nothing else."

---

### `ec2.tf` — Application server

**What to say:**

> This is the SkyObserv application server. It runs Amazon Linux 2023, installs Docker and the CloudWatch agent on boot, and exposes the app on port 5000.

**Data source:**

```hcl
data "aws_ami.amazon_linux"
```

> "We look up the latest Amazon Linux 2023 AMI at apply time instead of hardcoding an AMI ID, which changes per region and over time."

**Dependencies (point at each line in `aws_instance.app`):**

| Attribute | References | From file |
|-----------|------------|-----------|
| `subnet_id` | `aws_subnet.public_a.id` | vpc.tf |
| `vpc_security_group_ids` | `aws_security_group.app.id` | security_groups.tf |
| `iam_instance_profile` | `aws_iam_instance_profile.ec2.name` | iam.tf |
| `ami` | `data.aws_ami.amazon_linux.id` | ec2.tf (data lookup) |
| `key_name` | `var.key_name` | pre-created in AWS |

**`user_data` script does on first boot:**

1. Install Docker and CloudWatch agent
2. Enable Docker
3. Create log directory `/var/log/skyobserv`
4. Configure CloudWatch agent for app, access, and system logs

**Interview line:**

> "EC2 is only created after the subnet, security group, and IAM profile exist. RDS is not a dependency — EC2 and RDS can be created in parallel."

---

### `rds.tf` — PostgreSQL database

**What to say:**

> The database runs in private subnets. It is not publicly accessible. Only the EC2 app server can connect on port 5432.

**Resources:**

| Resource | Purpose |
|----------|---------|
| `aws_db_subnet_group.main` | Tells RDS which subnets to use (private_a + private_b across two AZs) |
| `aws_db_instance.postgres` | PostgreSQL 15 on `db.t3.micro` (staging) or larger for prod |

**Dependencies:**

```hcl
subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]   # vpc.tf
vpc_security_group_ids = [aws_security_group.rds.id]                # security_groups.tf
db_subnet_group_name = aws_db_subnet_group.main.name                # same file
```

**Interview line:**

> "RDS takes 5–10 minutes to create, so it often finishes last in the terminal. That does not mean EC2 had to wait for RDS — they are independent."

**Cost note:**

> "`backup_retention_period = 1` on free tier. `skip_final_snapshot = true` for dev — in real production we would keep snapshots."

---

### `alb.tf` — Load balancer (optional)

**What to say:**

> This file is gated by `enable_alb`. When false, none of these resources are created (`count = 0`). Staging uses direct EC2 access on port 5000. Production can enable the ALB for a stable DNS name and HTTP entry point.

**Resource chain:**

```
aws_security_group.alb
       ↓
aws_lb.main
       ↓
aws_lb_target_group.app
       ↓
aws_lb_listener.http
       ↓
aws_lb_target_group_attachment.app  →  needs aws_instance.app.id
```

**Key dependency:**

```hcl
target_id = aws_instance.app.id
```

> "The target group attachment references the EC2 instance, so ALB registration happens after EC2 exists."

**Health check:**

```hcl
path = "/api/auth/status"
```

> "The ALB checks this endpoint to know if the app is healthy before sending traffic."

---

### `outputs.tf` — Values after apply

**What to say:**

> After `terraform apply`, these values are printed so we know how to SSH, deploy, and connect the app to the database.

| Output | Use |
|--------|-----|
| `app_public_ip` | SSH into EC2, set `STAGING_HOST` / `PROD_HOST` in GitHub secrets |
| `app_instance_id` | Reference in AWS console or scripts |
| `rds_endpoint` | Build `DATABASE_URL` on the EC2 env file |
| `alb_dns_name` | Public URL when ALB is enabled; `null` otherwise |

---

## How files connect — dependency map

```
vpc.tf
  ├── security_groups.tf (needs vpc_id)
  │     └── rds.tf (rds SG needs app SG)
  ├── rds.tf (subnet group needs private subnets)
  └── ec2.tf (needs public subnet)

iam.tf
  └── ec2.tf (needs instance profile)

ec2.tf
  └── alb.tf (target attachment needs instance ID)
```

---

## Common interview questions and answers

### "Why did you split into multiple files?"

> "For readability and team ownership. Network changes stay in `vpc.tf`, security in `security_groups.tf`, and so on. Terraform merges all `.tf` files in the directory into one configuration."

### "Does file order matter?"

> "No. If I moved `rds.tf` above `vpc.tf`, the apply order would be the same because Terraform reads references, not file position."

### "What gets created first?"

> "VPC and IAM can start together. Then subnets and security groups. Then EC2 and RDS in parallel. ALB last if enabled."

### "How do staging and prod differ?"

> "Same code, different workspace and `.tfvars`. Staging uses smaller instances and `enable_alb = false`. Prod can use larger instances and enable the ALB. State is separate per workspace in S3."

### "How do you prevent two people from applying at once?"

> "S3 state locking with `use_lockfile = true`. If a lock is stuck, we use `terraform force-unlock` after confirming no other job is running."

### "Why is EC2 in a public subnet?"

> "Cost and simplicity for this project. No NAT gateway (~$32/month). ALB code is ready in `alb.tf` when we need HTTPS and a proper entry point."

### "Why is RDS not publicly accessible?"

> "`publicly_accessible = false`, private subnets, and a security group that only allows the app SG on port 5432."

---

## Quick reference: what each file creates (default staging)

| File | Resource count (approx) | Notes |
|------|-------------------------|-------|
| vpc.tf | 9 | +4 more if NAT enabled |
| security_groups.tf | 2 | +1 if ALB enabled |
| iam.tf | 3 | Role, policy attachment, instance profile |
| ec2.tf | 1 | Plus AMI data lookup |
| rds.tf | 2 | Subnet group + DB instance |
| alb.tf | 0 | 4 resources if `enable_alb = true` |
| **Total (default)** | **~17** | |

---

## 30-second summary (closing statement)

> "I split infrastructure into layered files: `vpc.tf` for the network, `security_groups.tf` for firewall rules, `iam.tf` for EC2 permissions, `ec2.tf` for the app server, `rds.tf` for PostgreSQL in private subnets, and `alb.tf` as an optional load balancer. Variables and workspaces handle staging vs prod. Terraform builds a dependency graph from references — VPC first, then subnets and security groups, then EC2 and RDS in parallel, and ALB last if enabled. State lives in S3 with workspace isolation and locking for team safety."

---

## Related docs

- [terraform-command.md](./terraform-command.md) — CLI command reference
- [DEVOPS.md](../../DEVOPS.md) — full deployment guide
