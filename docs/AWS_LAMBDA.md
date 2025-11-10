# AWS Lambda
## Prerequisites (5 minutes)
### 1. Install AWS CLI and SAM CLI

**Windows (PowerShell as Administrator):**
```powershell
# Install Chocolatey if you don't have it
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install AWS CLI and SAM CLI
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

### 2. Configure AWS

**First time with AWS?** → [Follow the complete guide to create IAM user](AWS_IAM_SETUP.md)

```bash
aws configure
```

Provide:
- **AWS Access Key ID**: (get from IAM in AWS Console)
- **AWS Secret Access Key**: (get along with Access Key)
- **Default region**: `us-east-1`
- **Default output format**: `json`

**Required permissions**: The user must have permissions for Lambda, CloudFormation, EventBridge, SSM, CloudWatch and S3.

## Deployment

### Step 1: Get OAuth2 Token Locally

```bash
# You should already have OAuth2 configured locally
# If not, run:
npm run setup-oauth
```

This creates `gmail-token.json` with your credentials.

### Step 2: Configure Variables for Lambda

```bash
# Copy template
cp .env.lambda.example .env.lambda

# Edit with your values
# Windows: notepad .env.lambda
# Mac/Linux: nano .env.lambda
```

Configure at minimum:
```bash
EMAIL_USER=your_email@gmail.com
GMAIL_OAUTH2_CLIENT_ID=your_client_id
GMAIL_OAUTH2_CLIENT_SECRET=your_client_secret
BANK_EMAIL_SENDERS=email1@bank.com,email2@bank.com
NOTION_API_KEY=secret_xxx
NOTION_DATABASE_ID=xxx
```

### Step 3: Install AWS Dependency

```bash
npm install @aws-sdk/client-ssm
```

### Step 4: Deploy to AWS

```powershell
# Windows PowerShell (recommended)
npm run lambda:deploy
```

```bash
# If you prefer to use Git Bash or WSL
npm run lambda:deploy:bash
```

The script automatically:
- Verifies prerequisites
- Creates infrastructure in AWS
- Deploys the Lambda function
- Configures the schedule (every hour)

### Step 5: Upload Token to AWS

```bash
npm run setup-oauth-ssm
```

## Verification

### Test Manually

```bash
npm run lambda:test
```

You should see:
```json
{
  "statusCode": 200,
  "body": "{\"message\":\"Processing completed\",\"emailsProcessed\":0,...}"
}
```

### View Logs

```bash
npm run lambda:logs
```

## Schedule Configuration

By default it runs **every hour**. To change:

1. Edit `infrastructure/template.yaml`
2. Change the `ScheduleExpression`:

```yaml
# Every 3 hours
ScheduleExpression: 'cron(0 */3 * * ? *)'

# Every day at 8am
ScheduleExpression: 'cron(0 8 * * ? *)'

# Every 30 minutes
ScheduleExpression: 'cron(*/30 * * * ? *)'
```

3. Redeploy: `npm run lambda:deploy`

## Common Problems

### "Access Denied" during deployment

```bash
# Verify that your AWS user has permissions
aws sts get-caller-identity
```

Your user needs permissions for:
- Lambda
- CloudFormation
- IAM
- CloudWatch
- S3
- SSM

### "Token expired" in Lambda

```bash
# Get new token locally
npm run setup-oauth

# Upload it to AWS
npm run setup-oauth-ssm
```

## Delete Everything
If you need to delete the infrastructure:
```bash
# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name bank-statement-automation

# Delete token from SSM
aws ssm delete-parameter --name "/bank-assistant/gmail-token"
```
