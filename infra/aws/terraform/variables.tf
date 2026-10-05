variable "enable_aws_resources" {
  description = "Safety switch. Keep false until the account, budget, region, and review are complete."
  type        = bool
  default     = false
}

variable "aws_region" {
  description = "AWS region for the capstone deployment."
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  type    = string
  default = "lunas"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "bucket_prefix" {
  description = "Globally unique, lowercase S3 prefix. Add an account/project suffix before enabling resources."
  type        = string
  default     = "replace-with-unique-lunas-"
}

variable "vpc_cidr" {
  type    = string
  default = "10.42.0.0/16"
}

variable "app_instance_type" {
  type    = string
  default = "t3.small"
}

variable "db_instance_type" {
  type    = string
  default = "t3.small"
}

variable "app_ami_id" {
  description = "Optional pinned AMI. Leave empty to select the latest Amazon Linux 2023 x86_64 AMI."
  type        = string
  default     = ""
}

variable "db_ami_id" {
  description = "Optional pinned MongoDB-ready AMI. Leave empty to select Amazon Linux 2023 and bootstrap separately."
  type        = string
  default     = ""
}

variable "ssh_key_name" {
  description = "Optional legacy EC2 key pair. Prefer Session Manager; leave null to avoid SSH access."
  type        = string
  default     = null
}
