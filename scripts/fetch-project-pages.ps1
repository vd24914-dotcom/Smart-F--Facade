# Скачивает страницы объектов с smartfacade.kg в content/source/<slug>.html
# Запуск:  npm run pages
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$list = Join-Path $PSScriptRoot 'project-pages.txt'
$dir = Join-Path $root 'content\source'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$ok = 0; $fail = 0
foreach ($line in Get-Content $list) {
  if (-not $line.Trim()) { continue }
  $parts = $line.Split(' ')
  $dest = Join-Path $dir ($parts[0] + '.html')
  try { Invoke-WebRequest -Uri $parts[1] -OutFile $dest -UseBasicParsing; $ok++ }
  catch { Write-Host "FAIL $($parts[0])" -ForegroundColor Red; $fail++ }
}
Write-Host "Готово: $ok страниц, ошибок: $fail" -ForegroundColor Green
