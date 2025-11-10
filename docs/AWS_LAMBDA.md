# ⚡ AWS Lambda
## 📋 Prerequisites (5 minutos)
### 1. Instalar AWS CLI y SAM CLI

**Windows (PowerShell como Administrador):**
```powershell
# Instalar Chocolatey si no lo tienes
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar AWS CLI y SAM CLI
choco install awscli awssamcli -y
```

**macOS:**
```bash
brew install awscli aws-sam-cli
```

**Linux:**
```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# SAM CLI
wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
sudo ./sam-installation/install
```

### 2. Configurar AWS

**Primera vez con AWS?** → [Sigue la guía completa para crear usuario IAM](AWS_IAM_SETUP.md)

```bash
aws configure
```

Proporciona:
- **AWS Access Key ID**: (obtén de IAM en AWS Console)
- **AWS Secret Access Key**: (obtén junto con el Access Key)
- **Default region**: `us-east-1`
- **Default output format**: `json`

**Permisos necesarios**: El usuario debe tener permisos para Lambda, CloudFormation, EventBridge, SSM, CloudWatch y S3.

## 🚀 Despliegue

### Paso 1: Obtener Token OAuth2 Localmente

```bash
# Ya debes tener configurado OAuth2 localmente
# Si no, ejecuta:
npm run setup-oauth
```

Esto crea `gmail-token.json` con tus credenciales.

### Paso 2: Configurar Variables para Lambda

```bash
# Copiar template
cp .env.lambda.example .env.lambda

# Editar con tus valores
# Windows: notepad .env.lambda
# Mac/Linux: nano .env.lambda
```

Configura mínimo:
```bash
EMAIL_USER=tu_email@gmail.com
GMAIL_OAUTH2_CLIENT_ID=tu_client_id
GMAIL_OAUTH2_CLIENT_SECRET=tu_client_secret
BANK_EMAIL_SENDERS=email1@banco.com,email2@banco.com
NOTION_API_KEY=secret_xxx
NOTION_DATABASE_ID=xxx
```

### Paso 3: Instalar Dependencia AWS

```bash
npm install @aws-sdk/client-ssm
```

### Paso 4: Desplegar a AWS

```powershell
# Windows PowerShell (recomendado)
npm run lambda:deploy
```

```bash
# Si prefieres usar Git Bash o WSL
npm run lambda:deploy:bash
```

El script automáticamente:
- ✅ Verifica prerequisites
- ✅ Crea infraestructura en AWS
- ✅ Despliega la función Lambda
- ✅ Configura el schedule (cada hora)

### Paso 5: Subir Token a AWS

```bash
npm run setup-oauth-ssm
```

## ✅ Verificación

### Probar Manualmente

```bash
npm run lambda:test
```

Deberías ver:
```json
{
  "statusCode": 200,
  "body": "{\"message\":\"Procesamiento completado\",\"emailsProcessed\":0,...}"
}
```

### Ver Logs

```bash
npm run lambda:logs
```

## ⚙️ Configuración del Schedule

Por defecto se ejecuta **cada hora**. Para cambiar:

1. Edita `infrastructure/template.yaml`
2. Cambia el `ScheduleExpression`:

```yaml
# Cada 3 horas
ScheduleExpression: 'cron(0 */3 * * ? *)'

# Cada día a las 8am
ScheduleExpression: 'cron(0 8 * * ? *)'

# Cada 30 minutos
ScheduleExpression: 'cron(*/30 * * * ? *)'
```

3. Redesplegar: `npm run lambda:deploy`

## 🐛 Problemas Comunes

### "Access Denied" en deployment

```bash
# Verifica que tu usuario AWS tenga permisos
aws sts get-caller-identity
```

Tu usuario necesita permisos para:
- Lambda
- CloudFormation
- IAM
- CloudWatch
- S3
- SSM

### "Token expired" en Lambda

```bash
# Obtener nuevo token localmente
npm run setup-oauth

# Subirlo a AWS
npm run setup-oauth-ssm
```

## 🗑️ Eliminar Todo
Si necesitas eliminar la infraestructura:
```bash
# Eliminar stack de CloudFormation
aws cloudformation delete-stack --stack-name bank-statement-automation

# Eliminar token de SSM
aws ssm delete-parameter --name "/bank-assistant/gmail-token"
```

