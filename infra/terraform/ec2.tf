data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_instance" "app" {
  ami                         = data.aws_ami.amazon_linux.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public_a.id
  vpc_security_group_ids      = [aws_security_group.app.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  associate_public_ip_address = true
  key_name                    = var.key_name

  user_data = <<-EOF
    #!/bin/bash
    dnf update -y
    dnf install -y docker amazon-cloudwatch-agent
    systemctl enable --now docker
    usermod -aG docker ec2-user

    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CWCONFIG'
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/lib/docker/containers/**/*-json.log",
                "log_group_name": "/skyobserv/app",
                "log_stream_name": "{instance_id}"
              }
            ]
          }
        }
      },
      "metrics": {
        "metrics_collected": {
          "mem": { "measurement": ["mem_used_percent"] },
          "disk": {
            "measurement": ["disk_used_percent"],
            "resources": ["/"]
          }
        }
      }
    }
    CWCONFIG

    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config -m ec2 -s \
      -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
  EOF

  tags = {
    Name = "${var.project_name}-app"
  }
}
