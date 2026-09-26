#Requires -Version 5.1
<#
.SYNOPSIS
  Tests MyBookTimeZon AI features against Gemini + local Spring Boot APIs.
.NOTES
  Set GEMINI_API_KEY in the environment before running. Do not hard-code keys.
#>
param(
  [string]$AppBase = "http://localhost:8090/api/v1",
  [string]$Model = $(if ($env:GEMINI_MODEL) { $env:GEMINI_MODEL } else { "gemini-3.8-flash" })
)

$ErrorActionPreference = "Continue"
$key = $env:GEMINI_API_KEY
if (-not $key) {
  Write-Host "WARN: GEMINI_API_KEY not set — Google live calls will be skipped; app heuristic tests still run." -ForegroundColor Yellow
}

function Write-Result($name, $status, $detail) {
  $line = "{0}|{1}|{2}" -f $name, $status, ($detail -replace "`r|`n", " ")
  Write-Host $line
  $script:rows += $line
}

$script:rows = @()
$outDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if ($key) {
  try {
    $models = Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models?key=$key" -TimeoutSec 30
    $flash = @($models.models | Where-Object { $_.name -match "flash" } | Select-Object -First 5 -ExpandProperty name) -join ", "
    Write-Result "LIST_MODELS" "PASS" $flash
  } catch {
    Write-Result "LIST_MODELS" "FAIL" $_.Exception.Message
  }

  Start-Sleep -Seconds 2
  $body = '{"contents":[{"role":"user","parts":[{"text":"Beauty coach: one short tip for oily scalp."}]}]}'
  $uri = "https://generativelanguage.googleapis.com/v1beta/models/${Model}:generateContent?key=$key"
  try {
    $resp = Invoke-WebRequest -Uri $uri -Method POST -ContentType "application/json; charset=utf-8" `
      -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 90
    $text = ($resp.Content | ConvertFrom-Json).candidates[0].content.parts[0].text
    Write-Result "NATIVE_CHAT_$Model" "PASS" $text
  } catch {
    $extra = if ($_.ErrorDetails) { $_.ErrorDetails.Message } else { "" }
    Write-Result "NATIVE_CHAT_$Model" "FAIL" ("{0} {1}" -f $_.Exception.Message, $extra)
  }

  Start-Sleep -Seconds 2
  $oai = (@{
      model = $Model
      messages = @(@{ role = "user"; content = "One short tip for dry hair ends." })
      max_tokens = 120
    } | ConvertTo-Json -Depth 5 -Compress)
  try {
    $resp = Invoke-WebRequest -Uri "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions" `
      -Method POST -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } `
      -Body ([System.Text.Encoding]::UTF8.GetBytes($oai)) -TimeoutSec 90
    $text = ($resp.Content | ConvertFrom-Json).choices[0].message.content
    Write-Result "OAI_COMPAT_CHAT" "PASS" $text
  } catch {
    $extra = if ($_.ErrorDetails) { $_.ErrorDetails.Message } else { "" }
    Write-Result "OAI_COMPAT_CHAT" "FAIL" ("{0} {1}" -f $_.Exception.Message, $extra)
  }
} else {
  Write-Result "GEMINI_LIVE" "SKIP" "No GEMINI_API_KEY"
}

try {
  $chat = Invoke-RestMethod -Uri "$AppBase/beauty-coach/chat" -Method POST -ContentType "application/json" `
    -Body '{"message":"Oval face short hairstyle tips","history":[]}' -TimeoutSec 60
  Write-Result "APP_CHAT" "PASS" $chat.data.reply
} catch {
  Write-Result "APP_CHAT" "FAIL" $_.Exception.Message
}

Start-Sleep -Seconds 1
$pers = '{"faceShapeCategory":"Oval","faceShapeDetail":"ratio ~1.3","faceCount":1,"hairConcern":"thinning at crown","skinOrMakeupNotes":"oily T-zone"}'
try {
  $p = Invoke-RestMethod -Uri "$AppBase/beauty-coach/personalize" -Method POST -ContentType "application/json" `
    -Body $pers -TimeoutSec 90
  $summary = "cuts=[{0}] tips=[{1}]" -f ($p.data.suggestedHaircuts -join "; "), ($p.data.hairHealthTips -join "; ")
  Write-Result "APP_PERSONALIZE" "PASS" $summary
} catch {
  Write-Result "APP_PERSONALIZE" "FAIL" $_.Exception.Message
}

$script:rows | Set-Content -Path (Join-Path $outDir "test-results.txt") -Encoding UTF8
Write-Host ""
Write-Host "Wrote $outDir\test-results.txt" -ForegroundColor Green
