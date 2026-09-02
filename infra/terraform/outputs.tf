output "alb_dns_name" {
  value = aws_lb.main.dns_name
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

# SkyWalking OAP runs on a separate manually-provisioned EC2 (see oap-deploy/)
# Point SKYWALKING_ENDPOINT in skyobserv.env to that instance's IP
