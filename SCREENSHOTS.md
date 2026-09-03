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

> CI/CD screenshots — GitHub Actions runs (add after pipeline runs green)

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
