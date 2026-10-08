output "evidence_bucket" {
  value       = try(aws_s3_bucket.evidence[0].bucket, null)
  description = "Private evidence bucket name for S3_EVIDENCE_BUCKET."
}

output "backup_bucket" {
  value       = try(aws_s3_bucket.backups[0].bucket, null)
  description = "Private MongoDB backup bucket name for S3_BACKUP_BUCKET."
}

output "models_bucket" {
  value       = try(aws_s3_bucket.models[0].bucket, null)
  description = "Private AI model bucket name."
}

output "artifacts_bucket" {
  value       = try(aws_s3_bucket.artifacts[0].bucket, null)
  description = "Private deployment artifact bucket name."
}

output "app_private_ip" {
  value       = try(aws_instance.app[0].private_ip, null)
  description = "Private application IP for internal routing and diagnostics."
}

output "app_public_ip" {
  value       = try(aws_instance.app[0].public_ip, null)
  description = "Temporary public application IP for the initial capstone edge."
}

output "database_private_ip" {
  value       = try(aws_instance.database[0].private_ip, null)
  description = "Private MongoDB IP; never publish this address."
}

output "ai_private_ip" {
  value       = try(aws_instance.ai[0].private_ip, null)
  description = "Private AI inference IP for the application instance."
}

output "ai_instance_id" {
  value       = try(aws_instance.ai[0].id, null)
  description = "Dedicated AI EC2 instance ID. Stop this instance when AI is not required."
}
