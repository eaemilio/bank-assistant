# Troubleshooting Guide

## Table of Contents
- [Installation Problems](#installation-problems)
- [Configuration Problems](#configuration-problems)
- [Connection Problems](#connection-problems)
- [Processing Problems](#processing-problems)
- [Performance Problems](#performance-problems)
- [Diagnostic Tools](#diagnostic-tools)

---

## Installation Problems

### Error: `npm install` fails

**Symptom:**
```
npm ERR! code ENOENT
npm ERR! syscall open
```

**Cause:** You're not in the correct directory or `package.json` doesn't exist

**Solution:**
```bash
# Windows
cd C:\path\to\bank-assistant

# Mac/Linux
cd /path/to/bank-assistant

# Verify that package.json exists
dir  # Windows
ls   # Mac/Linux
```

### Error: Node.js not found

**Symptom:**
```
'node' is not recognized as an internal or external command
```

**Cause:** Node.js is not installed or not in PATH

**Solution:**
1. Download Node.js: https://nodejs.org/
2. Install the LTS version
3. Restart the terminal
4. Verify: `node --version`

### Error installing specific dependencies

**Symptom:**
```
npm ERR! gyp ERR! build error
```

**Cause:** Missing C++ compiler for native modules

**Windows Solution:**
```bash
npm install --global windows-build-tools
```

**Mac Solution:**
```bash
xcode-select --install
```

**Linux Solution:**
```bash
sudo apt-get install build-essential
```

---

## Configuration Problems

### Error: "Configuration incomplete"

**Symptom:**
```
Error: Incomplete configuration. Missing the following variables: email.user, email.password
```

**Cause:** `.env` file doesn't exist or is incomplete

**Solution:**
1. Verify that the `.env` file exists (with dot at the beginning)
2. Copy from template:
   ```bash
   # Windows
   copy config.example.env .env
   
   # Mac/Linux
   cp config.example.env .env
   ```
3. Edit `.env` with your data
4. Verify with: `npm run check`

### Error: .env file not loading

**Symptom:** Variables are in `.env` but system says they're missing

**Cause:** Incorrect file name

**Solution:**
```bash
# The file must be named EXACTLY .env
# NOT .env.txt
# NOT env
# NOT .env.example

# Windows - show hidden files:
# Explorer → View → Options → View → Show hidden files

# Rename if necessary:
ren env .env           # Windows
mv env .env            # Mac/Linux
```

### Environment variables not recognized

**Symptom:** `undefined` instead of values

**Cause:** Incorrect format in `.env`

**Solution:**
```env
# INCORRECT:
EMAIL_USER = my_email@gmail.com    # NO spaces around =
EMAIL_USER="my_email@gmail.com"    # NO quotes unless needed
EMAIL_USER                          # NO missing value

# CORRECT:
EMAIL_USER=my_email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

---

## Connection Problems

### Error: "Invalid credentials"

**Symptom:**
```
Error: Invalid credentials (Failure)
```

**Diagnosis:**
```bash
# Verify configuration
npm run check
```

**Causes and Solutions:**

#### 1. Gmail without app password
```env
# INCORRECT:
EMAIL_PASSWORD=my_normal_password

# CORRECT:
EMAIL_PASSWORD=abcd efgh ijkl mnop  # 16 characters
```

**How to get app password:**
1. https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Search for "App passwords"
4. Generate new one for "Mail"
5. Copy the 16 characters

#### 2. Incorrect username
```env
# CORRECT - complete email:
EMAIL_USER=john.doe@gmail.com

# INCORRECT - without domain:
EMAIL_USER=john.doe
```

#### 3. IMAP not enabled in Gmail
**Solution:**
1. Gmail → → See all settings
2. "Forwarding and POP/IMAP"
3. "Enable IMAP"
4. Save changes

### Error: "Connection timeout"

**Symptom:**
```
Error: connect ETIMEDOUT
```

**Causes and Solutions:**

#### 1. Firewall/Antivirus blocking
- Add exception for Node.js
- Allow IMAP connections (port 993)

#### 2. Incorrect Host/Port
```env
# Gmail
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993

# Outlook
EMAIL_HOST=outlook.office365.com
EMAIL_PORT=993

# Yahoo
EMAIL_HOST=imap.mail.yahoo.com
EMAIL_PORT=993
```

#### 3. No internet connection
```bash
# Test connection
ping google.com
```

### Error: "Certificate has expired"

**Symptom:**
```
Error: certificate has expired
```

**Temporary Solution:**
```javascript
// In src/services/emailService.js, line ~20:
tlsOptions: { rejectUnauthorized: false }
```

**Permanent Solution:**
- Update Node.js to the latest version

---

## Processing Problems

### Doesn't find bank emails

**Symptom:** System says "No new emails found"

**Diagnosis:**
```bash
# 1. Verify configuration
npm run check

# 2. See debug level
# In .env:
LOG_LEVEL=debug

# 3. Check logs
# Windows:
type logs\combined.log

# Mac/Linux:
cat logs/combined.log
```

**Causes and Solutions:**

#### 1. Incorrect sender
```bash
# Verify EXACT bank email
# Open email → See details → From:
```

```env
# CORRECT - complete email:
BANK_EMAIL_SENDER=notifications@banamex.com

# INCORRECT - partial:
BANK_EMAIL_SENDER=banamex.com
```

#### 2. Keywords don't match
```env
# See the actual email subject and add keywords:
EMAIL_SUBJECT_KEYWORDS=statement,card,credit card,account statement
```

#### 3. Emails already marked as read
**Solution:** Mark an email as unread in your inbox

#### 4. Emails in another folder
```env
# By default searches in INBOX
# If they're in another folder:
EMAIL_FOLDER=Promotions
EMAIL_FOLDER=Inbox
```

### PDF has no attachments

**Symptom:** "No PDFs found in email"

**Causes:**
- The statement is in the email body, not attached
- The attachment is not PDF (could be image or link)

**Solution:** Verify that the email actually has a PDF attachment

### Doesn't extract information from PDF

**Symptom:** "Cash payment information not found"

**Diagnosis:**
```javascript
// See extracted text in logs:
LOG_LEVEL=debug
```

**Causes and Solutions:**

#### 1. PDF is scanned image
**Cause:** The PDF doesn't have text, it's an image

**Identify:**
- Open the PDF
- Try to select text
- If you can't, it's an image

**Solution:** Currently no OCR support (coming soon)

#### 2. Different bank format
**Cause:** Patterns don't match your bank

**Solution:**
1. Check the text in `logs/combined.log`
2. Manually find the cash payment
3. Edit `src/services/parserService.js`
4. Add your pattern:

```javascript
pagoContado: [
  /pago\s+(?:de\s+)?contado[:\s]+(?:[$]|MXN|USD)?\s*([\d,]+\.?\d*)/gi,
  // Add your pattern here:
  /your\s+custom\s+pattern/gi,
],
```

#### 3. Encrypted/protected PDF
**Solution:** No current support for protected PDFs

### Error saving files

**Symptom:**
```
Error: EACCES: permission denied
```

**Cause:** No permissions in folder

**Solution:**
```bash
# Windows - run as administrator

# Mac/Linux - give permissions:
chmod -R 755 downloads/
chmod -R 755 logs/
```

---

## Performance Problems

### High CPU usage

**Cause:** Processing large PDFs

**Solution:**
```env
# Reduce check frequency
CHECK_INTERVAL_MINUTES=15
```

### High memory usage

**Cause:** Very large PDFs in memory

**Normal:** Temporary during processing

**Solution if persists:**
- Close other programs
- Increase system RAM
- Process smaller PDFs

### Very slow system

**Diagnosis:**
```bash
# See resource usage
# Windows:
taskmgr

# Mac:
Activity Monitor

# Linux:
top
```

**Solutions:**
- Increase `CHECK_INTERVAL_MINUTES`
- Verify no multiple instances running
- Restart the system

---

## Diagnostic Tools

### 1. Verify Configuration

```bash
npm run check
```

Verifies that all variables are correct.

### 2. See Detailed Logs

```bash
# Change log level
# In .env:
LOG_LEVEL=debug

# See logs in real time (Windows):
Get-Content logs\combined.log -Wait

# Mac/Linux:
tail -f logs/combined.log
```

### 3. Test IMAP Connection Manually

Create `test-imap.js`:

```javascript
import Imap from 'imap';

const imap = new Imap({
  user: 'your_email@gmail.com',
  password: 'your_password',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
});

imap.once('ready', () => {
  console.log('Connection successful!');
  imap.end();
});

imap.once('error', (err) => {
  console.error('Error:', err.message);
});

imap.connect();
```

```bash
node test-imap.js
```

### 4. Test PDF Extraction

Create `test-pdf.js`:

```javascript
import pdf from 'pdf-parse';
import { readFileSync } from 'fs';

const dataBuffer = readFileSync('path/to/your/statement.pdf');

pdf(dataBuffer).then((data) => {
  console.log('Pages:', data.numpages);
  console.log('Text:', data.text.substring(0, 500));
});
```

```bash
node test-pdf.js
```

### 5. View Loaded Environment Variables

Create `test-env.js`:

```javascript
import dotenv from 'dotenv';
dotenv.config();

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('BANK_EMAIL_SENDER:', process.env.BANK_EMAIL_SENDER);
// DON'T print EMAIL_PASSWORD for security
```

```bash
node test-env.js
```

---

## Diagnostic Checklist

When you have a problem, follow this order:

- [ ] 1. Is Node.js installed? `node --version`
- [ ] 2. Dependencies installed? `npm install`
- [ ] 3. Does `.env` file exist and is complete? `npm run check`
- [ ] 4. Are there errors in logs? Check `logs/error.log`
- [ ] 5. Does connection work? Verify credentials
- [ ] 6. Do emails exist? Check inbox
- [ ] 7. Does PDF have text? Try to select text in the PDF

---

## Get Help

If no solution works:

1. **Collect information:**
   - Node.js version: `node --version`
   - Operating system
   - Content of `logs/error.log` (without passwords)
   - Exact steps to reproduce

2. **Search for similar issues:**
   - Check FAQ.md
   - Search in GitHub Issues

3. **Create an Issue:**
   - Include all collected information
   - Describe the problem clearly
   - Include relevant logs (WITHOUT passwords or sensitive information)

---

**Problem persists?** Open an issue on GitHub with:
- Problem description
- Relevant logs (without sensitive info)
- Operating system and Node.js version
- Steps to reproduce
