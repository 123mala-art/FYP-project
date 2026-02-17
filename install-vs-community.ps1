<#
install-vs-community.ps1

This script downloads the Visual Studio Community bootstrapper and launches it with
"Desktop development with C++" selected.

Important:
- Run PowerShell as Administrator.
- This script only *starts* the installer; you will likely follow the GUI or choose
  a passive/quiet install via the flags below.
- Visual Studio installer + workloads require significant disk space (several GB).
#>

# Check admin rights
If (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Please run this script as Administrator. Right-click PowerShell -> Run as Administrator." -ForegroundColor Yellow
    Exit 1
}

$dest = "$env:USERPROFILE\Downloads\vs_Community.exe"
$uri = "https://aka.ms/vs/17/release/vs_community.exe"

Write-Host "Downloading Visual Studio bootstrapper to: $dest" -ForegroundColor Cyan
Invoke-WebRequest -Uri $uri -OutFile $dest -UseBasicParsing

# Recommended interactive install (GUI will open with the workload pre-selected)
# --add selects the workload (Native Desktop = "Desktop development with C++")
# --includeRecommended adds recommended components for that workload
Write-Host "Launching installer (interactive). This will open the Visual Studio Installer UI..." -ForegroundColor Green
Start-Process -FilePath $dest -ArgumentList "--add Microsoft.VisualStudio.Workload.NativeDesktop --includeRecommended" -Wait

<#
If you prefer a quiet/silent install (unattended), you can run instead:

Start-Process -FilePath $dest -ArgumentList "--add Microsoft.VisualStudio.Workload.NativeDesktop --includeRecommended --quiet --wait --norestart" -Wait

Notes for silent installs:
- --quiet: no UI
- --wait: block until finished
- --norestart: don't reboot automatically

Silent installs are useful for automation on CI or image-building, but
can be harder to troubleshoot if components fail.
#>

Write-Host "Installer process finished (UI may continue running). Open the Visual Studio Installer to check progress or open Visual Studio when ready." -ForegroundColor Cyan
