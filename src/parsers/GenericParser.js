import { BankParser } from './BankParser.js';
import { logger } from '../utils/logger.js';

/**
 * Concrete Parser - Genérico
 * Patrón: Abstract Factory - Producto Concreto
 * 
 * Parser genérico que funciona como fallback para bancos sin implementación específica.
 * Usa patrones comunes de búsqueda que funcionan con la mayoría de bancos.
 */
export class GenericParser extends BankParser {
  getBankName() {
    return 'GENERICO';
  }

  canParse(text) {
    // El parser genérico siempre puede intentar parsear
    return true;
  }

  extractPaymentAmounts(text) {
    const result = {
      paymentAmountGTQ: null,
      paymentAmountUSD: null,
    };

    // Estrategia genérica: buscar "Pago al Contado" o "Pago de Contado"
    const pagoContadoIndex = text.toLowerCase().indexOf('pago al contado');
    const pagoDeContadoIndex = text.toLowerCase().indexOf('pago de contado');
    const searchIndex = pagoContadoIndex !== -1 ? pagoContadoIndex : pagoDeContadoIndex;
    
    if (searchIndex !== -1) {
      logger.info('✓ Encontrado "Pago al/de Contado"');
      
      const context = text.substring(searchIndex, searchIndex + 500);
      const numbers = context.match(/[\d,]+\.\d{2}/g);
      
      if (numbers && numbers.length >= 2) {
        result.paymentAmountGTQ = parseFloat(numbers[0].replace(/,/g, ''));
        result.paymentAmountUSD = parseFloat(numbers[1].replace(/,/g, ''));
        logger.info(`✓ Pago al Contado GTQ: Q${result.paymentAmountGTQ.toFixed(2)}`);
        logger.info(`✓ Pago al Contado USD: $${result.paymentAmountUSD.toFixed(2)}`);
      } else if (numbers && numbers.length === 1) {
        result.paymentAmountGTQ = parseFloat(numbers[0].replace(/,/g, ''));
        logger.info(`✓ Pago al Contado GTQ: Q${result.paymentAmountGTQ.toFixed(2)}`);
      }
    } else {
      logger.warn('⚠️  No se encontró "Pago al Contado" en el texto');
    }

    return result;
  }
}

