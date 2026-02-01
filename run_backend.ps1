param()

$root = Resolve-Path "."
$appPath = Join-Path $root "app.py"

if (-not (Test-Path $appPath)) {
  Write-Error "app.py not found in $root. This repo does not include manage.py."
  exit 1
}

Set-Location $root
Write-Host "Starting Flask backend from $root on port 8000..."
python $appPath
