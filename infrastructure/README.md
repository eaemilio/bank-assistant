# 🏗️ Infrastructure - AWS Lambda

Este directorio contiene la configuración de infraestructura como código para desplegar el asistente bancario en AWS Lambda.

## 📁 Archivos

- **`template.yaml`**: AWS SAM template que define toda la infraestructura
- **`deploy.ps1`**: Script automatizado de deployment (PowerShell para Windows)
- **`deploy.sh`**: Script automatizado de deployment (Bash para Linux/macOS)
- **`.gitignore`**: Excluye artifacts de build

## 🚀 Uso

### Despliegue Rápido

**Windows PowerShell:**
```powershell
# Desde el directorio raíz del proyecto
npm run lambda:deploy
```

**Linux/macOS/Git Bash:**
```bash
# Desde el directorio raíz del proyecto
npm run lambda:deploy:bash
```

### Despliegue Manual

```bash
cd infrastructure

# 1. Build
sam build

# 2. Deploy
sam deploy --guided
```

## 🏗️ Componentes de Infraestructura

### AWS Lambda Function
- **Nombre**: `bank-statement-processor`
- **Runtime**: Node.js 20.x
- **Memoria**: 512 MB
- **Timeout**: 5 minutos
- **Arquitectura**: x86_64

### EventBridge Rule
- **Schedule**: `cron(0 * * * ? *)` (cada hora)
- **Descripción**: Trigger automático para procesamiento

### SSM Parameter Store
- **Nombre**: `/bank-assistant/gmail-token`
- **Tipo**: SecureString
- **Propósito**: Almacenar token OAuth2 de Gmail de forma segura

### CloudWatch Logs
- **Log Group**: `/aws/lambda/bank-statement-processor`
- **Retención**: 30 días
- **Propósito**: Logs centralizados de todas las ejecuciones

### IAM Role
La función Lambda tiene permisos para:
- SSM Parameter Store (GetParameter, PutParameter)
- CloudWatch Logs (CreateLogGroup, CreateLogStream, PutLogEvents)

## 📊 Parámetros del Template

El template acepta los siguientes parámetros:

| Parámetro | Descripción | Requerido |
|-----------|-------------|-----------|
| EmailUser | Gmail email address | ✅ |
| UseOAuth2 | Usar OAuth2 (true/false) | ✅ |
| GmailOAuth2ClientId | Google OAuth2 Client ID | ✅ |
| GmailOAuth2ClientSecret | Google OAuth2 Client Secret | ✅ |
| BankEmailSenders | Lista de emails de bancos (separados por coma) | ✅ |
| EmailSubjectKeywords | Keywords para identificar estados de cuenta | ✅ |
| NotionApiKey | Notion API Key | ✅ |
| NotionDatabaseId | Notion Database ID | ✅ |
| ScheduleExpression | Expresión cron para el schedule | ❌ (default: cada hora) |

## 🔧 Personalización

### Cambiar el Schedule

Edita el parámetro `ScheduleExpression` en `template.yaml`:

```yaml
Parameters:
  ScheduleExpression:
    Type: String
    Default: 'cron(0 */3 * * ? *)'  # Cada 3 horas
```

Ejemplos de expresiones cron:
- Cada hora: `cron(0 * * * ? *)`
- Cada 3 horas: `cron(0 */3 * * ? *)`
- Cada día a las 8am UTC: `cron(0 8 * * ? *)`
- Cada 30 minutos: `cron(*/30 * * * ? *)`

### Aumentar Memoria/Timeout

En `template.yaml`:

```yaml
Globals:
  Function:
    Timeout: 600      # 10 minutos
    MemorySize: 1024  # 1 GB
```

## 📈 Monitoreo

### Ver Logs

```bash
# Ver logs en tiempo real
npm run lambda:logs

# O con AWS CLI
aws logs tail /aws/lambda/bank-statement-processor --follow
```

### Ver Métricas

En AWS Console:
1. CloudWatch → Metrics → Lambda
2. Buscar `bank-statement-processor`
3. Ver Invocations, Duration, Errors, Throttles

### Alarmas (Opcional)

Crear alarma para errores:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name bank-statement-errors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 3600 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=bank-statement-processor
```

## 🗑️ Limpiar Recursos

```bash
# Eliminar todo el stack
aws cloudformation delete-stack --stack-name bank-statement-automation

# Eliminar token OAuth2
aws ssm delete-parameter --name "/bank-assistant/gmail-token"

# Eliminar bucket de artifacts
aws s3 rb s3://bank-statement-sam-artifacts-[ACCOUNT_ID]-[REGION] --force
```

## 📚 Referencias

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [EventBridge Schedule Expressions](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule-schedule.html)
- [CloudFormation Template Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/)

## 💡 Tips

1. **Primera ejecución**: Puede tener cold start de 2-3 segundos
2. **Logs**: Se guardan automáticamente en CloudWatch
3. **Errores**: Revisa CloudWatch Logs para troubleshooting
4. **Costos**: Monitorea en AWS Cost Explorer (debería ser $0)
5. **Seguridad**: Las credenciales están en variables de entorno y SSM (encriptadas)

