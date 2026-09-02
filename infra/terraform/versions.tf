terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state - run backend-setup.sh first, then uncomment + run: terraform init -migrate-state
  # backend "s3" {
  #   bucket         = "8byte-tf-state-ankit"
  #   key            = "skyobserv/infra.tfstate"
  #   region         = "ap-south-1"
  #   dynamodb_table = "terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region
}
