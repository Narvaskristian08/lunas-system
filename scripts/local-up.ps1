param([switch]$BuildOnly)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $repoRoot '.env.local'
if (!(Test-Path $envFile)) {
    Copy-Item (Join-Path $repoRoot '.env.local.example') $envFile
}
$content = Get-Content $envFile -Raw
$content = [regex]::Replace($content, '(?m)^([A-Z_]+)=(?:generate_|replace_)[^\r\n]*', {
    param($match)
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    $match.Groups[1].Value + '=' + ([BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant())
})
[System.IO.File]::WriteAllText($envFile, $content)
$docker = (Get-Command docker -ErrorAction SilentlyContinue).Source
if (!$docker) {
    $docker = Join-Path $env:LOCALAPPDATA 'Programs/DockerDesktop/resources/bin/docker.exe'
}
if (!(Test-Path $docker)) { throw 'Install and start Docker Desktop first.' }
$env:PATH = (Split-Path $docker -Parent) + [IO.Path]::PathSeparator + $env:PATH
Push-Location $repoRoot
try {
    $composeArgs = @('compose', '--env-file', $envFile, '-f', 'docker-compose.yml', '-f', 'docker-compose.local.yml')
    if ($BuildOnly) { & $docker @composeArgs build }
    else { & $docker @composeArgs up -d --build }
    if ($LASTEXITCODE -ne 0) { throw "Docker Compose failed with exit code $LASTEXITCODE" }
} finally { Pop-Location }
