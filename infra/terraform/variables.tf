variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "project_name" {
  type    = string
  default = "skyobserv"
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "db_name" {
  type    = string
  default = "skyobservdb"
}

variable "db_username" {
  type    = string
  default = "skyobservuser"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "key_name" {
  type    = string
  default = ""
}

# ALB and NAT are off by default to keep costs down during dev
variable "enable_alb" {
  type    = bool
  default = false
}

variable "enable_nat" {
  type    = bool
  default = false
}
