# Bank Statement Automation

Automated system to process credit card statements received by email. The system monitors your inbox, extracts statement PDFs and automatically finds cash payment information.

## Operating Modes

### Local Mode
Run the system continuously on your computer. Ideal for testing and development.

### Cloud Mode (AWS Lambda)
Run the system automatically in the cloud without maintaining servers. **FREE!** ($0/month using AWS free tier)

**[→ Deploy to AWS Lambda in 5 minutes](AWS_LAMBDA_QUICKSTART.md)**

## Features

- **Automatic email monitoring** - Checks your inbox periodically
- **PDF extraction** - Detects and downloads attached PDF files
- **Intelligent analysis** - Extracts key information from the statement:
  - Cash payment (USD and GTQ)
  - Payment date
  - Last 4 digits of card
  - Total balance
  - Account number
  - Statement period
- **Result storage** - Stores PDFs and results in JSON format
- **Notion integration** - Automatically saves information to your Notion database
- **Complete logging** - Detailed logging system for tracking
- **Multi-currency support** - MXN, USD, GTQ and more
- **Modular system per bank** - Automatic detection and bank-specific strategies
- **Abstract Factory Pattern** - Professional and scalable architecture
- **Cloud deployment** - Full support for AWS Lambda (serverless)

## Prerequisites

- Node.js 18 or higher
- Email account with IMAP access enabled
- Bank statements in PDF format
- (Optional) Notion account to automatically save data

## Quick Start

### Option 1: AWS Lambda (Recommended for Production)

**Why AWS Lambda?**
- Gratuitous (AWS free tier)
- No server maintenance
- Highly available
- Centralized logs

**Available guides:**
- [5-minute Quick Guide](AWS_LAMBDA_QUICKSTART.md) - Start now
- [Configure IAM User](AWS_IAM_SETUP.md) - Required permissions
- [Complete Deployment Guide](DEPLOYMENT.md) - Detailed documentation

### Option 2: Local Execution

## Local Installation

1. **Clone or download the project**

```bash
cd bank-assistant
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Copy the template file and edit with your data:

```bash
copy .env.template .env
```

Edit the `.env` file with your favorite text editor and configure:

```env
# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_password
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_TLS=true

# Bank sender
BANK_EMAIL_SENDER=notifications@bank.com

# Keywords to identify statements
EMAIL_SUBJECT_KEYWORDS=statement,state,credit card
```

## Gmail Configuration

If you use Gmail, you need to enable IMAP access and create an app password:

### 1. Enable IMAP

1. Go to Gmail → Settings → View all settings
2. "Forwarding and POP/IMAP" tab
3. Enable "Enable IMAP"
4. Save changes

### 2. Create App Password

1. Go to your Google account: https://myaccount.google.com/
2. Security → 2-Step Verification (must be activated)
3. App passwords
4. Select "Mail" and "Other custom device"
5. Copy the generated password (16 characters)
6. Use it in `EMAIL_PASSWORD` in your `.env` file

## Notion Configuration (Optional)

To automatically save information to a Notion database:

1. **Follow the complete guide at:** [NOTION_SETUP.md](NOTION_SETUP.md)
2. **Add to your `.env`:**
   ```env
   NOTION_API_KEY=secret_your_api_key
   NOTION_DATABASE_ID=your_database_id
   ```
3. **Test the connection:**
   ```bash
   npm run test:notion
   ```

**Information saved to Notion:**
- Payment date
- Cash Payment USD
- Cash Payment GTQ
- Last 4 digits of card

> **Note:** Notion integration is optional. If you don't configure the variables, the application will work normally saving only local JSON files.

## Configuration for Other Banks

### Configure Bank Sender

You need to identify from which email address your bank sends statements:

1. Open a bank statement email from your bank
2. Look at the sender address (e.g.: `notifications@banamex.com`)
3. Configure it in `.env`:

```env
BANK_EMAIL_SENDER=notifications@yourBank.com
```

### Configure Keywords

Configure the words that appear in the email subject:

```env
EMAIL_SUBJECT_KEYWORDS=statement,card,credit card
```

## Usage

### Normal Mode

```bash
npm start
```

The system:
1. Connects to your email
2. Searches for unread emails from the bank
3. Processes attached PDFs
4. Extracts payment information
5. Saves results locally (JSON)
6. Saves to Notion (if configured)
7. Marks emails as read
8. Repeats the process every X minutes (configured in `.env`)

### Development Mode (with auto-restart)

```bash
npm run dev
```

### Stop the System

Press `Ctrl + C` in the terminal

## Project Structure

```
bank-assistant/
├── src/
│   ├── config/
│   │   └── config.js          # Application configuration
│   ├── services/
│   │   ├── emailService.js    # Email service
│   │   ├── pdfService.js      # PDF processing service
│   │   ├── parserService.js   # Text analysis service
│   │   └── notionService.js   # Notion integration service
│   ├── utils/
│   │   └── logger.js          # Logging system
│   └── index.js               # Main file
├── downloads/                  # Downloaded PDFs and results
├── logs/                       # Log files
├── .env                        # Environment variables (do not include in git)
├── .env.template              # Configuration template
├── .gitignore
├── package.json
└── README.md
```

## Result Output

Each processed statement generates two files in the `downloads/` folder:

### 1. Original PDF
```
[timestamp]_statement.pdf
```

### 2. Results in JSON
```json
{
  "email": {
    "subject": "Your Statement",
    "from": "bank@example.com",
    "date": "2024-11-06T12:00:00.000Z"
  },
  "pdf": {
    "filename": "statement.pdf",
    "filepath": "./downloads/1234567890_statement.pdf"
  },
  "statement": {
    "found": true,
    "pagoContado": 5432.10,
    "pagoMinimo": 150.00,
    "saldoTotal": 5432.10,
    "fechaLimite": "20/11/2024",
    "moneda": "MXN",
    "accountNumber": "1234",
    "period": {
      "start": "20/10/2024",
      "end": "19/11/2024"
    },
    "processedAt": "2024-11-06T12:00:00.000Z"
  }
}
```

## Customization

### Adjust Search Patterns

If the system doesn't find information correctly, you can adjust search patterns in `src/services/parserService.js`:

```javascript
const patterns = {
  pagoContado: [
    /pago\s+(?:de\s+)?contado[:\s]+(?:[$]|MXN|USD)?\s*([\d,]+\.?\d*)/gi,
    // Add your own patterns here
  ],
  // ...
};
```

### Change Check Interval

In your `.env` file:

```env
# Check every 5 minutes
CHECK_INTERVAL_MINUTES=5

# Check every hour
CHECK_INTERVAL_MINUTES=60
```

## Logs

Logs are saved in the `logs/` folder:

- `combined.log` - All events
- `error.log` - Only errors

They are also displayed in the console with colors.

## Troubleshooting

### Authentication Error

```
Error: Invalid credentials
```

**Solution:**
- Verify that `EMAIL_USER` and `EMAIL_PASSWORD` are correct
- If using Gmail, use an app password, not your normal password
- Verify that 2-Step Verification is activated (Gmail)

### Doesn't Find Emails

**Solution:**
- Verify that `BANK_EMAIL_SENDER` is correct
- Check keywords in `EMAIL_SUBJECT_KEYWORDS`
- Verify that emails are not marked as read

### Doesn't Extract Information

**Solution:**
- Check the log to see the text extracted from the PDF
- Adjust search patterns in `parserService.js`
- Some PDFs may have image format and not text (would need OCR)

### Error Connecting IMAP

```
Error: connect ECONNREFUSED
```

**Solution:**
- Verify that `EMAIL_HOST` and `EMAIL_PORT` are correct
- Verify your internet connection
- Some providers may block IMAP connections, contact your provider

## Security

- **NEVER** share your `.env` file
- **NEVER** upload your `.env` file to Git (it's in `.gitignore`)
- Use app passwords instead of your main password
- Periodically review access to your email account

## Adding Support for New Banks

The system has a **modular detection system per bank** that allows you to easily add support for new banks.

### Currently Supported Banks

- **Banco Promerica (Guatemala)** - Fully supported with specific strategy
- **Other banks** - Uses generic strategy (may require adjustments)

### How It Works

1. The system automatically detects the bank from the PDF
2. Applies the specific extraction strategy for that bank
3. If it doesn't recognize the bank, uses a generic strategy

### Complete Guide

- **`BANKS.md`** - Guide to add banks, examples and troubleshooting
- **`ARCHITECTURE_FACTORY.md`** - Complete documentation of implemented Abstract Factory pattern

## Future Improvements

- [ ] OCR support for PDFs with images
- [ ] Notifications (email, SMS, webhook)
- [ ] Database for payment history
- [ ] Web dashboard to visualize results
- [ ] Support for multiple banks/accounts
- [ ] Integration with automatic payment APIs
- [ ] Payment date reminders

## Support

If you encounter problems:

1. Check the logs in the `logs/` folder
2. Verify your configuration in `.env`
3. Make sure you have the latest version of Node.js
4. Check that all dependencies are installed: `npm install`

## License

MIT

## Contributions

Contributions are welcome. Please:

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Note:** This project is for personal and educational use. Make sure to comply with your email provider's terms of service and your bank's policies.
