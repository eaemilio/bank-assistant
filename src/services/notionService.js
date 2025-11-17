import { Client } from '@notionhq/client';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

/**
 * Notion Service - Servicio para guardar datos en Notion
 * Gestiona la interacción con la API de Notion para almacenar información de pagos
 */
export class NotionService {
  constructor() {
    this.notion = null;
    this.databaseId = config.notion.databaseId;
    
    if (config.notion.apiKey) {
      this.notion = new Client({
        auth: config.notion.apiKey,
      });
    } else {
      logger.warn('⚠️  Notion API key no configurada - el servicio no estará disponible');
    }
  }

  /**
   * Verificar si el servicio está habilitado
   */
  isEnabled() {
    return this.notion !== null && this.databaseId !== null;
  }

  /**
   * Guardar información de pago en Notion
   * @param {Object} statementInfo - Información del estado de cuenta
   * @param {string} statementInfo.bank - Nombre del banco
   * @param {string} statementInfo.paymentDate - Fecha de pago
   * @param {number} statementInfo.paymentAmountUSD - Pago en dólares
   * @param {number} statementInfo.paymentAmountGTQ - Pago en quetzales
   * @param {string} statementInfo.card - Últimos 4 dígitos de la tarjeta
   * @returns {Promise<Object>} Respuesta de Notion
   */
  async savePayment(statementInfo) {
    if (!this.isEnabled()) {
      logger.warn('⚠️  Notion no está configurado - saltando guardado');
      return null;
    }

    try {
      logger.info('💾 Guardando información en Notion...');

      // Preparar las propiedades para Notion
      const properties = this.buildNotionProperties(statementInfo);

      // Crear página en la base de datos
      const response = await this.notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: properties,
      });

      logger.info(`✅ Información guardada en Notion exitosamente (ID: ${response.id})`);
      return response;

    } catch (error) {
      logger.error('❌ Error al guardar en Notion:', error.message);
      
      // Mostrar información adicional si está disponible
      if (error.body) {
        logger.error('Detalles del error:', JSON.stringify(error.body, null, 2));
      }
      
      throw error;
    }
  }

  /**
   * Construir el objeto de propiedades para Notion
   * @param {Object} statementInfo - Información del estado de cuenta
   * @returns {Object} Propiedades formateadas para Notion
   */
  buildNotionProperties(statementInfo) {
    const properties = {};

    // Nombre del banco como título de la página (tipo Title)
    if (statementInfo.bank) {
      properties['Name'] = {
        title: [
          {
            text: {
              content: `Pago Tarjeta ${statementInfo.bank}`,
            },
          },
        ],
      };
    }

    // Fecha de pago (tipo Date)
    if (statementInfo.paymentDate) {
      properties['Payment Date'] = {
        date: {
          start: this.formatDate(statementInfo.paymentDate),
        },
      };
    }

    // Pago Contado USD (tipo Number)
    if (statementInfo.paymentAmountUSD !== null && statementInfo.paymentAmountUSD !== undefined) {
      properties['Payment Amount USD'] = {
        number: statementInfo.paymentAmountUSD,
      };
    }

    // Pago Contado GTQ (tipo Number)
    if (statementInfo.paymentAmountGTQ !== null && statementInfo.paymentAmountGTQ !== undefined) {
      properties['Payment Amount GTQ'] = {
        number: statementInfo.paymentAmountGTQ,
      };
    }

    // Últimos 4 dígitos de tarjeta (tipo Rich Text o Title)
    // Nota: Una base de datos de Notion debe tener al menos una propiedad de tipo Title
    if (statementInfo.card) {
      properties['Card'] = {
        rich_text: [
          {
            text: {
              content: `•••• •••• •••• ${statementInfo.card}`,
            },
          },
        ],
      };
    }

    return properties;
  }

  /**
   * Formatear fecha para Notion
   * @param {string} dateString - Fecha en formato string
   * @returns {string} Fecha en formato ISO (YYYY-MM-DD)
   */
  formatDate(dateString) {
    try {
      // Si ya está en formato ISO, devolverlo
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }

      // Intentar parsear diferentes formatos de fecha
      // Formato: DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      // Formato: DD-MM-YYYY
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      // Si no coincide con ningún formato conocido, intentar parsear como Date
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }

      logger.warn(`⚠️  No se pudo formatear la fecha: ${dateString}`);
      return new Date().toISOString().split('T')[0]; // Fecha actual como fallback

    } catch (error) {
      logger.error('Error al formatear fecha:', error);
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Verificar la conexión con Notion y la base de datos
   * @returns {Promise<boolean>} True si la conexión es exitosa
   */
  async testConnection() {
    if (!this.isEnabled()) {
      logger.error('❌ Notion no está configurado');
      return false;
    }

    try {
      logger.info('🔍 Verificando conexión con Notion...');
      
      // Intentar obtener información de la base de datos
      const database = await this.notion.databases.retrieve({
        database_id: this.databaseId,
      });

      logger.info(`✅ Conexión exitosa con la base de datos: "${database.title[0]?.plain_text || 'Sin título'}"`);
      
      return true;

    } catch (error) {
      logger.error('❌ Error al conectar con Notion:', error.message);
      
      if (error.code === 'object_not_found') {
        logger.error('   La base de datos no existe o el integration no tiene acceso');
      } else if (error.code === 'unauthorized') {
        logger.error('   API key inválida o sin permisos');
      }
      
      return false;
    }
  }
}

