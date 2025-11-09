import { BankParser } from './BankParser.js';
import { logger } from '../utils/logger.js';

/**
 * Concrete Parser - BAC Credomatic (Guatemala)
 * Patrón: Abstract Factory - Producto Concreto
 * 
 * Implementación específica para procesar estados de cuenta de BAC Credomatic.
 * 
 * Estrategia:
 * - Busca "ACUMULADOS DEL MES" en el texto
 * - Línea 2: Fecha de pago
 * - Línea 3: Pago en quetzales (formato: Q.170.99Q.170.00Q.172.73 - tomar el primer valor)
 * - Línea 4: Pago en dólares (formato: US$.166.13US$.166.00US$.168.44 - tomar el primer valor)
 */
export class BACParser extends BankParser {
  getBankName() {
    return 'BAC CREDOMATIC';
  }

  canParse(text) {
    const textLower = text.toLowerCase();
    return textLower.includes('bac credomatic') || 
           textLower.includes('bac') && textLower.includes('credomatic');
  }

  /**
   * Extraer número de tarjeta para BAC Credomatic
   * Formato: ****-****-****-5627
   * @param {string} text - Texto del PDF
   * @returns {string|null} Últimos 4 dígitos de la tarjeta
   */
  extractCardNumber(text) {
    const bacPattern = /\*{4}-\*{4}-\*{4}-(\d{4})/i;
    const match = text.match(bacPattern);
    
    if (match && match[1]) {
      logger.info(`✓ Tarjeta encontrada: ****${match[1]}`);
      return match[1];
    }

    return super.extractCardNumber(text);
  }

  extractPaymentDate(text) {
    let index = text.toUpperCase().indexOf('ACUMULADOS DEL MES');

    if (index === -1) {
        index = text.toUpperCase().indexOf('MILLAS PLUS');
    }

    if (index === -1) {
        index = text.toUpperCase().indexOf('PUNTOS CANJEABLES');
    }

    if (index === -1) {
        index = text.toUpperCase().indexOf('PUNTOS BAC CREDOMATIC');
    }

    if (index === -1) {
        logger.warn('⚠️  No se pudo encontrar la fecha de pago');
        return null;
    }
    
    const context = text.substring(index, index + 500);
    const lines = context.split('\n').filter(line => line.trim());
    
    if (lines[2]) {
    const dateLine = lines[2].trim();
    logger.info(`✓ Fecha de pago encontrada: ${dateLine}`);
    return dateLine;
    }
  }

  extractPaymentAmounts(text) {
    const result = {
      paymentAmountGTQ: null,
      paymentAmountUSD: null,
    };

    let index = text.toUpperCase().indexOf('ACUMULADOS DEL MES');

    if (index === -1) {
        index = text.toUpperCase().indexOf('MILLAS PLUS');
    }

    if (index === -1) {
        index = text.toUpperCase().indexOf('PUNTOS CANJEABLES');
    }

    if (index === -1) {
        index = text.toUpperCase().indexOf('PUNTOS BAC CREDOMATIC');
    }
    
    if (index !== -1) {      
      const context = text.substring(index, index + 500);
      const lines = context.split('\n').filter(line => line.trim());
      
      // El monto en GTQ está en la línea 3
      // Formato: Q.170.99Q.170.00Q.172.73 (tomar el primer valor)
      if (lines[3]) {
        const gtqLine = lines[3].trim();
        // Extraer el primer monto después de "Q."
        const gtqPattern = /Q\.([\d,]+\.\d+)/;
        const gtqMatch = gtqLine.match(gtqPattern);
        
        if (gtqMatch) {
          const gtqAmount = parseFloat(gtqMatch[1].replace(/,/g, ''));
          if (!isNaN(gtqAmount)) {
            result.paymentAmountGTQ = gtqAmount;
            logger.info(`✓ Pago al Contado GTQ: Q${gtqAmount.toFixed(2)} (línea: "${gtqLine}")`);
          }
        }
      }
      
      // El monto en USD está en la línea 4
      // Formato: US$.166.13US$.166.00US$.168.44 (tomar el primer valor)
      if (lines[4]) {
        const usdLine = lines[4].trim();
        // Extraer el primer monto después de "US$."
        const usdPattern = /US\$\.([\d,]+\.\d+)/;
        const usdMatch = usdLine.match(usdPattern);
        
        if (usdMatch) {
          const usdAmount = parseFloat(usdMatch[1].replace(/,/g, ''));
          if (!isNaN(usdAmount)) {
            result.paymentAmountUSD = usdAmount;
            logger.info(`✓ Pago al Contado USD: $${usdAmount.toFixed(2)} (línea: "${usdLine}")`);
          }
        }
      }
      
      if (!result.paymentAmountGTQ && !result.paymentAmountUSD) {
        logger.warn('⚠️  No se encontraron montos después de "ACUMULADOS DEL MES"');
        logger.debug('Líneas encontradas:', lines.slice(0, 10).join(' | '));
      }
    } else {
      logger.warn('⚠️  No se encontró "ACUMULADOS DEL MES" en el texto');
    }

    return result;
  }
}

