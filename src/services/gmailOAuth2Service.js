import { google } from 'googleapis';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Servicio para manejar autenticación OAuth2 de Gmail
 */
export class GmailOAuth2Service {
  constructor(clientId, clientSecret, redirectUri) {
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    
    this.tokenPath = path.join(process.cwd(), 'gmail-token.json');
  }

  /**
   * Genera la URL de autorización para que el usuario autorice la aplicación
   */
  getAuthUrl() {
    const scopes = [
      'https://mail.google.com/', // Acceso completo a Gmail IMAP
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Fuerza mostrar pantalla de consentimiento para obtener refresh token
    });
  }

  /**
   * Intercambia el código de autorización por tokens de acceso
   */
  async getTokenFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      // Guardar tokens en archivo
      await this.saveToken(tokens);
      
      logger.info('Tokens de OAuth2 obtenidos y guardados correctamente');
      return tokens;
    } catch (error) {
      logger.error('Error al obtener tokens de OAuth2:', error);
      throw error;
    }
  }

  /**
   * Carga los tokens guardados del archivo
   */
  async loadToken() {
    try {
      if (!fs.existsSync(this.tokenPath)) {
        return null;
      }

      const tokenData = fs.readFileSync(this.tokenPath, 'utf8');
      const tokens = JSON.parse(tokenData);
      
      this.oauth2Client.setCredentials(tokens);
      logger.info('Tokens de OAuth2 cargados desde archivo');
      
      return tokens;
    } catch (error) {
      logger.error('Error al cargar tokens:', error);
      return null;
    }
  }

  /**
   * Guarda los tokens en un archivo
   */
  async saveToken(tokens) {
    try {
      fs.writeFileSync(this.tokenPath, JSON.stringify(tokens, null, 2));
      logger.info('Tokens guardados en:', this.tokenPath);
    } catch (error) {
      logger.error('Error al guardar tokens:', error);
      throw error;
    }
  }

  /**
   * Refresca el access token usando el refresh token
   */
  async refreshAccessToken() {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      
      // Guardar los nuevos tokens
      await this.saveToken(credentials);
      
      logger.info('Access token refrescado correctamente');
      return credentials;
    } catch (error) {
      logger.error('Error al refrescar access token:', error);
      throw error;
    }
  }

  /**
   * Obtiene un access token válido (lo refresca si es necesario)
   */
  async getAccessToken() {
    try {
      // Intentar cargar token existente
      const tokens = await this.loadToken();
      
      if (!tokens) {
        throw new Error('No hay tokens guardados. Necesitas autorizar la aplicación primero.');
      }

      // Verificar si el token está por expirar (menos de 5 minutos de vida)
      const expiryDate = tokens.expiry_date;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (expiryDate && (expiryDate - now) < fiveMinutes) {
        logger.info('Access token expirando pronto, refrescando...');
        const newTokens = await this.refreshAccessToken();
        return newTokens.access_token;
      }

      return tokens.access_token;
    } catch (error) {
      logger.error('Error al obtener access token:', error);
      throw error;
    }
  }

  /**
   * Genera el string de autenticación XOAUTH2 para IMAP
   */
  async getXOAuth2String(user) {
    try {
      const accessToken = await this.getAccessToken();
      
      // Formato XOAUTH2: user={user}\x01auth=Bearer {token}\x01\x01
      const authString = `user=${user}\x01auth=Bearer ${accessToken}\x01\x01`;
      return Buffer.from(authString).toString('base64');
    } catch (error) {
      logger.error('Error al generar string XOAUTH2:', error);
      throw error;
    }
  }

  /**
   * Verifica si ya existe un token válido
   */
  hasValidToken() {
    try {
      if (!fs.existsSync(this.tokenPath)) {
        return false;
      }

      const tokenData = fs.readFileSync(this.tokenPath, 'utf8');
      const tokens = JSON.parse(tokenData);
      
      // Verificar que tenga al menos un refresh_token
      return !!tokens.refresh_token;
    } catch (error) {
      return false;
    }
  }
}

