<#
.SYNOPSIS
  Convenience wrapper around docker compose that prints the app URLs.

.EXAMPLE
  .\dev.ps1 up          # build if needed, start detached, then show the links
  .\dev.ps1 rebuild     # force rebuild backend+worker+frontend, start, show links
  .\dev.ps1 stop        # stop containers (keep data)
  .\dev.ps1 down        # stop + remove containers (keep data volumes)
  .\dev.ps1 reset       # down + wipe DB/media volumes (fresh start)
  .\dev.ps1 logs        # tail all logs
  .\dev.ps1 ps          # show status + ports
#>
param(
    [Parameter(Position = 0)]
    [ValidateSet('up', 'rebuild', 'stop', 'down', 'reset', 'logs', 'ps')]
    [string]$Command = 'up'
)

function Show-Links {
    Write-Host ""
    Write-Host "  Axiora WhatsApp is running:" -ForegroundColor Green
    Write-Host "    Frontend (app) -> " -NoNewline; Write-Host "http://localhost:5173" -ForegroundColor Cyan
    Write-Host "    Backend API    -> " -NoNewline; Write-Host "http://localhost:8000" -ForegroundColor Cyan
    Write-Host "    API docs       -> " -NoNewline; Write-Host "http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "    Login: admin@axiora.com / Admin@12345" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Tail logs: .\dev.ps1 logs   |   Stop: .\dev.ps1 down" -ForegroundColor DarkGray
    Write-Host ""
}

switch ($Command) {
    'up' {
        docker compose up -d --build
        if ($LASTEXITCODE -eq 0) { Show-Links }
    }
    'rebuild' {
        docker compose up -d --build --force-recreate
        if ($LASTEXITCODE -eq 0) { Show-Links }
    }
    'stop'  { docker compose stop }
    'down'  { docker compose down }
    'reset' { docker compose down -v; docker compose up -d --build; if ($LASTEXITCODE -eq 0) { Show-Links } }
    'logs'  { docker compose logs -f }
    'ps'    { docker compose ps }
}
