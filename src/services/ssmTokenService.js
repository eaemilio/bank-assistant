import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm';
import { logger } from '../utils/logger.js';

/**
 * Servicio para gestionar tokens OAuth2 en AWS Systems Manager Parameter Store
 * Reemplaza el sistema de archivos local para almacenamiento de tokens
 */
export class SSMTokenService {
  constructor(parameterName = '/bank-assistant/gmail-token') {
    this.parameterName = parameterName;
    this.ssmClient = new SSMClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.cachedToken = null;
    this.cacheExpiry = 0;
  }

  /**
   * Guardar token en SSM Parameter Store
   * @param {Object} token - Token OAuth2 a guardar
   */
  async saveToken(token) {
    try {
      const command = new PutParameterCommand({
        Name: this.parameterName,
        Value: JSON.stringify(token),
        Type: 'SecureString',
        Overwrite: true,
        Description: 'Gmail OAuth2 token for bank assistant',
      });

      await this.ssmClient.send(command);
      logger.info(`Token guardado en SSM Parameter Store: ${this.parameterName}`);
      
      // Actualizar caché
      this.cachedToken = token;
      this.cacheExpiry = Date.now() + (5 * 60 * 1000); // Cache por 5 minutos
      
      return true;
    } catch (error) {
      logger.error('Error al guardar token en SSM:', error);
      throw new Error(`No se pudo guardar el token en SSM: ${error.message}`);
    }
  }

  /**
   * Cargar token desde SSM Parameter Store
   * @returns {Object|null} Token OAuth2 o null si no existe
   */
  async loadToken() {
    try {
      // Retornar del caché si está disponible y no ha expirado
      if (this.cachedToken && Date.now() < this.cacheExpiry) {
        logger.debug('Token cargado desde caché');
        return this.cachedToken;
      }

      const command = new GetParameterCommand({
        Name: this.parameterName,
        WithDecryption: true,
      });

      const response = await this.ssmClient.send(command);
      
      if (!response.Parameter || !response.Parameter.Value) {
        logger.warn('No se encontró token en SSM Parameter Store');
        return null;
      }

      const token = JSON.parse(response.Parameter.Value);
      logger.info('Token cargado desde SSM Parameter Store');
      
      // Actualizar caché
      this.cachedToken = token;
      this.cacheExpiry = Date.now() + (5 * 60 * 1000); // Cache por 5 minutos
      
      return token;
    } catch (error) {
      if (error.name === 'ParameterNotFound') {
        logger.warn(`Parámetro ${this.parameterName} no encontrado en SSM`);
        return null;
      }
      
      logger.error('Error al cargar token desde SSM:', error);
      throw new Error(`No se pudo cargar el token desde SSM: ${error.message}`);
    }
  }

  /**
   * Verificar si existe un token válido
   * @returns {boolean} True si existe un token con refresh_token
   */
  async hasValidToken() {
    try {
      const token = await this.loadToken();
      return !!(token && token.refresh_token);
    } catch (error) {
      logger.error('Error al verificar token:', error);
      return false;
    }
  }

  /**
   * Eliminar caché del token
   * Útil cuando se actualiza el token externamente
   */
  clearCache() {
    this.cachedToken = null;
    this.cacheExpiry = 0;
    logger.debug('Caché de token limpiado');
  }

  /**
   * Obtener información del token sin el contenido sensible
   * @returns {Object} Información del token (sin access_token ni refresh_token)
   */
  async getTokenInfo() {
    try {
      const token = await this.loadToken();
      
      if (!token) {
        return {
          exists: false,
          message: 'No hay token almacenado',
        };
      }

      return {
        exists: true,
        hasRefreshToken: !!token.refresh_token,
        hasAccessToken: !!token.access_token,
        expiryDate: token.expiry_date ? new Date(token.expiry_date).toISOString() : null,
        tokenType: token.token_type || 'unknown',
        scope: token.scope || 'unknown',
      };
    } catch (error) {
      logger.error('Error al obtener información del token:', error);
      return {
        exists: false,
        error: error.message,
      };
    }
  }
}

