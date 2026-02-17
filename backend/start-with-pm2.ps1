<#
start-with-pm2.ps1

This helper script will:
- Check for `pm2`; if missing, attempt to install it globally via npm.
- Start `server.js` under pm2 with the name `devstudio-backend`.
- Save the pm2 process list so it restarts automatically (pm2 startup requires extra steps per OS).

Run this in an elevated PowerShell terminal inside VS Code (or regular PowerShell) when you want the backend to run persistently.
#>

# Allow running from VS Code integrated terminal without changing machine policy
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

# Ensure we're in the backend folder
Push-Location -Path "$PSScriptRoot"

# If not in backend (for safety), cd to backend
if (-not (Test-Path './server.js')) {
    Write-Host "server.js not found in current folder. Trying to change to repo backend folder..." -ForegroundColor Yellow
    $repoRoot = (Resolve-Path "..\")
    Set-Location -Path $repoRoot
}

# Check pm2
$pm2Version = $null
try {
    $pm2Version = & pm2 -v 2>$null
} catch {
    $pm2Version = $null
}

if (-not $pm2Version) {
    Write-Host "pm2 not found — installing globally (this may require Administrator privileges)..." -ForegroundColor Cyan
    try {
        npm install -g pm2
    } catch {
        Write-Host "Failed to install pm2. Try running this script as Administrator or install pm2 manually: npm install -g pm2" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}

# Start backend with pm2
try {
    Write-Host "Starting backend with pm2 (name: devstudio-backend)..." -ForegroundColor Green
    pm2 start server.js --name devstudio-backend --interpreter node
    pm2 save
    Write-Host "Started. Use 'pm2 logs devstudio-backend' to view logs, 'pm2 stop devstudio-backend' to stop." -ForegroundColor Green
} catch {
    Write-Host "Failed to start server with pm2: $_" -ForegroundColor Red
}

Pop-Location
