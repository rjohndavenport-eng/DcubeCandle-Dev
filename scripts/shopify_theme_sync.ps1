<#
.SYNOPSIS
  Shopify Theme Sync — DCube Candle Co.
  Canonical path: shopify/themes/sandbox-160399261916
  Sandbox theme ID: 160399261916

.USAGE
  .\scripts\shopify_theme_sync.ps1 pull    # Pull latest from Shopify sandbox
  .\scripts\shopify_theme_sync.ps1 push    # Push local edits to Shopify sandbox (--nodelete)
  .\scripts\shopify_theme_sync.ps1 status  # Show what has changed vs committed

.GUARDRAILS
  - ALWAYS uses --nodelete on push (never strips remote files)
  - ALWAYS targets theme ID 160399261916 (sandbox only)
  - NEVER publishes a theme
  - NEVER touches the live theme (ID 144142631132)
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("pull","push","status")]
    [string]$Action
)

$THEME_ID   = "160399261916"
$THEME_PATH = "shopify\themes\sandbox-160399261916"
$LOG_FILE   = "dcube-sandbox-catalog\diagnostics\sync_log.txt"
$TIMESTAMP  = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Ensure log directory exists
$logDir = Split-Path $LOG_FILE
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

function Write-Log($msg) {
    $line = "[$TIMESTAMP] $msg"
    Write-Host $line
    Add-Content -Path $LOG_FILE -Value $line
}

# Safety check — must run from repo root
if (!(Test-Path ".git")) {
    Write-Error "ERROR: Must be run from repo root (D:\onedrive\Desktop\becandle). Exiting."
    exit 1
}

# Safety check — never touch live theme
if ($env:SHOPIFY_THEME_ID -eq "144142631132") {
    Write-Error "ERROR: Live theme ID detected in environment. Refusing to run. Exiting."
    exit 1
}

switch ($Action) {
    "pull" {
        Write-Log "PULL start: theme $THEME_ID -> $THEME_PATH"
        shopify theme pull --theme $THEME_ID --path $THEME_PATH
        Write-Log "PULL complete."

        # Quick integrity check
        $sections = (Get-ChildItem "$THEME_PATH\sections" -ErrorAction SilentlyContinue).Count
        $snippets = (Get-ChildItem "$THEME_PATH\snippets" -ErrorAction SilentlyContinue).Count
        Write-Log "  sections=$sections  snippets=$snippets"
        if ($sections -lt 10) {
            Write-Warning "WARNING: section count is low ($sections). Pull may be incomplete."
        }
    }
    "push" {
        Write-Log "PUSH start: $THEME_PATH -> theme $THEME_ID (--nodelete)"
        shopify theme push --theme $THEME_ID --path $THEME_PATH --nodelete
        Write-Log "PUSH complete."
    }
    "status" {
        Write-Log "STATUS: git diff for $THEME_PATH"
        git diff --name-only -- $THEME_PATH
        git ls-files --others --exclude-standard -- $THEME_PATH
    }
}
