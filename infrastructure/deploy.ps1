# =============================================================================
# Bank Statement Automation - AWS Lambda Deployment Script (PowerShell)
# =============================================================================
# Este script automatiza el despliegue de la función Lambda a AWS
# usando AWS SAM (Serverless Application Model)
# =============================================================================

$ErrorActionPreference = "Stop"

# =============================================================================
# Configuration
# =============================================================================

$STACK_NAME = "bank-statement-automation"
$AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }

# =============================================================================
# Functions
# =============================================================================

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# =============================================================================
# Header
# =============================================================================

Write-Info "==================================================================="
Write-Info "  Bank Statement Automation - AWS Lambda Deployment"
Write-Info "==================================================================="
Write-Host ""

# =============================================================================
# Prerequisites Check
# =============================================================================

Write-Info "Verificando prerequisitos..."

# Check if AWS CLI is installed
$awsCmd = Get-Command aws -ErrorAction SilentlyContinue
if ($null -eq $awsCmd) {
    Write-Error-Custom "AWS CLI no está instalado"
    Write-Host "Instala AWS CLI: choco install awscli" -ForegroundColor Yellow
    Write-Host "Después reinicia PowerShell" -ForegroundColor Yellow
    exit 1
}
$awsVersion = aws --version 2>&1
Write-Success "AWS CLI instalado: $awsVersion"

# Check if SAM CLI is installed
$samCmd = Get-Command sam -ErrorAction SilentlyContinue
if ($null -eq $samCmd) {
    Write-Error-Custom "AWS SAM CLI no está instalado o no está en el PATH"
    Write-Host ""
    Write-Host "Opciones de solución:" -ForegroundColor Yellow
    Write-Host "1. Si acabas de instalarlo, cierra y reabre PowerShell" -ForegroundColor Cyan
    Write-Host "2. Instala SAM CLI: choco install awssamcli" -ForegroundColor Cyan
    Write-Host "3. Verifica manualmente ejecutando: sam --version" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ubicación de SAM típicamente: C:\Program Files\Amazon\AWSSAMCLI\bin\" -ForegroundColor Gray
    
    # Intentar encontrar sam en ubicaciones comunes
    $commonPaths = @(
        "C:\Program Files\Amazon\AWSSAMCLI\bin\sam.exe",
        "C:\Program Files (x86)\Amazon\AWSSAMCLI\bin\sam.exe",
        "$env:LOCALAPPDATA\Programs\AWS SAM CLI\bin\sam.exe"
    )
    
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            Write-Host ""
            Write-Warning "¡SAM CLI encontrado en: $path"
            Write-Host "Agrega esta ruta al PATH o reinicia PowerShell" -ForegroundColor Yellow
            break
        }
    }
    
    exit 1
}
$samVersion = sam --version 2>&1
Write-Success "AWS SAM CLI instalado: $samVersion"

# Check if Node.js is installed
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $nodeCmd) {
    Write-Error-Custom "Node.js no está instalado"
    exit 1
}
$nodeVersion = node --version
Write-Success "Node.js instalado: $nodeVersion"

# Check AWS credentials
$awsIdentity = aws sts get-caller-identity 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Credenciales de AWS no configuradas"
    Write-Host "Configura AWS CLI: aws configure" -ForegroundColor Yellow
    exit 1
}
Write-Success "Credenciales de AWS configuradas"

Write-Host ""

# =============================================================================
# S3 Bucket for SAM artifacts
# =============================================================================

$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
$S3_BUCKET = "bank-statement-sam-artifacts-$ACCOUNT_ID-$AWS_REGION"

Write-Info "Verificando S3 bucket para artefactos SAM: $S3_BUCKET"

# Verificar si el bucket existe
$bucketCheck = aws s3 ls "s3://$S3_BUCKET" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Bucket no existe, creándolo..."
    
    # Crear el bucket
    $createResult = aws s3 mb "s3://$S3_BUCKET" --region $AWS_REGION 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Error al crear bucket S3: $createResult"
        Write-Host ""
        Write-Host "Posibles causas:" -ForegroundColor Yellow
        Write-Host "1. El nombre del bucket ya existe globalmente (los nombres S3 son únicos globalmente)" -ForegroundColor Gray
        Write-Host "2. No tienes permisos para crear buckets S3" -ForegroundColor Gray
        Write-Host "3. Problema de conectividad con AWS" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Puedes crear el bucket manualmente:" -ForegroundColor Cyan
        Write-Host "  aws s3 mb s3://$S3_BUCKET --region $AWS_REGION" -ForegroundColor Gray
        exit 1
    }
    
    Write-Success "Bucket creado: $S3_BUCKET"
    
    # Esperar un momento para que se propague
    Start-Sleep -Seconds 2
} else {
    Write-Success "Bucket existe: $S3_BUCKET"
}

Write-Host ""

# =============================================================================
# Load Configuration
# =============================================================================

Write-Info "Cargando configuración..."

# Check if .env.lambda exists
if (-not (Test-Path ".env.lambda")) {
    Write-Error-Custom "Archivo .env.lambda no encontrado"
    Write-Host "Crea .env.lambda basado en .env.lambda.example" -ForegroundColor Yellow
    exit 1
}

# Load environment variables from .env.lambda
$envVars = @{}
Get-Content ".env.lambda" | ForEach-Object {
    $line = $_.Trim()
    # Ignorar líneas vacías y comentarios
    if ($line -and -not $line.StartsWith('#')) {
        if ($line -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remover comillas si existen
            $value = $value.Trim('"').Trim("'")
            $envVars[$key] = $value
            Set-Item -Path "env:$key" -Value $value -Force
        }
    }
}

Write-Success "Configuración cargada desde .env.lambda"

# Verificar variables críticas
$requiredVars = @(
    'EMAIL_USER',
    'USE_OAUTH2',
    'GMAIL_OAUTH2_CLIENT_ID',
    'GMAIL_OAUTH2_CLIENT_SECRET',
    'BANK_EMAIL_SENDERS',
    'EMAIL_SUBJECT_KEYWORDS',
    'NOTION_API_KEY',
    'NOTION_DATABASE_ID'
)

$missingVars = @()
foreach ($varName in $requiredVars) {
    if (-not $envVars.ContainsKey($varName) -or [string]::IsNullOrWhiteSpace($envVars[$varName])) {
        $missingVars += $varName
    }
}

if ($missingVars.Count -gt 0) {
    Write-Error-Custom "Variables faltantes o vacías en .env.lambda:"
    foreach ($var in $missingVars) {
        Write-Host "  ✗ $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Por favor edita .env.lambda y configura todas las variables requeridas" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# =============================================================================
# Install Dependencies
# =============================================================================

Write-Info "Instalando dependencias..."

Set-Location ..
npm install --production

Write-Success "Dependencias instaladas"

Write-Host ""

# =============================================================================
# SAM Build
# =============================================================================

Write-Info "Construyendo aplicación SAM..."

Set-Location infrastructure
sam build

Write-Success "Build completado"

Write-Host ""

# =============================================================================
# SAM Deploy
# =============================================================================

Write-Info "Desplegando a AWS..."

# Construir parámetros con valores seguros
$paramOverrides = @(
    "EmailUser=$($envVars['EMAIL_USER'])",
    "UseOAuth2=$($envVars['USE_OAUTH2'])",
    "GmailOAuth2ClientId=$($envVars['GMAIL_OAUTH2_CLIENT_ID'])",
    "GmailOAuth2ClientSecret=$($envVars['GMAIL_OAUTH2_CLIENT_SECRET'])",
    "BankEmailSenders=$($envVars['BANK_EMAIL_SENDERS'])",
    "EmailSubjectKeywords=$($envVars['EMAIL_SUBJECT_KEYWORDS'])",
    "NotionApiKey=$($envVars['NOTION_API_KEY'])",
    "NotionDatabaseId=$($envVars['NOTION_DATABASE_ID'])"
)

Write-Host "Verificando parámetros de deployment..." -ForegroundColor Gray
Write-Host "  Email: $($envVars['EMAIL_USER'])" -ForegroundColor Gray
Write-Host "  OAuth2: $($envVars['USE_OAUTH2'])" -ForegroundColor Gray
Write-Host "  Bancos: $($envVars['BANK_EMAIL_SENDERS'].Split(',').Count) configurado(s)" -ForegroundColor Gray
Write-Host ""

sam deploy `
    --stack-name $STACK_NAME `
    --s3-bucket $S3_BUCKET `
    --region $AWS_REGION `
    --capabilities CAPABILITY_IAM `
    --no-fail-on-empty-changeset `
    --parameter-overrides ($paramOverrides -join ' ')

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Error durante el despliegue de SAM"
    Write-Host "Revisa los errores arriba para más detalles" -ForegroundColor Yellow
    exit 1
}

Write-Success "Despliegue completado"

Write-Host ""

# =============================================================================
# Get Stack Outputs
# =============================================================================

Write-Info "Obteniendo información del stack..."

# Esperar un momento para que el stack esté listo
Start-Sleep -Seconds 3

$FUNCTION_NAME = aws cloudformation describe-stacks `
    --stack-name $STACK_NAME `
    --query "Stacks[0].Outputs[?OutputKey=='BankStatementFunctionName'].OutputValue" `
    --output text `
    --region $AWS_REGION 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Warning "No se pudo obtener información del stack. Puede que esté creándose aún."
    Write-Host "Verifica manualmente en AWS Console: https://console.aws.amazon.com/cloudformation/" -ForegroundColor Yellow
    exit 0
}

$LOG_GROUP_NAME = aws cloudformation describe-stacks `
    --stack-name $STACK_NAME `
    --query "Stacks[0].Outputs[?OutputKey=='LogGroupName'].OutputValue" `
    --output text `
    --region $AWS_REGION

Write-Host ""
Write-Success "==================================================================="
Write-Success "  ¡Despliegue Exitoso!"
Write-Success "==================================================================="
Write-Host ""
Write-Info "Función Lambda: $FUNCTION_NAME"
Write-Info "CloudWatch Logs: $LOG_GROUP_NAME"
Write-Info "Región: $AWS_REGION"
Write-Host ""

# =============================================================================
# Next Steps
# =============================================================================

Write-Warning "==================================================================="
Write-Warning "  PRÓXIMOS PASOS"
Write-Warning "==================================================================="
Write-Host ""
Write-Host "1. Configura el token OAuth2 de Gmail en SSM Parameter Store:"
Write-Host "   npm run setup-oauth-ssm" -ForegroundColor Green
Write-Host ""
Write-Host "2. Prueba la función Lambda manualmente:"
Write-Host "   aws lambda invoke --function-name $FUNCTION_NAME --region $AWS_REGION response.json" -ForegroundColor Green
Write-Host ""
Write-Host "3. Ver logs en tiempo real:"
Write-Host "   aws logs tail $LOG_GROUP_NAME --follow --region $AWS_REGION" -ForegroundColor Green
Write-Host ""
Write-Host "4. La función se ejecutará automáticamente cada hora según el schedule"
Write-Host ""
Write-Success "==================================================================="

