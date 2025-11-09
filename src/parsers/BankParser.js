import { logger } from '../utils/logger.js';

/**
 * Abstract Bank Parser - Interfaz base para todos los parsers de banco
 * Patrón: Abstract Factory
 * 
 * Define la interfaz común que todos los parsers de banco deben implementar.
 */
export class BankParser {
  /**
   * Nombre del banco
   * @returns {string}
   */
  getBankName() {
    throw new Error('Method getBankName() must be implemented');
  }

  /**
   * Detectar si este parser puede procesar el texto dado
   * @param {string} text - Texto del PDF
   * @returns {boolean} True si este parser puede procesar el texto
   */
  canParse(text) {
    throw new Error('Method canParse() must be implemented');
  }

  /**
   * Extraer número de tarjeta (últimos 4 dígitos)
   * @param {string} text - Texto del PDF
   * @returns {string|null} Últimos 4 dígitos de la tarjeta
   */
  extractCardNumber(text) {
    const patterns = [
      /XXXX\s+XXXX\s+XXXX\s+(\d{4})/i,
      /\*+\s*(\d{4})/i,
      /tarjeta[:\s]+[X*\s]+(\d{4})/i,
      /terminaci[oó]n[:\s]+(\d{4})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        logger.info(`✓ Tarjeta encontrada: ****${match[1]}`);
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extraer fecha de pago (debe ser implementado por cada banco)
   * @param {string} text - Texto del PDF
   * @returns {string|null} Fecha de pago
   */
  extractPaymentDate(text) {
    throw new Error('Method extractPaymentDate() must be implemented');
  }

  /**
   * Extraer montos de pago de contado (debe ser implementado por cada banco)
   * @param {string} text - Texto del PDF
   * @returns {Object} { paymentAmountGTQ, paymentAmountUSD }
   */
  extractPaymentAmounts(text) {
    throw new Error('Method extractPaymentAmounts() must be implemented');
  }

  /**
   * Procesar el texto completo y retornar toda la información
   * @param {string} text - Texto del PDF
   * @returns {Object} Información extraída del estado de cuenta
   */
  parse(text) {
    logger.info(`📋 Procesando con ${this.getBankName()}...`);

    const result = {
      found: false,
      bank: this.getBankName(),
      card: this.extractCardNumber(text),
      paymentDate: this.extractPaymentDate(text),
      paymentAmountGTQ: null,
      paymentAmountUSD: null,
    };

    // Extraer montos (implementación específica por banco)
    const amounts = this.extractPaymentAmounts(text);
    result.paymentAmountGTQ = amounts.paymentAmountGTQ;
    result.paymentAmountUSD = amounts.paymentAmountUSD;

    if (amounts.paymentAmountGTQ || amounts.paymentAmountUSD) {
      result.found = true;
    }

    return result;
  }
}

