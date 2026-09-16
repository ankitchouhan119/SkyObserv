#!/bin/bash
set -e

BUCKET="8byte-tf-state-ankit"
REGION="ap-south-1"

aws s3api create-bucket \
  --bucket "$BUCKET" \
  --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION"

aws s3api put-bucket-versioning \
  --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled

echo "done - S3 bucket ready (versioning on)"
echo "uncomment backend block in versions.tf, then: terraform init -migrate-state"
