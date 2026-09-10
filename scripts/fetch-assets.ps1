# Скачивает изображения макета из Figma в папку public/.
# Запуск:  powershell -ExecutionPolicy Bypass -File scripts\fetch-assets.ps1
# Ссылки Figma живут ~7 дней с 8 сентября 2026 — если файлы не качаются, попроси Claude обновить список.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$list = Join-Path $PSScriptRoot 'assets.txt'
$base = 'https://www.figma.com/api/mcp/asset'
$ok = 0; $fail = 0
foreach ($line in Get-Content $list) {
  if (-not $line.Trim()) { continue }
  $parts = $line.Split(' ')
  $url = if ($parts[0] -like 'http*') { $parts[0] } else { "$base/$($parts[0])" }
  $dest = Join-Path $root (Join-Path 'public' ($parts[1] -replace '/', '\'))
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
  try { Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing; $ok++ }
  catch { Write-Host "FAIL $($parts[1])" -ForegroundColor Red; $fail++ }
}
Write-Host "Готово: $ok файлов, ошибок: $fail" -ForegroundColor Green
