terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state — init once, then switch env with: terraform workspace select staging|prod
  # terraform init -backend-config=backend-config.hcl
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}
