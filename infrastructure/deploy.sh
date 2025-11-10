#!/bin/bash

# =============================================================================
# Bank Statement Automation - AWS Lambda Deployment Script
# =============================================================================
# Este script automatiza el despliegue de la función Lambda a AWS
# usando AWS SAM (Serverless Application Model)
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# =============================================================================
# Configuration
# =============================================================================

STACK_NAME="bank-statement-automation"
S3_BUCKET=""  # Will be created if not exists
AWS_REGION="${AWS_REGION:-us-east-1}"

print_info "==================================================================="
print_info "  Bank Statement Automation - AWS Lambda Deployment"
print_info "==================================================================="
echo ""

# =============================================================================
# Prerequisites Check
# =============================================================================

print_info "Verificando prerequisitos..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI no está instalado"
    echo "Instala AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi
print_success "AWS CLI instalado"

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    print_error "AWS SAM CLI no está instalado"
    echo "Instala SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    exit 1
fi
print_success "AWS SAM CLI instalado"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    exit 1
fi
print_success "Node.js instalado ($(node --version))"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "Credenciales de AWS no configuradas"
    echo "Configura AWS CLI: aws configure"
    exit 1
fi
print_success "Credenciales de AWS configuradas"

echo ""

# =============================================================================
# S3 Bucket for SAM artifacts
# =============================================================================

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
S3_BUCKET="bank-statement-sam-artifacts-${ACCOUNT_ID}-${AWS_REGION}"

print_info "Verificando S3 bucket para artefactos SAM: ${S3_BUCKET}"

if aws s3 ls "s3://${S3_BUCKET}" 2>&1 | grep -q 'NoSuchBucket'; then
    print_warning "Bucket no existe, creándolo..."
    aws s3 mb "s3://${S3_BUCKET}" --region "${AWS_REGION}"
    print_success "Bucket creado: ${S3_BUCKET}"
else
    print_success "Bucket existe: ${S3_BUCKET}"
fi

echo ""

# =============================================================================
# Load Configuration
# =============================================================================

print_info "Cargando configuración..."

# Check if .env.lambda exists
if [ ! -f ".env.lambda" ]; then
    print_error "Archivo .env.lambda no encontrado"
    echo "Crea .env.lambda basado en .env.lambda.example"
    exit 1
fi

# Load environment variables from .env.lambda
export $(grep -v '^#' .env.lambda | xargs)

print_success "Configuración cargada desde .env.lambda"

echo ""

# =============================================================================
# Install Dependencies
# =============================================================================

print_info "Instalando dependencias..."

cd ..
npm install --production

print_success "Dependencias instaladas"

echo ""

# =============================================================================
# SAM Build
# =============================================================================

print_info "Construyendo aplicación SAM..."

cd infrastructure
sam build

print_success "Build completado"

echo ""

# =============================================================================
# SAM Deploy
# =============================================================================

print_info "Desplegando a AWS..."

sam deploy \
    --stack-name "${STACK_NAME}" \
    --s3-bucket "${S3_BUCKET}" \
    --region "${AWS_REGION}" \
    --capabilities CAPABILITY_IAM \
    --no-fail-on-empty-changeset \
    --parameter-overrides \
        "EmailUser=${EMAIL_USER}" \
        "UseOAuth2=${USE_OAUTH2}" \
        "GmailOAuth2ClientId=${GMAIL_OAUTH2_CLIENT_ID}" \
        "GmailOAuth2ClientSecret=${GMAIL_OAUTH2_CLIENT_SECRET}" \
        "BankEmailSenders=${BANK_EMAIL_SENDERS}" \
        "EmailSubjectKeywords=${EMAIL_SUBJECT_KEYWORDS}" \
        "NotionApiKey=${NOTION_API_KEY}" \
        "NotionDatabaseId=${NOTION_DATABASE_ID}"

print_success "Despliegue completado"

echo ""

# =============================================================================
# Get Stack Outputs
# =============================================================================

print_info "Obteniendo información del stack..."

FUNCTION_NAME=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --query "Stacks[0].Outputs[?OutputKey=='BankStatementFunctionName'].OutputValue" \
    --output text \
    --region "${AWS_REGION}")

LOG_GROUP_NAME=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --query "Stacks[0].Outputs[?OutputKey=='LogGroupName'].OutputValue" \
    --output text \
    --region "${AWS_REGION}")

echo ""
print_success "==================================================================="
print_success "  ¡Despliegue Exitoso!"
print_success "==================================================================="
echo ""
print_info "Función Lambda: ${FUNCTION_NAME}"
print_info "CloudWatch Logs: ${LOG_GROUP_NAME}"
print_info "Región: ${AWS_REGION}"
echo ""

# =============================================================================
# Next Steps
# =============================================================================

print_warning "==================================================================="
print_warning "  PRÓXIMOS PASOS"
print_warning "==================================================================="
echo ""
echo "1. Configura el token OAuth2 de Gmail en SSM Parameter Store:"
echo "   ${GREEN}npm run setup-oauth-ssm${NC}"
echo ""
echo "2. Prueba la función Lambda manualmente:"
echo "   ${GREEN}aws lambda invoke --function-name ${FUNCTION_NAME} --region ${AWS_REGION} response.json${NC}"
echo ""
echo "3. Ver logs en tiempo real:"
echo "   ${GREEN}aws logs tail ${LOG_GROUP_NAME} --follow --region ${AWS_REGION}${NC}"
echo ""
echo "4. La función se ejecutará automáticamente cada hora según el schedule"
echo ""
print_success "==================================================================="

