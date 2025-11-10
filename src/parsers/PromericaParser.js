import { BankParser } from './BankParser.js';
import { logger } from '../utils/logger.js';
import { formatSpanishDateToISO } from '../utils/helpers.js';

/**
 * Concrete Parser - Banco Promerica (Guatemala)
 * Patrón: Abstract Factory - Producto Concreto
 * 
 * Implementación específica para procesar estados de cuenta de Banco Promerica.
 * 
 * Estrategia:
 * - Busca "Pagos de Capital" en el texto
 * - Extrae dos números en la misma línea después de ese texto
 * - Formato: "6,282.30 2,806.66"
 * - Primer número = GTQ, Segundo número = USD
 */
export class PromericaParser extends BankParser {
  getBankName() {
    return 'PROMERICA';
  }

  canParse(text) {
    const textLower = text.toLowerCase();
    return textLower.includes('promerica') || textLower.includes('banco promerica');
  }

  extractPaymentDate(text) {
    // En Promerica, la fecha de pago está una línea debajo del número de tarjeta
    const cardPattern = /XXXX\s+XXXX\s+XXXX\s+(\d{4})/i;
    const cardMatch = text.match(cardPattern);
    
    if (cardMatch) {
      // Encontrar la posición del número de tarjeta
      const cardIndex = text.indexOf(cardMatch[0]);
      
      // Extraer el contexto después del número de tarjeta (siguientes 200 caracteres)
      const context = text.substring(cardIndex, cardIndex + 200);
      
      // Dividir en líneas
      const lines = context.split('\n').filter(line => line.trim());
      
      // La fecha debería estar en la siguiente línea (índice 1)
      if (lines.length > 1) {
        const nextLine = lines[1];
        
        // Buscar fecha en formato DD/MM/YYYY, DD-MM-YYYY o con meses en español
        const datePattern = /(\d{1,2}[\/\-\s][A-Z]{3,10}[\/\-\s]\d{2,4})|(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i;
        const dateMatch = nextLine.match(datePattern);
        
        if (dateMatch) {
          const dateStr = dateMatch[1] || dateMatch[2];
          logger.info(`✓ Fecha extraída del PDF: ${dateStr}`);
          
          // Convertir fecha con mes en español a formato ISO (YYYY-MM-DD)
          const isoDate = formatSpanishDateToISO(dateStr);
          
          if (isoDate) {
            logger.info(`✓ Fecha parseada correctamente: ${isoDate}`);
            return isoDate;
          } else {
            logger.warn(`⚠️  No se pudo parsear la fecha: ${dateStr}`);
            return dateStr; // Retornar la fecha original si no se puede parsear
          }
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

    // Estrategia específica para Promerica: buscar "Pagos de Capital"
    const pagosCapitalIndex = text.toLowerCase().indexOf('pagos de capital');
    
    if (pagosCapitalIndex !== -1) {
      logger.info('✓ Encontrado "Pagos de Capital"');
      
      // Extraer contexto después de "Pagos de Capital" (siguientes 300 caracteres)
      const context = text.substring(pagosCapitalIndex, pagosCapitalIndex + 300);
      
      // Dividir en líneas para buscar la línea específica con ambos números
      const lines = context.split('\n');
      
      // Buscar la línea que contenga exactamente dos números en la misma línea
      // Formato esperado: "6,282.30 2,806.66"
      // El patrón busca: número + espacios + número (ambos en la misma línea)
      const doubleNumberPattern = /^\s*([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*$/;
      
      for (const line of lines) {
        const match = line.match(doubleNumberPattern);
        if (match) {
          result.paymentAmountGTQ = parseFloat(match[1].replace(/,/g, ''));
          result.paymentAmountUSD = parseFloat(match[2].replace(/,/g, ''));
          logger.info(`✓ Línea encontrada: "${line.trim()}"`);
          logger.info(`✓ Pago al Contado GTQ: Q${result.paymentAmountGTQ.toFixed(2)}`);
          logger.info(`✓ Pago al Contado USD: $${result.paymentAmountUSD.toFixed(2)}`);
          break; // Salir del loop una vez encontrado
        }
      }
      
      if (!result.paymentAmountGTQ && !result.paymentAmountUSD) {
        logger.warn('⚠️  No se encontró una línea con dos números después de "Pagos de Capital"');
        logger.debug('Líneas encontradas:', lines.slice(0, 10).join(' | '));
      }
    } else {
      logger.warn('⚠️  No se encontró "Pagos de Capital" en el texto');
    }

    return result;
  }
}

