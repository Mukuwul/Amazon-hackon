# Build, push, and redeploy the Lambda container image.
# One-time setup: fill in the three values below (find them in the AWS console).
# Then redeploy any time with:   ./deploy.ps1
# Requires: docker running, AWS CLI configured (aws configure).

$ErrorActionPreference = "Stop"

# --- fill these in once ---------------------------------------------------
$AccountId    = "656751413989"
$Region       = "ca-central-1"
$EcrRepo      = "hackon-backend"
$FunctionName = "hackon-backend"
# -------------------------------------------------------------------------

$Registry = "$AccountId.dkr.ecr.$Region.amazonaws.com"
$ImageUri = "$Registry/$EcrRepo`:latest"

Write-Host "==> Logging in to ECR ($Registry)" -ForegroundColor Cyan
# The ecr-login credential helper (~/.docker/config.json "credHelpers") authenticates
# the push on its own, so this explicit login is belt-and-suspenders. Under
# $ErrorActionPreference="Stop", a stderr write from docker login (the cosmetic ECR
# 400) is promoted to a terminating error and aborts the script before build/push.
# Run it tolerantly so the rest of the deploy always proceeds.
try {
    $ErrorActionPreference = "Continue"
    aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $Registry
} catch {
    Write-Host "    ECR login was noisy; relying on the ecr-login credential helper for the push." -ForegroundColor DarkYellow
} finally {
    $ErrorActionPreference = "Stop"
}

Write-Host "==> Building image for linux/amd64 (Lambda is x86_64)" -ForegroundColor Cyan
# --provenance=false keeps the pushed artifact a plain image manifest, which Lambda requires.
docker build --platform linux/amd64 --provenance=false -t $ImageUri .

Write-Host "==> Pushing $ImageUri" -ForegroundColor Cyan
docker push $ImageUri

Write-Host "==> Updating Lambda function code" -ForegroundColor Cyan
aws lambda update-function-code `
    --function-name $FunctionName `
    --image-uri $ImageUri `
    --region $Region | Out-Null

Write-Host "==> Waiting for function to become Active" -ForegroundColor Cyan
aws lambda wait function-updated --function-name $FunctionName --region $Region

Write-Host "Done. Deployed $ImageUri" -ForegroundColor Green
