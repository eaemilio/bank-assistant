import { BankParser } from './BankParser.js';
import { logger } from '../utils/logger.js';
import { formatSpanishDateToISO } from '../utils/helpers.js';

/**
 * Concrete Parser - Banco G&T Continental (Guatemala)
 * Patrón: Abstract Factory - Producto Concreto
 * 
 * Implementación específica para procesar estados de cuenta de Banco G&T Continental.
 * 
 * Estrategia:
 * - Busca "PAGO CONTADO" en el texto
 * - Línea 4: Pago en quetzales (GTQ)
 * - Línea 7: Pago en dólares (USD)
 * - Línea 9: Fecha de pago
 */
export class GTCParser extends BankParser {
  getBankName() {
    return 'G&T CONTINENTAL';
  }

  canParse(text) {
    const textLower = text.toLowerCase();
    return textLower.includes('g&t continental') || 
           textLower.includes('g & t continental') ||
           textLower.includes('gyt continental');
  }

  /**
   * Extraer número de tarjeta para G&T Continental
   * Formato: 5522-62XX-XXXX-9409
   * @param {string} text - Texto del PDF
   * @returns {string|null} Últimos 4 dígitos de la tarjeta
   */
  extractCardNumber(text) {
    // Patrón específico para G&T Continental: 5522-62XX-XXXX-9409
    const gtPattern = /\d{4}-\d{2}XX-XXXX-(\d{4})/i;
    const match = text.match(gtPattern);
    
    if (match && match[1]) {
      logger.info(`✓ Tarjeta encontrada: ****${match[1]}`);
      return match[1];
    }

    // Si no encuentra el patrón específico, usar el método de la clase base
    return super.extractCardNumber(text);
  }

  extractPaymentDate(text) {
    // Buscar "PAGO CONTADO"
    const pagoContadoIndex = text.toUpperCase().indexOf('PAGO CONTADO');
    
    if (pagoContadoIndex !== -1) {
      logger.info('✓ Encontrado "PAGO CONTADO"');
      
      // Extraer contexto después de "PAGO CONTADO" (siguientes 500 caracteres)
      const context = text.substring(pagoContadoIndex, pagoContadoIndex + 500);
      
      // Dividir en líneas
      const lines = context.split('\n').filter(line => line.trim());
      
      // La fecha está en la línea 9
      if (lines[9]) {
        const dateLine = lines[9].trim();
        logger.info(`✓ Fecha extraída del PDF: ${dateLine}`);
        
        // Convertir fecha con mes en español a formato ISO (YYYY-MM-DD)
        const isoDate = formatSpanishDateToISO(dateLine);
        
        if (isoDate) {
          logger.info(`✓ Fecha parseada correctamente: ${isoDate}`);
          return isoDate;
        } else {
          logger.warn(`⚠️  No se pudo parsear la fecha: ${dateLine}`);
          return dateLine; // Retornar la fecha original si no se puede parsear
        }
      }
    }
    
    logger.warn('⚠️  No se pudo encontrar la fecha de pago');
    return null;
  }

  extractPaymentAmounts(text) {
    const result = {
      paymentAmountGTQ: null,
      paymentAmountUSD: null,
    };

    // Estrategia específica para G&T Continental: buscar "PAGO CONTADO"
    const pagoContadoIndex = text.toUpperCase().indexOf('PAGO CONTADO');
    
    if (pagoContadoIndex !== -1) {
      logger.info('✓ Encontrado "PAGO CONTADO"');
      
      // Extraer contexto después de "PAGO CONTADO" (siguientes 500 caracteres)
      const context = text.substring(pagoContadoIndex, pagoContadoIndex + 500);
      
      // Dividir en líneas
      const lines = context.split('\n').filter(line => line.trim());
      
      // El monto en GTQ está en la línea 4
      if (lines[4]) {
        const gtqLine = lines[4].trim();
        const gtqAmount = parseFloat(gtqLine.replace(/,/g, ''));
        if (!isNaN(gtqAmount)) {
          result.paymentAmountGTQ = gtqAmount;
          logger.info(`✓ Pago al Contado GTQ: Q${gtqAmount.toFixed(2)} (línea: "${gtqLine}")`);
        }
      }
      
      // El monto en USD está en la línea 7
      if (lines[7]) {
        const usdLine = lines[7].trim();
        const usdAmount = parseFloat(usdLine.replace(/,/g, ''));
        if (!isNaN(usdAmount)) {
          result.paymentAmountUSD = usdAmount;
          logger.info(`✓ Pago al Contado USD: $${usdAmount.toFixed(2)} (línea: "${usdLine}")`);
        }
      }
      
      if (!result.paymentAmountGTQ && !result.paymentAmountUSD) {
        logger.warn('⚠️  No se encontraron montos después de "PAGO CONTADO"');
        logger.debug('Líneas encontradas:', lines.slice(0, 10).join(' | '));
      }
    } else {
      logger.warn('⚠️  No se encontró "PAGO CONTADO" en el texto');
    }

    return result;
  }
}

