# Quick Setup Guide

## Step 1: Install Node.js

1. Download Node.js from: https://nodejs.org/
2. Install the LTS version (Long Term Support)
3. Verify the installation:

```bash
node --version
npm --version
```

## Step 2: Configure the Project

1. Open the terminal in the project folder
2. Install dependencies:

```bash
npm install
```

## Step 3: Configure Gmail (if using Gmail)

### Enable IMAP

1. Open Gmail
2. Click on (Settings) → "See all settings"
3. "Forwarding and POP/IMAP" tab
4. Select "Enable IMAP"
5. Save changes

### Create App Password

**Important:** Gmail requires 2-Step Verification to use app passwords

1. Go to https://myaccount.google.com/security
2. Activate "2-Step Verification" (if not already active)
3. Search for "App passwords"
4. Select:
   - App: "Mail"
   - Device: "Other (custom name)" → type "Bank Assistant"
5. Copy the 16-character password (without spaces)

## Step 4: Identify Your Bank's Email

1. Open a bank statement email from your bank
2. Look at the sender's email address

Common examples:
- BBVA: `notifications@bbva.com`
- Santander: `statement@santander.com.mx`
- Banamex: `notifications@banamex.com`
- HSBC: `statement@hsbc.com.mx`

## Step 5: Create Configuration File

1. In the project folder, create a file named `.env`
2. Copy this content and fill in with your data:

```env
# YOUR EMAIL
EMAIL_USER=your_email@gmail.com

# THE 16-CHARACTER APP PASSWORD
EMAIL_PASSWORD=aaaa bbbb cccc dddd

# EMAIL SERVER (Gmail by default)
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_TLS=true

# EMAIL FOLDER
EMAIL_FOLDER=INBOX

# YOUR BANK'S EMAIL
BANK_EMAIL_SENDER=notifications@bank.com

# KEYWORDS IN EMAIL SUBJECT
EMAIL_SUBJECT_KEYWORDS=statement,card

# CHECK EVERY 5 MINUTES
CHECK_INTERVAL_MINUTES=5

# FOLDERS
DOWNLOAD_FOLDER=./downloads
LOG_FOLDER=./logs

# LOG LEVEL
LOG_LEVEL=info
```

## Step 6: Test the Connection

Run the program:

```bash
npm start
```

You should see:

```
Bank Statement Automation System
Configuration validated successfully
Monitoring: your_email@gmail.com
Bank: notifications@bank.com
System started successfully
```

## Common Problems

### Error: "Invalid credentials"

**Cause:** Incorrect username or password

**Solution:**
- Verify your email in `EMAIL_USER`
- Verify that you use the app password (16 characters)
- DO NOT use your normal Gmail password

### Error: "Configuration incomplete"

**Cause:** Missing information in the `.env` file

**Solution:**
- Verify that the file is named exactly `.env` (with the dot at the beginning)
- Verify that all variables are configured
- Don't leave spaces before or after the `=`

### Doesn't find emails

**Cause:** Incorrect bank or keyword configuration

**Solution:**
- Verify that `BANK_EMAIL_SENDER` is exactly the bank's email
- Adjust `EMAIL_SUBJECT_KEYWORDS` with words that appear in the subject
- Verify that you have unread emails from the bank in your inbox

## Configuration for Other Providers

### Outlook/Hotmail

```env
EMAIL_HOST=outlook.office365.com
EMAIL_PORT=993
EMAIL_TLS=true
```

### Yahoo

```env
EMAIL_HOST=imap.mail.yahoo.com
EMAIL_PORT=993
EMAIL_TLS=true
```

**Note:** These providers may also require app passwords

## Next Step

Once you see that the system connects successfully:

1. Send yourself a test email with an attached PDF
2. Or wait for your next bank statement to arrive
3. The system will detect it automatically and process it

## Need Help?

Check the `logs/combined.log` file to see detailed information about what's happening.

To see more logs in the console, change in `.env`:

```env
LOG_LEVEL=debug
```
