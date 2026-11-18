# ==============================================================================
#  Paisa Bachao — One-Click Windows Setup Script
#  Run from project root:  .\setup.ps1
# ==============================================================================

$ErrorActionPreference = "Stop"

# Colours
function Write-Green($m) { Write-Host "✅ $m" -ForegroundColor Green }
function Write-Cyan($m)  { Write-Host "ℹ  $m" -ForegroundColor Cyan }
function Write-Yellow($m){ Write-Host "⚠️  $m" -ForegroundColor Yellow }
function Write-Red($m)   { Write-Host "❌ $m" -ForegroundColor Red }

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   💰  Paisa Bachao — One-Click Setup                 ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# ── Check Node.js ─────────────────────────────────────────────────────────────
Write-Cyan "Checking Node.js..."
try {
    $nodeVer = node --version 2>&1
    Write-Green "Node.js found: $nodeVer"
} catch {
    Write-Red "Node.js not found. Please install from https://nodejs.org"
    exit 1
}

# ── Check npm ─────────────────────────────────────────────────────────────────
Write-Cyan "Checking npm..."
try {
    $npmVer = npm --version 2>&1
    Write-Green "npm found: v$npmVer"
} catch {
    Write-Red "npm not found. Please reinstall Node.js."
    exit 1
}

# ── Install server dependencies ───────────────────────────────────────────────
Write-Host ""
Write-Cyan "Installing server dependencies..."
Set-Location "$PSScriptRoot\server"
if (-not (Test-Path "node_modules")) {
    npm install --loglevel=error
    Write-Green "Server dependencies installed"
} else {
    Write-Cyan "server/node_modules already exists — skipping install"
}

# ── Install client dependencies ───────────────────────────────────────────────
Write-Host ""
Write-Cyan "Installing client dependencies..."
Set-Location "$PSScriptRoot\client"
if (-not (Test-Path "node_modules")) {
    npm install --loglevel=error
    Write-Green "Client dependencies installed"
} else {
    Write-Cyan "client/node_modules already exists — skipping install"
}

# ── Run database setup script ─────────────────────────────────────────────────
Write-Host ""
Write-Cyan "Running database setup..."
Set-Location "$PSScriptRoot\server"
node setup.js

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Green "All done! Now open two terminals:"
Write-Host ""
Write-Host "  Terminal 1:  cd server  →  npm run dev" -ForegroundColor Cyan
Write-Host "  Terminal 2:  cd client  →  npm start"   -ForegroundColor Cyan
Write-Host ""
Write-Host "  Browser:     http://localhost:3000"       -ForegroundColor Cyan
Write-Host ""

