# OAuth2 Configuration Guide for Gmail

This guide will help you configure OAuth2 to access Gmail without needing application passwords.

---

## Configuration Steps

### Step 1: Create a Project in Google Cloud Console

1. Go to: **https://console.cloud.google.com/**

2. Sign in with your Gmail account

3. Click on the project selector (top left, next to "Google Cloud")

4. Click on **"NEW PROJECT"**

5. Configure the project:
   - **Name:** "Bank Assistant" (or the name you prefer)
   - **Organization:** Leave as is
   - Click on **"CREATE"**

6. Wait for the project to be created (a notification will appear)

7. Select the newly created project from the project selector

---

### Step 2: Enable Gmail API

1. In the navigation menu, go to: **"APIs & Services" → "Library"**

2. In the search bar, type: **"Gmail API"**

3. Click on **"Gmail API"**

4. Click on the **"ENABLE"** button

5. Wait for the API to be enabled

---

### Step 3: Configure OAuth Consent Screen

1. In the side menu, go to: **"OAuth consent screen"**

2. Select user type:
   - **External** (for personal Gmail accounts)
   - Click on **"CREATE"**

3. **Page 1: App information**
   ```
   App name: Bank Assistant
   User support email: your_email@gmail.com
   ```
   - Leave other fields empty for now
   - Click on **"SAVE AND CONTINUE"**

4. **Page 2: Scopes**
   - Click on **"ADD OR REMOVE SCOPES"**
   - In the filter, search: **"Gmail API"**
   - Select the scope:
     - `https://mail.google.com/` (Full Gmail access)
   - Click on **"UPDATE"**
   - Click on **"SAVE AND CONTINUE"**

5. **Page 3: Test users**
   - Click on **"+ ADD USERS"**
   - Enter your email: `your_email@gmail.com`
   - Click on **"ADD"**
   - Click on **"SAVE AND CONTINUE"**

6. **Page 4: Summary**
   - Review the information
   - Click on **"BACK TO DASHBOARD"**

---

### Step 4: Create OAuth 2.0 Credentials

1. In the side menu, go to: **"Credentials"**

2. Click on **"+ CREATE CREDENTIALS"** (at the top)

3. Select: **"OAuth client ID"**

4. Configure the credentials:
   ```
   Application type: Desktop app
   Name: Bank Assistant Desktop
   ```

5. Click on **"CREATE"**

6. A dialog will appear with your credentials:
   - **Client ID:** `xxxxx.apps.googleusercontent.com`
   - **Client secret:** `GOCSPX-xxxxx`
   
7. **IMPORTANT!** Copy these values, you'll need them in the next step

---

### Step 5: Configure the .env File

1. Open your `.env` file (or create one from `config.example.env`)

2. Configure the following variables:

```env
# Your Gmail address
EMAIL_USER=your_email@gmail.com

# Enable OAuth2
USE_OAUTH2=true

# OAuth2 credentials (copied from previous step)
GMAIL_OAUTH2_CLIENT_ID=xxxxx.apps.googleusercontent.com
GMAIL_OAUTH2_CLIENT_SECRET=GOCSPX-xxxxx
GMAIL_OAUTH2_REDIRECT_URI=http://localhost

# You DON'T need EMAIL_PASSWORD with OAuth2
# EMAIL_PASSWORD=(leave it commented out or delete it)

# Rest of configuration (keep your current values)
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_TLS=true
EMAIL_FOLDER=INBOX

BANK_EMAIL_SENDERS=your_bank@bank.com
EMAIL_SUBJECT_KEYWORDS=statement

CHECK_INTERVAL_MINUTES=5
DOWNLOAD_FOLDER=./downloads
LOG_FOLDER=./logs
LOG_LEVEL=info

# Notion configuration (if you use it)
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_notion_database_id
```

3. **Save the file**

---

### Step 6: Authorize the Application

1. Open the terminal in the project folder

2. Run the setup script:

```bash
npm run setup-oauth
```

3. The script will show you:
   - A very long **authorization URL**
   - Instructions to continue

4. **Copy the complete URL** and paste it into your browser

5. Sign in with your Gmail account (if you're not already)

6. Google will show you a warning:
   ```
   "This app isn't verified"
   ```
   - This is **normal** because it's your own application
   - Click on **"Advanced"**
   - Click on **"Go to Bank Assistant (unsafe)"**

7. Authorize the permissions:
   - "See, compose, send and permanently delete all your Gmail mail"
   - Click on **"Continue"** or **"Allow"**

8. Google will show you an **authorization code**:
   ```
   4/0AanRRrvxxxxxxxxxxxxxxxxxxxxxxx
   ```
   - **Copy this code**

9. Return to the terminal and paste the code when prompted

10. If everything goes well, you'll see:
    ```
    OAuth2 configured successfully!
    Tokens have been saved to: gmail-token.json
    ```

---

### Step 7: Test the Connection

1. Run the system:

```bash
npm start
```

2. You should see:

```
Bank Statement Automation System
Configuration validated successfully
Monitoring: your_email@gmail.com
Bank: your_bank@bank.com
Using OAuth2 authentication...
IMAP connection established successfully (OAuth2)
System started successfully
```

3. **Done!** Your system now uses OAuth2

---

## Security

### Sensitive Files

The `gmail-token.json` file contains access tokens to your Gmail account:

- **NEVER** share it
- **NEVER** upload it to Git/GitHub
- Save it securely
- It's already included in `.gitignore`

### Revoke Access

If you need to revoke access in the future:

1. Go to: https://myaccount.google.com/permissions
2. Find "Bank Assistant"
3. Click on **"Remove access"**
4. Delete the `gmail-token.json` file

---

## Automatic Renewal

OAuth2 tokens expire every hour, but the system renews them **automatically**:

- You don't need to do anything manually
- The system uses the **refresh token** to get new tokens
- Works indefinitely as long as you don't revoke access

---

## Common Problems

### Error: "Invalid grant" or "Token has been expired or revoked"

**Cause:** The tokens have expired or were revoked

**Solution:**
1. Delete the `gmail-token.json` file
2. Run again: `npm run setup-oauth`
3. Re-authorize the application

### Error: "redirect_uri_mismatch"

**Cause:** The redirect URI doesn't match the one configured in Google Cloud

**Solution:**
1. Verify that in your `.env` you have:
   ```
   GMAIL_OAUTH2_REDIRECT_URI=http://localhost
   ```
2. In Google Cloud Console → Credentials → Edit your OAuth Client
3. In "Authorized redirect URIs", make sure you have:
   - `http://localhost`

### Error: "Access blocked: This app's request is invalid"

**Cause:** Missing Gmail API enablement or consent screen configuration

**Solution:**
- Repeat **Step 2** and **Step 3** of this guide
- Make sure you've added your email as a test user

### Error: "The user has not granted your app permission"

**Cause:** You didn't authorize permissions correctly

**Solution:**
1. Go to: https://myaccount.google.com/permissions
2. Revoke access if it exists
3. Run again: `npm run setup-oauth`
4. Make sure to click "Allow" for all permissions

---

## Need Help?

If you're still having problems:

1. **Check the logs:**
   ```bash
   cat logs/combined.log
   ```

2. **Debug mode:**
   In your `.env`, change:
   ```env
   LOG_LEVEL=debug
   ```

3. **Check configuration:**
   ```bash
   npm run check
   ```

4. **Try again:**
   - Delete `gmail-token.json`
   - Run `npm run setup-oauth`

---

## Additional Resources

- [Google OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Google Cloud Console](https://console.cloud.google.com/)

---

Done! Now your application uses OAuth2 securely and without restrictions.
