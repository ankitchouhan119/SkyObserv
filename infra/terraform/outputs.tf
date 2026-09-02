output "alb_dns_name" {
  value       = var.enable_alb ? aws_lb.main[0].dns_name : null
  description = "Null when enable_alb = false"
}

output "app_instance_id" {
  value = aws_instance.app.id
}

output "app_public_ip" {
  value = aws_instance.app.public_ip
}

output "rds_endpoint" {
  value     = aws_db_instance.postgres.address
  sensitive = true
}

