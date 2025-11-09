import { BankParser } from './BankParser.js';
import { logger } from '../utils/logger.js';

/**
 * Concrete Parser - Banco Industrial (Guatemala)
 * Patrón: Abstract Factory - Producto Concreto
 * 
 * Implementación específica para procesar estados de cuenta del Banco Industrial.
 * 
 * Estrategia:
 * - Busca "Saldo al corte (Pago de contado)" para encontrar el monto
 * - Busca "Fecha de Pago" y lee las siguientes líneas para construir la fecha (año, mes, día)
 * - Formato de tarjeta: XXXX XXXX XXXX 0475PLATINUM (sin incluir PLATINUM)
 */
export class BIParser extends BankParser {
  getBankName() {
    return 'BANCO INDUSTRIAL';
  }

  canParse(text) {
    const textLower = text.toLowerCase();
    return textLower.includes('banco industrial') || 
           textLower.includes('bi banco') || textLower.includes('contecnica, s.a.');
  }

  /**
   * Extraer número de tarjeta para Banco Industrial
   * Formato: XXXX XXXX XXXX 0475 (puede tener cualquier texto después)
   * @param {string} text - Texto del PDF
   * @returns {string|null} Últimos 4 dígitos de la tarjeta
   */
  extractCardNumber(text) {
    // Patrón para: XXXX XXXX XXXX 0475 (seguido de cualquier texto o nada)
    const biPattern = /XXXX\s+XXXX\s+XXXX\s+(\d{4})/i;
    const match = text.match(biPattern);
    
    if (match && match[1]) {
      logger.info(`✓ Tarjeta encontrada: ****${match[1]}`);
      return match[1];
    }

    // Intentar con el patrón genérico
    return super.extractCardNumber(text);
  }

  /**
   * Extraer fecha de pago para Banco Industrial
   * Busca "Fecha de Pago", luego 4 líneas después está el año, 
   * una línea después el mes, una línea después el día
   * @param {string} text - Texto del PDF
   * @returns {string|null} Fecha de pago en formato DD/MM/YYYY
   */
  extractPaymentDate(text) {
    const index = text.indexOf('Fecha de pago:');

    if (index === -1) {
      logger.warn('⚠️  No se pudo encontrar "Fecha de Pago"');
      return null;
    }
    
    // Obtener el contexto después de "Fecha de Pago"
    const context = text.substring(index, index + 300);
    const lines = context.split('\n').filter(line => line.trim());
    
    // Según las especificaciones:
    // Línea 0: "Fecha de Pago"
    // Línea 4: Año
    // Línea 5: Mes
    // Línea 6: Día
    
    if (lines.length >= 7) {
      const year = lines[4]?.trim();
      const month = lines[5]?.trim();
      const day = lines[6]?.trim();
      
      if (year && month && day) {
        // Asegurarse de que mes y día tengan 2 dígitos
        const monthPadded = month.padStart(2, '0');
        const dayPadded = day.padStart(2, '0');
        const dateStr = `${dayPadded}/${monthPadded}/${year}`;
        
        logger.info(`✓ Fecha de pago encontrada: ${dateStr}`);
        return dateStr;
      } else {
        logger.warn(`⚠️  Fecha incompleta - Año: ${year}, Mes: ${month}, Día: ${day}`);
      }
    } else {
      logger.warn(`⚠️  No hay suficientes líneas después de "Fecha de Pago" (encontradas: ${lines.length})`);
      logger.debug('Líneas encontradas:', lines.slice(0, 10));
    }
    
    return null;
  }

  /**
   * Extraer montos de pago para Banco Industrial
   * Formatos posibles:
   * - Un solo monto: Saldo al corte (Pago de contado):20,530.37.00 (omitir .00)
   * - Dos montos juntos: Saldo al corte (Pago de contado):962.47198.15
   *   (primer monto GTQ, segundo monto USD)
   * @param {string} text - Texto del PDF
   * @returns {Object} { paymentAmountGTQ, paymentAmountUSD }
   */
  extractPaymentAmounts(text) {
    const result = {
      paymentAmountGTQ: null,
      paymentAmountUSD: null,
    };

    // Buscar el patrón "Saldo al corte (Pago de contado)"
    // Capturar todo el string de montos (puede incluir múltiples segmentos con puntos)
    const pattern = /Saldo al corte\s*\(Pago de contado\)\s*:?\s*([\d,.]+)/i;
    const match = text.match(pattern);
    
    if (match && match[1]) {
      let amountStr = match[1].trim();
      
      // Intentar extraer dos montos (GTQ y USD)
      // Formatos posibles:
      // - 962.47198.15 (GTQ: 962.47, USD: 198.15) - mínimo 2 dígitos entre puntos
      // - 9,890.00.00 (GTQ: 9,890.00, USD: 0.00) - puede empezar con punto directamente
      const doubleAmountPattern = /([\d,]+\.\d{2})(\d{2}\d*\.\d{2}|\.\d{2})/;
      const doubleMatch = amountStr.match(doubleAmountPattern);
      
      if (doubleMatch) {
        // Caso: dos montos juntos (GTQ y USD)
        const gtqStr = doubleMatch[1];
        let usdStr = doubleMatch[2];
        
        // Si USD empieza con punto (ej: .00), agregar 0 al inicio
        if (usdStr.startsWith('.')) {
          usdStr = '0' + usdStr;
        }
        
        const gtqAmount = parseFloat(gtqStr.replace(/,/g, ''));
        const usdAmount = parseFloat(usdStr.replace(/,/g, ''));
        
        if (!isNaN(gtqAmount)) {
          result.paymentAmountGTQ = gtqAmount;
          logger.info(`✓ Pago al Contado GTQ: Q${gtqAmount.toFixed(2)}`);
        }
        
        if (!isNaN(usdAmount)) {
          result.paymentAmountUSD = usdAmount;
          logger.info(`✓ Pago al Contado USD: $${usdAmount.toFixed(2)}`);
        }
      } else {
        // Caso: un solo monto, puede terminar en .00
        if (amountStr.endsWith('.00')) {
          amountStr = amountStr.slice(0, -3);
        }
        
        const amount = parseFloat(amountStr.replace(/,/g, ''));
        
        if (!isNaN(amount)) {
          // Asumir que es GTQ por defecto
          result.paymentAmountGTQ = amount;
        } else {
          logger.warn(`⚠️  No se pudo convertir el monto: "${amountStr}"`);
        }
      }
    }

    return result;
  }
}

