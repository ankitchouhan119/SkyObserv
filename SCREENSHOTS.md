# Screenshots

## Part 1 — Infrastructure (Terraform)

### Terraform State — Provisioned Resources
`terraform state list` showing all 17 resources created: EC2, RDS, VPC, subnets, security groups, IAM role, route tables.

![Terraform state list](./screenshots/tf1.png)

### EC2 Instance — Running
`skyobserv-app` on t3.micro, public IP `13.232.37.254`, status: Running.

![EC2 instance](./screenshots/ec2.png)

### RDS — Available
`skyobserv-postgres` on db.t3.micro, PostgreSQL 15, status: Available, placed in private subnet.

![RDS instance](./screenshots/rds.png)

---

## Part 2 — CI/CD

### CI Pipeline — All Checks Passed
PR #14 — both `test` and `scan` jobs green. 3 passes, Trivy scan clean. Total duration 2m 2s.

![CI all checks passed](./screenshots/ci1.png)

### CI — test job steps
`test` job: npm ci → Run tests → Type check → Audit dependencies — all green in 34s.

![CI test job](./screenshots/ci2.png)

### CI — scan job steps
`scan` job: Build image → Trivy scan → no CRITICAL vulns found — green in 1m 22s.

![CI scan job](./screenshots/ci3.png)

### CI Checks on Pull Request
PR #14 showing all checks passed: `CI/test`, `CI/scan`, and Netlify deploy preview ready.

![CI PR checks](./screenshots/ci4.png)

### CD Pipeline — Waiting for Production Approval
CD triggered on merge. `build-push` and `deploy-staging` done. `deploy-production` waiting for manual approval (15 min timer).

![CD waiting for approval](./screenshots/cd1.png)

### CD — build-push job
Docker image built and pushed to GHCR in 1m 16s.

![CD build-push](./screenshots/cd2.png)

### CD — deploy-staging job
Deployed to staging via SSH in 1m 8s
![CD deploy-staging](./screenshots/cd3.png)

### CD — deploy-production job
Production deploy succeeded after manual approval

![CD deploy-production](./screenshots/cd4.png)

---

## Part 3 — Monitoring & Logging

### CloudWatch Dashboards List
Three custom dashboards: `skyobserv-app`, `skyobserv-infra`, `skyobserv-rds`.

![CloudWatch dashboards](./screenshots/cw1.png)

### skyobserv-app Dashboard
Application metrics — Latency and RequestCount from access logs via metric filters.

![App dashboard](./screenshots/cw2.png)

### skyobserv-infra Dashboard
EC2 CPU, disk usage, memory usage from CloudWatch agent. System logs visible below.

![Infra dashboard](./screenshots/cw3.png)

### skyobserv-rds Dashboard
RDS CPU, database connections, free storage, read/write latency.

![RDS dashboard](./screenshots/cw4.png)

### CloudWatch Log Groups
Three log groups collecting centralized logs: `/skyobserv/access`, `/skyobserv/app`, `/skyobserv/system`.

![Log groups](./screenshots/cw5.png)

### Access Log Events
Live HTTP access logs flowing into `/skyobserv/access`

![Access log events](./screenshots/cw6.png)

---

## Part 4 — Application

### App Running on EC2
SkyObserv running at `http://13.232.37.254:5000` — Services dashboard with 5 services, 0 unhealthy.

![App dashboard](./screenshots/app1.png)

![App dashboard](./screenshots/app2.png)

![App dashboard](./screenshots/app3.png)

![App dashboard](./screenshots/app4.png)

![App dashboard](./screenshots/app5.png)

![App dashboard](./screenshots/app6.png)
