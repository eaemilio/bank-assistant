import { logger } from '../utils/logger.js';
import { BankParserFactory } from '../parsers/BankParserFactory.js';

/**
 * Parser Service - Servicio principal de parseo
 * Patrón: Abstract Factory (Cliente)
 * 
 * Este servicio actúa como cliente del patrón Abstract Factory.
 * Usa la factory para obtener el parser apropiado y delega el trabajo.
 */
export class ParserService {
  constructor() {
    // Inicializar la factory de parsers
    this.factory = new BankParserFactory();
    logger.info('✅ Parser Service inicializado con Abstract Factory');
  }

  /**
   * Parsear el texto del estado de cuenta
   * Usa el patrón Abstract Factory para seleccionar y usar el parser apropiado
   * 
   * @param {string} text - Texto extraído del PDF
   * @returns {Object} Información del pago de contado encontrado
   */
  findPaymentAmount(text) {
    if (!text) {
      return {
        found: false,
        message: 'No hay texto para analizar',
      };
    }

    logger.info('');
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('📊 Analizando estado de cuenta...');
    logger.info('═══════════════════════════════════════════════════════');

    // Usar la factory para obtener el parser apropiado
    const parser = this.factory.createParser(text);

    if (!parser) {
      logger.warn('No se encontró un parser apropiado para el texto');
      return {
        found: false,
        message: 'No se encontró un parser apropiado para el texto',
      };
    }

    // Delegar el parseo al parser específico
    const result = parser.parse(text);

    // Mostrar resumen de resultados
    this.displayResults(result, text);

    return result;
  }

  /**
   * Mostrar resumen de los resultados del parseo
   * @param {Object} result - Resultado del parseo
   * @param {string} text - Texto original (para debugging)
   */
  displayResults(result, text) {
    if (result.found || result.card || result.paymentDate) {
      logger.info('');
      logger.info('=== ✅ INFORMACIÓN ENCONTRADA ===');
      if (result.card) {
        logger.info(`💳 Tarjeta: ****${result.card}`);
      }
      if (result.paymentDate) {
        logger.info(`📅 Fecha de pago: ${result.paymentDate}`);
      }
      if (result.paymentAmountGTQ) {
        logger.info(`💰 Pago al Contado GTQ: Q${result.paymentAmountGTQ.toFixed(2)}`);
      }
      if (result.paymentAmountUSD) {
        logger.info(`💵 Pago al Contado USD: $${result.paymentAmountUSD.toFixed(2)}`);
      }
      logger.info('================================');
    } else {
      logger.warn('');
      logger.warn('=== ⚠️  INFORMACIÓN INCOMPLETA ===');
      logger.warn('No se encontró información completa del estado de cuenta');
      logger.debug('Primeros 500 caracteres del texto:', text.substring(0, 500));
      logger.warn('==================================');
    }
    logger.info('');
  }

  /**
   * Obtener lista de bancos soportados
   * @returns {Array<string>} Lista de bancos soportados
   */
  getSupportedBanks() {
    return this.factory.getSupportedBanks();
  }

  /**
   * Extraer toda la información relevante del estado de cuenta
   * @param {string} text - Texto extraído del PDF
   * @returns {Object} Información completa del estado de cuenta
   */
  parseStatement(text) {
    const paymentInfo = this.findPaymentAmount(text);

    if (!paymentInfo.found) {
      return {
        found: false,
      };
    }

    return {
      ...paymentInfo,
      processedAt: new Date().toISOString(),
    };
  }
}

