# ============================================================
#  BioDiscover — GitHub + Netlify/Render Deploy Script
#  Run this script in PowerShell from:  e:\new bbt project\
# ============================================================

param(
    [string]$GithubUsername = "",
    [string]$RepoName = "biodiscover-platform"
)

$ErrorActionPreference = "Stop"
$ProjectDir = "e:\new bbt project"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  BioDiscover — Deployment Setup" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# ---- Check Git ----
$gitCmd = $null
$gitPaths = @(
    "git",
    "C:\Program Files\Git\bin\git.exe",
    "C:\Program Files (x86)\Git\bin\git.exe"
)

foreach ($gp in $gitPaths) {
    try {
        $v = & $gp --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $gitCmd = $gp
            Write-Host "✅ Git found: $v" -ForegroundColor Green
            break
        }
    } catch {}
}

if (-not $gitCmd) {
    Write-Host "❌ Git not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Git:" -ForegroundColor Yellow
    Write-Host "  Option 1 (Recommended): https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "  Option 2: winget install Git.Git  (run as Administrator)" -ForegroundColor White
    Write-Host ""
    Write-Host "After installing Git, restart PowerShell and run this script again." -ForegroundColor Yellow
    exit 1
}

# ---- Get GitHub username ----
if (-not $GithubUsername) {
    $GithubUsername = Read-Host "Enter your GitHub username"
}
if (-not $GithubUsername) {
    Write-Host "❌ GitHub username is required." -ForegroundColor Red
    exit 1
}

$RepoUrl = "https://github.com/$GithubUsername/$RepoName.git"

# ---- Initialize Git ----
Set-Location $ProjectDir

Write-Host ""
Write-Host "📁 Initializing git repository..." -ForegroundColor Cyan
& $gitCmd init
& $gitCmd config user.name $GithubUsername

$email = Read-Host "Enter your GitHub email"
& $gitCmd config user.email $email

# ---- Stage all files ----
Write-Host ""
Write-Host "📦 Staging all files..." -ForegroundColor Cyan
& $gitCmd add .
& $gitCmd status

# ---- Initial commit ----
Write-Host ""
Write-Host "💾 Creating initial commit..." -ForegroundColor Cyan
& $gitCmd commit -m "Initial commit: BioDiscover Drug Discovery + Bioinformatics Platform"

# ---- Connect to GitHub ----
Write-Host ""
Write-Host "🔗 Connecting to GitHub remote..." -ForegroundColor Cyan
Write-Host "   Remote URL: $RepoUrl" -ForegroundColor Gray

try {
    & $gitCmd remote remove origin 2>$null
} catch {}

& $gitCmd remote add origin $RepoUrl
& $gitCmd branch -M main

# ---- Push ----
Write-Host ""
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "   (You may be prompted to sign in to GitHub)" -ForegroundColor Yellow
Write-Host ""
& $gitCmd push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "======================================================" -ForegroundColor Green
    Write-Host "  ✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "======================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  📂 GitHub: https://github.com/$GithubUsername/$RepoName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Deploy backend to Render:" -ForegroundColor White
    Write-Host "     → https://render.com/deploy" -ForegroundColor Cyan
    Write-Host "     → Connect GitHub, root dir: backend" -ForegroundColor White
    Write-Host "     → Start command: gunicorn wsgi:app --bind 0.0.0.0:`$PORT" -ForegroundColor White
    Write-Host ""
    Write-Host "  2. Deploy frontend to Netlify:" -ForegroundColor White
    Write-Host "     → https://netlify.com" -ForegroundColor Cyan
    Write-Host "     → Import from GitHub, publish dir: frontend" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Push failed. Possible reasons:" -ForegroundColor Red
    Write-Host "   • GitHub repo doesn't exist — create it at https://github.com/new" -ForegroundColor Yellow
    Write-Host "   • Authentication failed — use GitHub Desktop or Personal Access Token" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual steps:" -ForegroundColor Cyan
    Write-Host "   1. Go to https://github.com/new and create '$RepoName'" -ForegroundColor White
    Write-Host "   2. Then run:  git push -u origin main" -ForegroundColor White
}
