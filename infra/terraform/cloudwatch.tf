locals {
  instance_id    = var.existing_instance_id
  rds_identifier = var.existing_rds_identifier
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/skyobserv/app"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "nginx" {
  name              = "/skyobserv/access"
  retention_in_days = 7
}

resource "aws_cloudwatch_metric_alarm" "ec2_cpu" {
  alarm_name          = "${var.project_name}-ec2-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    InstanceId = local.instance_id
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.project_name}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 120
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    DBInstanceIdentifier = local.rds_identifier
  }
}

resource "aws_cloudwatch_dashboard" "infra" {
  dashboard_name = "${var.project_name}-infra"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          title   = "EC2 CPU"
          region  = var.aws_region
          period  = 300
          metrics = [["AWS/EC2", "CPUUtilization", "InstanceId", local.instance_id]]
        }
      },
      {
        type = "metric"
        properties = {
          title   = "EC2 Memory"
          region  = var.aws_region
          period  = 300
          metrics = [["CWAgent", "mem_used_percent", "InstanceId", local.instance_id]]
        }
      },
      {
        type = "metric"
        properties = {
          title   = "EC2 Disk"
          region  = var.aws_region
          period  = 300
          metrics = [["CWAgent", "disk_used_percent", "InstanceId", local.instance_id, "path", "/", "fstype", "xfs"]]
        }
      }
    ]
  })
}

resource "aws_cloudwatch_dashboard" "rds" {
  dashboard_name = "${var.project_name}-rds"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          title   = "RDS CPU"
          region  = var.aws_region
          period  = 300
          metrics = [["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", local.rds_identifier]]
        }
      },
      {
        type = "metric"
        properties = {
          title   = "RDS Connections"
          region  = var.aws_region
          period  = 300
          metrics = [["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", local.rds_identifier]]
        }
      },
      {
        type = "metric"
        properties = {
          title   = "RDS Free Storage"
          region  = var.aws_region
          period  = 300
          metrics = [["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", local.rds_identifier]]
        }
      }
    ]
  })
}
