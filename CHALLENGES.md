# Challenges & Resolutions

Issues I ran into during this assignment and how I fixed them.

---

## 1. GHCR rejects image names with uppercase letters

First CD run failed at the push step. GHCR requires fully lowercase image names — `github.repository_owner` can be mixed case depending on the account.

Fixed by setting the `IMAGE` env var explicitly at the top of `cd.yml`:
```yaml
env:
  IMAGE: ghcr.io/${{ github.repository_owner }}/skyobserv
```
GHCR normalizes the owner to lowercase, so this works as long as the image name itself (`skyobserv`) is lowercase.

---

## 2. Docker login fails in the SSH deploy step

`echo "$TOKEN" | docker login --password-stdin` was giving a warning and then failing silently inside the `appleboy/ssh-action`. Took a bit to figure out since there was no obvious error.

The issue is that `echo` appends a newline to the token. Switched to `printf '%s'` which doesn't:
```bash
printf '%s' "$GHCR_TOKEN" | sudo docker login ghcr.io -u "$GHCR_USER" --password-stdin
```

---

## 3. RDS refusing connections after deploy

App was crashing on startup with `no pg_hba.conf entry for host ... no encryption`. RDS PostgreSQL on AWS requires SSL — plain connections are rejected by default.

Added `?sslmode=require` to `DATABASE_URL` and made sure `server/db.ts` passes the SSL option when connecting. Connections worked after that.

---

## 4. EBS disk filled up, container stopped starting

EC2 had an 2GB root volume. After a few deploys the disk hit 100% — `docker pull` was failing because there was no space to write the new image.

Short term: SSH'd in and cleared old images with `docker image prune -af`.

Longer term: bumped `root_block_device { volume_size = 20 }` in `ec2.tf` and switched the deploy script from `docker system prune -af` to `docker image prune -af`. Full system prune removes volumes too which is risky.

Resized the existing volume without destroying the instance:
```bash
# EC2 → Volumes → Modify → 20GB in AWS console first, then:
sudo growpart /dev/nvme0n1 1
sudo xfs_growfs /
```

---

## 5. CloudWatch memory and disk widgets showing no data

CPU was working but memory and disk both showed "No data available" even though the agent was running.

Turned out the agent was publishing metrics with a `host` dimension (internal hostname like `ip-10-0-1-x.ap-south-1.compute.internal`) but the dashboard was filtering by `InstanceId`. Same data, wrong dimension key.

Fixed by adding `append_dimensions` to the agent config:
```json
"metrics": {
  "append_dimensions": {
    "InstanceId": "${aws:InstanceId}"
  }
}
```
After restarting the agent, metrics showed up in a few minutes.

---

## 6. CloudWatch agent wasn't installed on the existing EC2

The `user_data` script installs the CloudWatch agent on boot, but the EC2 I was using was launched before I added that to the script. `systemctl status amazon-cloudwatch-agent` said the unit didn't exist.

Had to install and configure it manually over SSH:
```bash
sudo dnf install -y amazon-cloudwatch-agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
```

Fresh instances from the updated Terraform config handle this automatically on first boot.

---

## 7. /var/log/messages missing on Amazon Linux 2023

CloudWatch agent was configured to ship `/var/log/messages` as system logs but the file didn't exist.
Fixed with:
```bash
sudo dnf install -y rsyslog
sudo systemctl enable --now rsyslog
```

Added this to `user_data` in `ec2.tf` so it's handled automatically going forward.
