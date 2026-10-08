locals {
  enabled         = var.enable_aws_resources
  compute_enabled = var.enable_aws_resources && var.enable_ec2_resources
  name            = "${var.project_name}-${var.environment}"
  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

data "aws_availability_zones" "available" {
  count = local.compute_enabled ? 1 : 0
  state = "available"
}

data "aws_ami" "amazon_linux" {
  count       = local.compute_enabled && (var.app_ami_id == "" || var.db_ami_id == "") ? 1 : 0
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

resource "aws_vpc" "main" {
  count                = local.compute_enabled ? 1 : 0
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.tags, { Name = "${local.name}-vpc" })
}

resource "aws_internet_gateway" "main" {
  count  = local.compute_enabled ? 1 : 0
  vpc_id = aws_vpc.main[0].id
  tags   = merge(local.tags, { Name = "${local.name}-igw" })
}

resource "aws_subnet" "app" {
  count                   = local.compute_enabled ? 1 : 0
  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = "10.42.1.0/24"
  availability_zone       = data.aws_availability_zones.available[0].names[0]
  map_public_ip_on_launch = true
  tags                    = merge(local.tags, { Name = "${local.name}-app-subnet" })
}

resource "aws_subnet" "database" {
  count             = local.compute_enabled ? 1 : 0
  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.42.10.0/24"
  availability_zone = data.aws_availability_zones.available[0].names[0]
  tags              = merge(local.tags, { Name = "${local.name}-database-subnet" })
}

resource "aws_route_table" "app" {
  count  = local.compute_enabled ? 1 : 0
  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }

  tags = merge(local.tags, { Name = "${local.name}-app-routes" })
}

resource "aws_route_table" "database" {
  count  = local.compute_enabled ? 1 : 0
  vpc_id = aws_vpc.main[0].id
  tags   = merge(local.tags, { Name = "${local.name}-database-routes" })
}

resource "aws_route_table_association" "app" {
  count          = local.compute_enabled ? 1 : 0
  subnet_id      = aws_subnet.app[0].id
  route_table_id = aws_route_table.app[0].id
}

resource "aws_route_table_association" "database" {
  count          = local.compute_enabled ? 1 : 0
  subnet_id      = aws_subnet.database[0].id
  route_table_id = aws_route_table.database[0].id
}

resource "aws_vpc_endpoint" "s3" {
  count             = local.compute_enabled ? 1 : 0
  vpc_id            = aws_vpc.main[0].id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.app[0].id, aws_route_table.database[0].id]
  tags              = merge(local.tags, { Name = "${local.name}-s3-endpoint" })
}

resource "aws_security_group" "app" {
  count       = local.compute_enabled ? 1 : 0
  name        = "${local.name}-app"
  description = "Public HTTPS only; API and AI remain internal to the host."
  vpc_id      = aws_vpc.main[0].id

  ingress {
    description = "HTTPS application traffic"
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP only for HTTPS redirect"
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "${local.name}-app-sg" })
}

resource "aws_security_group" "database" {
  count       = local.compute_enabled ? 1 : 0
  name        = "${local.name}-database"
  description = "MongoDB accepts traffic only from the application security group."
  vpc_id      = aws_vpc.main[0].id

  ingress {
    description     = "MongoDB from application instance only"
    protocol        = "tcp"
    from_port       = 27017
    to_port         = 27017
    security_groups = [aws_security_group.app[0].id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "${local.name}-database-sg" })
}

resource "aws_s3_bucket" "evidence" {
  count         = local.enabled ? 1 : 0
  bucket        = "${var.bucket_prefix}${var.environment}-evidence"
  force_destroy = false

  lifecycle {
    prevent_destroy = true
  }

  tags = merge(local.tags, { Name = "${local.name}-evidence" })
}

resource "aws_s3_bucket_public_access_block" "evidence" {
  count                   = local.enabled ? 1 : 0
  bucket                  = aws_s3_bucket.evidence[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "evidence" {
  count  = local.enabled ? 1 : 0
  bucket = aws_s3_bucket.evidence[0].id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "evidence" {
  count  = local.enabled ? 1 : 0
  bucket = aws_s3_bucket.evidence[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "evidence" {
  count  = local.enabled ? 1 : 0
  bucket = aws_s3_bucket.evidence[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "backups" {
  count         = local.enabled ? 1 : 0
  bucket        = "${var.bucket_prefix}${var.environment}-backups"
  force_destroy = false

  lifecycle {
    prevent_destroy = true
  }

  tags = merge(local.tags, { Name = "${local.name}-backups" })
}

resource "aws_s3_bucket_public_access_block" "backups" {
  count                   = local.enabled ? 1 : 0
  bucket                  = aws_s3_bucket.backups[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "backups" {
  count  = local.enabled ? 1 : 0
  bucket = aws_s3_bucket.backups[0].id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  count  = local.enabled ? 1 : 0
  bucket = aws_s3_bucket.backups[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "backups" {
  count  = local.enabled ? 1 : 0
  bucket = aws_s3_bucket.backups[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "models" {
  count         = local.enabled ? 1 : 0
  bucket        = "${var.bucket_prefix}${var.environment}-models"
  force_destroy = false

  lifecycle {
    prevent_destroy = true
  }

  tags = merge(local.tags, { Name = "${local.name}-models" })
}

resource "aws_s3_bucket_public_access_block" "models" {
  count                   = local.enabled ? 1 : 0
  bucket                  = aws_s3_bucket.models[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "models" {
  count  = local.enabled ? 1 : 0
  bucket = aws_s3_bucket.models[0].id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "models" {
  count  = local.enabled ? 1 : 0
  bucket = aws_s3_bucket.models[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "models" {
  count  = local.enabled ? 1 : 0
  bucket = aws_s3_bucket.models[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_iam_role" "app" {
  count = local.compute_enabled ? 1 : 0
  name  = "${local.name}-app-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "app_ssm" {
  count      = local.compute_enabled ? 1 : 0
  role       = aws_iam_role.app[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "app_storage" {
  count = local.compute_enabled ? 1 : 0
  role  = aws_iam_role.app[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.evidence[0].arn
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.evidence[0].arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = "${aws_s3_bucket.models[0].arn}/*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "app" {
  count = local.compute_enabled ? 1 : 0
  name  = "${local.name}-app-profile"
  role  = aws_iam_role.app[0].name
}

resource "aws_iam_role" "database" {
  count = local.compute_enabled ? 1 : 0
  name  = "${local.name}-database-role"

  assume_role_policy = aws_iam_role.app[0].assume_role_policy
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "database_ssm" {
  count      = local.compute_enabled ? 1 : 0
  role       = aws_iam_role.database[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "database" {
  count = local.compute_enabled ? 1 : 0
  name  = "${local.name}-database-profile"
  role  = aws_iam_role.database[0].name
}

resource "aws_iam_role_policy" "database_backup" {
  count = local.compute_enabled ? 1 : 0
  role  = aws_iam_role.database[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.backups[0].arn
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject"]
        Resource = "${aws_s3_bucket.backups[0].arn}/*"
      }
    ]
  })
}

resource "aws_instance" "app" {
  count                       = local.compute_enabled ? 1 : 0
  ami                         = var.app_ami_id != "" ? var.app_ami_id : data.aws_ami.amazon_linux[0].id
  instance_type               = var.app_instance_type
  subnet_id                   = aws_subnet.app[0].id
  vpc_security_group_ids      = [aws_security_group.app[0].id]
  iam_instance_profile        = aws_iam_instance_profile.app[0].name
  key_name                    = var.ssh_key_name
  associate_public_ip_address = true
  monitoring                  = false

  credit_specification {
    cpu_credits = "standard"
  }

  metadata_options {
    http_tokens = "required"
  }

  root_block_device {
    encrypted   = true
    volume_type = "gp3"
    volume_size = 30
  }

  tags = merge(local.tags, { Name = "${local.name}-app" })
}

resource "aws_instance" "database" {
  count                       = local.compute_enabled ? 1 : 0
  ami                         = var.db_ami_id != "" ? var.db_ami_id : data.aws_ami.amazon_linux[0].id
  instance_type               = var.db_instance_type
  subnet_id                   = aws_subnet.database[0].id
  vpc_security_group_ids      = [aws_security_group.database[0].id]
  iam_instance_profile        = aws_iam_instance_profile.database[0].name
  key_name                    = var.ssh_key_name
  associate_public_ip_address = false
  monitoring                  = false

  credit_specification {
    cpu_credits = "standard"
  }

  metadata_options {
    http_tokens = "required"
  }

  root_block_device {
    encrypted   = true
    volume_type = "gp3"
    volume_size = 30
  }

  tags = merge(local.tags, { Name = "${local.name}-database" })
}
