import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {
  email: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    host: process.env.EMAIL_HOST || 'imap.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 993,
    tls: process.env.EMAIL_TLS === 'true',
    folder: process.env.EMAIL_FOLDER || 'INBOX',
    // OAuth2 configuration
    useOAuth2: process.env.USE_OAUTH2 === 'true',
    oauth2ClientId: process.env.GMAIL_OAUTH2_CLIENT_ID,
    oauth2ClientSecret: process.env.GMAIL_OAUTH2_CLIENT_SECRET,
    oauth2RedirectUri: process.env.GMAIL_OAUTH2_REDIRECT_URI || 'http://localhost',
  },
  bank: {
    senderEmails: process.env.BANK_EMAIL_SENDERS 
      ? process.env.BANK_EMAIL_SENDERS.split(',').map(email => email.trim())
      : [],
    subjectKeywords: (process.env.EMAIL_SUBJECT_KEYWORDS || 'estado de cuenta').split(',').map(kw => kw.trim()),
  },
  notion: {
    apiKey: process.env.NOTION_API_KEY,
    databaseId: process.env.NOTION_DATABASE_ID,
  },
  app: {
    checkIntervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES) || 5,
    downloadFolder: process.env.DOWNLOAD_FOLDER || './downloads',
    logFolder: process.env.LOG_FOLDER || './logs',
    logLevel: process.env.LOG_LEVEL || 'info',
  },
};

// Validar configuración requerida
export function validateConfig() {
  const missing = [];

  // Validar email user
  if (!config.email.user) {
    missing.push('email.user');
  }

  // Si OAuth2 está habilitado, validar credenciales OAuth2
  if (config.email.useOAuth2) {
    if (!config.email.oauth2ClientId) {
      missing.push('email.oauth2ClientId (GMAIL_OAUTH2_CLIENT_ID)');
    }
    if (!config.email.oauth2ClientSecret) {
      missing.push('email.oauth2ClientSecret (GMAIL_OAUTH2_CLIENT_SECRET)');
    }
  } else {
    // Si no usa OAuth2, validar contraseña
    if (!config.email.password) {
      missing.push('email.password');
    }
  }

  // Validar que haya al menos un sender email
  if (!config.bank.senderEmails || config.bank.senderEmails.length === 0) {
    missing.push('bank.senderEmails');
  }

  if (missing.length > 0) {
    let errorMsg = `Configuración incompleta. Faltan las siguientes variables: ${missing.join(', ')}\n`;
    
    if (config.email.useOAuth2) {
      errorMsg += '\n📖 Consulta OAUTH2_SETUP.md para configurar OAuth2\n';
      errorMsg += '   Luego ejecuta: npm run setup-oauth\n';
    } else {
      errorMsg += 'Por favor, copia config.example.env a .env y configura los valores necesarios.\n';
    }
    
    throw new Error(errorMsg);
  }

  return true;
}

