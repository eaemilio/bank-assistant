# =============================================================================
# Script de diagnóstico de prerequisites
# =============================================================================
# Este script verifica que todas las herramientas necesarias estén instaladas
# =============================================================================

Write-Host "==================================================================="
Write-Host "  Diagnóstico de Prerequisites para AWS Lambda Deployment"
Write-Host "==================================================================="
Write-Host ""

$allGood = $true

# Check AWS CLI
Write-Host "Verificando AWS CLI..." -ForegroundColor Cyan
$awsCmd = Get-Command aws -ErrorAction SilentlyContinue
if ($null -eq $awsCmd) {
    Write-Host "✗ AWS CLI NO encontrado" -ForegroundColor Red
    Write-Host "  Instala con: choco install awscli" -ForegroundColor Yellow
    $allGood = $false
} else {
    $awsVersion = aws --version 2>&1
    Write-Host "✓ AWS CLI encontrado: $awsVersion" -ForegroundColor Green
    Write-Host "  Ubicación: $($awsCmd.Source)" -ForegroundColor Gray
}
Write-Host ""

# Check SAM CLI
Write-Host "Verificando AWS SAM CLI..." -ForegroundColor Cyan
$samCmd = Get-Command sam -ErrorAction SilentlyContinue
if ($null -eq $samCmd) {
    Write-Host "✗ SAM CLI NO encontrado en PATH" -ForegroundColor Red
    Write-Host "  Instala con: choco install awssamcli" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Buscando en ubicaciones comunes..." -ForegroundColor Gray
    
    $commonPaths = @(
        "C:\Program Files\Amazon\AWSSAMCLI\bin\sam.exe",
        "C:\Program Files (x86)\Amazon\AWSSAMCLI\bin\sam.exe",
        "$env:LOCALAPPDATA\Programs\AWS SAM CLI\bin\sam.exe",
        "$env:ProgramFiles\AWS SAM CLI\bin\sam.exe"
    )
    
    $found = $false
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            Write-Host "  ✓ Encontrado en: $path" -ForegroundColor Yellow
            $version = & $path --version 2>&1
            Write-Host "    Versión: $version" -ForegroundColor Gray
            Write-Host ""
            Write-Host "  SOLUCIÓN: Agrega esta ruta al PATH o reinicia PowerShell" -ForegroundColor Cyan
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        Write-Host "  No se encontró SAM CLI en ubicaciones comunes" -ForegroundColor Gray
        Write-Host "  Por favor instala con: choco install awssamcli" -ForegroundColor Yellow
    }
    
    $allGood = $false
} else {
    $samVersion = sam --version 2>&1
    Write-Host "✓ SAM CLI encontrado: $samVersion" -ForegroundColor Green
    Write-Host "  Ubicación: $($samCmd.Source)" -ForegroundColor Gray
}
Write-Host ""

# Check Node.js
Write-Host "Verificando Node.js..." -ForegroundColor Cyan
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $nodeCmd) {
    Write-Host "✗ Node.js NO encontrado" -ForegroundColor Red
    Write-Host "  Descarga desde: https://nodejs.org/" -ForegroundColor Yellow
    $allGood = $false
} else {
    $nodeVersion = node --version
    Write-Host "✓ Node.js encontrado: $nodeVersion" -ForegroundColor Green
    Write-Host "  Ubicación: $($nodeCmd.Source)" -ForegroundColor Gray
}
Write-Host ""

# Check npm
Write-Host "Verificando npm..." -ForegroundColor Cyan
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if ($null -eq $npmCmd) {
    Write-Host "✗ npm NO encontrado" -ForegroundColor Red
    $allGood = $false
} else {
    $npmVersion = npm --version
    Write-Host "✓ npm encontrado: $npmVersion" -ForegroundColor Green
    Write-Host "  Ubicación: $($npmCmd.Source)" -ForegroundColor Gray
}
Write-Host ""

# Check AWS credentials
Write-Host "Verificando credenciales de AWS..." -ForegroundColor Cyan
if ($null -ne $awsCmd) {
    $awsIdentity = aws sts get-caller-identity 2>&1
    if ($LASTEXITCODE -eq 0) {
        $identity = $awsIdentity | ConvertFrom-Json
        Write-Host "✓ Credenciales configuradas" -ForegroundColor Green
        Write-Host "  Usuario: $($identity.Arn)" -ForegroundColor Gray
        Write-Host "  Account: $($identity.Account)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Credenciales NO configuradas" -ForegroundColor Red
        Write-Host "  Ejecuta: aws configure" -ForegroundColor Yellow
        $allGood = $false
    }
} else {
    Write-Host "⊘ No se puede verificar (AWS CLI no instalado)" -ForegroundColor Gray
}
Write-Host ""

# Check .env.lambda
Write-Host "Verificando archivo de configuración..." -ForegroundColor Cyan
if (Test-Path ".env.lambda") {
    Write-Host "✓ .env.lambda encontrado" -ForegroundColor Green
    
    # Verificar variables críticas
    $envContent = Get-Content ".env.lambda" | Where-Object { $_ -notmatch '^#' -and $_ -match '=' }
    $requiredVars = @('EMAIL_USER', 'GMAIL_OAUTH2_CLIENT_ID', 'GMAIL_OAUTH2_CLIENT_SECRET', 'BANK_EMAIL_SENDERS', 'NOTION_API_KEY', 'NOTION_DATABASE_ID')
    
    foreach ($varName in $requiredVars) {
        $varFound = $envContent | Where-Object { $_ -match "^$varName=" }
        if ($varFound) {
            Write-Host "  ✓ $varName configurado" -ForegroundColor Gray
        } else {
            Write-Host "  ✗ $varName faltante" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "✗ .env.lambda NO encontrado" -ForegroundColor Red
    Write-Host "  Crea el archivo desde .env.lambda.example" -ForegroundColor Yellow
    $allGood = $false
}
Write-Host ""

# Check gmail-token.json
Write-Host "Verificando token OAuth2..." -ForegroundColor Cyan
if (Test-Path "..\gmail-token.json") {
    Write-Host "✓ gmail-token.json encontrado" -ForegroundColor Green
    Write-Host "  (Recuerda subirlo a AWS SSM después del deploy)" -ForegroundColor Gray
} else {
    Write-Host "⚠ gmail-token.json NO encontrado" -ForegroundColor Yellow
    Write-Host "  Ejecuta: npm run setup-oauth" -ForegroundColor Yellow
    Write-Host "  (Puedes hacer esto después del deploy)" -ForegroundColor Gray
}
Write-Host ""

# Final summary
Write-Host "==================================================================="
if ($allGood) {
    Write-Host "  ✓ ¡Todo listo para desplegar!" -ForegroundColor Green
    Write-Host "  Ejecuta: npm run lambda:deploy" -ForegroundColor Cyan
} else {
    Write-Host "  ✗ Hay problemas que resolver" -ForegroundColor Red
    Write-Host "  Revisa los errores arriba y corrígelos" -ForegroundColor Yellow
}
Write-Host "==================================================================="
Write-Host ""

# PowerShell PATH info
Write-Host "Variables de entorno (para debugging):" -ForegroundColor Gray
Write-Host "  PATH incluye:" -ForegroundColor Gray
$env:PATH -split ';' | Where-Object { $_ -match 'AWS|SAM|Program Files' } | ForEach-Object {
    Write-Host "    $_" -ForegroundColor DarkGray
}

