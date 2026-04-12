# End-to-end API checks: health, meta, tenant (CLINIC), services/staff, public page, slots, book,
# customer registration, customer appointments.
# Requires: API running (default http://localhost:8090) and PostgreSQL with schema from JPA ddl-auto.
# Usage: pwsh ./scripts/e2e-api-flow.ps1
# Exit 1 if any step fails.

$ErrorActionPreference = "Stop"
$Base = if ($env:MBTZ_API_BASE) { $env:MBTZ_API_BASE.TrimEnd("/") } else { "http://localhost:8090" }
$Api = "$Base/api/v1"

function Invoke-MbtzJson {
    param(
        [string] $Method,
        [string] $Uri,
        [object] $Body = $null,
        [hashtable] $Headers = @{}
    )
    $params = @{ Uri = $Uri; Method = $Method; Headers = $Headers }
    if ($null -ne $Body) {
        $params.ContentType = "application/json"
        $params.Body = ($Body | ConvertTo-Json -Depth 8 -Compress)
    }
    return Invoke-RestMethod @params
}

Write-Host "== Health =="
$h = Invoke-MbtzJson -Method GET -Uri "$Api/health"
if (-not $h.data.status) { throw "Health: unexpected response" }
Write-Host "OK service=$($h.data.service)"

Write-Host "== Business types (meta) =="
$meta = Invoke-MbtzJson -Method GET -Uri "$Api/meta/business-types"
$codes = @($meta.data | ForEach-Object { $_.code })
foreach ($need in @("CLINIC", "SALON", "GYM", "FITNESS")) {
    if ($codes -notcontains $need) { throw "Meta missing business type: $need" }
}
Write-Host "OK types: $($codes -join ', ')"

$suffix = [guid]::NewGuid().ToString("N").Substring(0, 10)
$tenantEmail = "e2e-tenant-$suffix@test.local"
$customerEmail = "e2e-customer-$suffix@test.local"
$slug = "e2e-clinic-$suffix"
$password = "TestPass123!"

Write-Host "== Register tenant (CLINIC) =="
$reg = Invoke-MbtzJson -Method POST -Uri "$Api/auth/register" -Body @{
    name            = "E2E Owner"
    email           = $tenantEmail
    password        = $password
    businessName    = "E2E Medical Clinic"
    slug            = $slug
    businessType    = "CLINIC"
}
$token = $reg.data.accessToken
$clinicId = $reg.data.clinicId
if (-not $token -or -not $clinicId) { throw "Register: missing token or clinicId" }
Write-Host "OK clinicId=$clinicId"

Write-Host "== Tenant: create service + staff =="
$auth = @{ Authorization = "Bearer $token" }
$svc = Invoke-MbtzJson -Method POST -Uri "$Api/clinics/$clinicId/services" -Headers $auth -Body @{
    name             = "General consult"
    category         = "consult"
    durationMinutes  = 30
    priceCents       = 15000
    active           = $true
}
$serviceId = $svc.data.id
$stf = Invoke-MbtzJson -Method POST -Uri "$Api/clinics/$clinicId/staff" -Headers $auth -Body @{
    displayName    = "Dr E2E"
    specialization = "GP"
    active         = $true
}
$staffId = $stf.data.id
Write-Host "OK service=$serviceId staff=$staffId"

Write-Host "== Public business page (CLINIC / $slug) =="
$pub = Invoke-MbtzJson -Method GET -Uri "$Api/public/CLINIC/$slug"
if ($pub.data.slug -ne $slug) { throw "Public page slug mismatch" }
Write-Host "OK $($pub.data.businessName)"

$date = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd")
Write-Host "== Public slots =="
$slots = Invoke-MbtzJson -Method GET -Uri "$Api/public/CLINIC/$slug/slots?date=$date&serviceId=$serviceId&staffId=$staffId"
$pick = @($slots.data | Where-Object { $_.available -eq $true } | Select-Object -First 1)
if (-not $pick) { throw "No available slot returned" }
$startAt = $pick.startAt
Write-Host "OK book startAt=$startAt"

Write-Host "== Register customer (before book) =="
$custReg = Invoke-MbtzJson -Method POST -Uri "$Api/auth/register-customer" -Body @{
    name     = "E2E Customer"
    email    = $customerEmail
    password = $password
}
$custToken = $custReg.data.accessToken
if (-not $custToken) { throw "Customer register: no token" }
Write-Host "OK customer registered"

Write-Host "== Public book =="
$book = Invoke-MbtzJson -Method POST -Uri "$Api/public/CLINIC/$slug/book" -Body @{
    serviceId     = $serviceId
    staffId       = $staffId
    startAt       = $startAt
    customerName  = "E2E Customer"
    customerEmail = $customerEmail
}
if (-not $book.data.appointment) { throw "Book: no appointment in response" }
Write-Host "OK appointment id=$($book.data.appointment.id)"

Write-Host "== Customer / me appointments =="
$custAuth = @{ Authorization = "Bearer $custToken" }
$mine = Invoke-MbtzJson -Method GET -Uri "$Api/me/appointments" -Headers $custAuth
if (@($mine.data).Count -lt 1) { throw "Customer appointments empty" }
Write-Host "OK count=$($mine.data.Count)"

Write-Host "== Second tenant (GYM) category URL =="
$slugGym = "e2e-gym-$suffix"
Invoke-MbtzJson -Method POST -Uri "$Api/auth/register" -Body @{
    name            = "Gym Owner"
    email           = "e2e-gym-$suffix@test.local"
    password        = $password
    businessName    = "E2E Gym"
    slug            = $slugGym
    businessType    = "GYM"
} | Out-Null
$pubGym = Invoke-MbtzJson -Method GET -Uri "$Api/public/GYM/$slugGym"
if ($pubGym.data.businessType -ne "GYM") { throw "GYM public page type mismatch" }
Write-Host "OK GYM slug resolves"

Write-Host ""
Write-Host "All e2e API steps passed."
