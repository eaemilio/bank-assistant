import { PromericaParser } from './PromericaParser.js';
import { GTCParser } from './GTCParser.js';
import { BACParser } from './BACParser.js';
import { BIParser } from './BIParser.js';
import { GenericParser } from './GenericParser.js';
import { logger } from '../utils/logger.js';

/**
 * Bank Parser Factory
 * Patrón: Abstract Factory
 * 
 * Factory que crea el parser apropiado basándose en el contenido del PDF.
 * Esta es la clase principal del patrón Abstract Factory.
 * 
 * Ventajas:
 * - Desacopla el código cliente de las implementaciones concretas
 * - Facilita agregar nuevos bancos sin modificar código existente
 * - Centraliza la lógica de selección de parser
 * - Sigue el principio Open/Closed (abierto para extensión, cerrado para modificación)
 */
export class BankParserFactory {
  constructor() {
    // Registro de parsers disponibles
    this.parsers = [
      new PromericaParser(),
      new GTCParser(),
      new BACParser(),
      new BIParser(),
      // Agregar aquí nuevos parsers de bancos en el futuro:
      // new BAMParser(),
      // new BanamexParser(),
    ];
    
    // Parser genérico como fallback
    this.genericParser = new GenericParser();
  }

  /**
   * Crear el parser apropiado para el texto dado
   * @param {string} text - Texto extraído del PDF
   * @returns {BankParser} Instancia del parser apropiado
   */
  createParser(text) {
    // logger.info(text);
    logger.info('🏭 Factory: Seleccionando parser apropiado...');

    // Iterar sobre todos los parsers registrados
    for (const parser of this.parsers) {
      if (parser.canParse(text)) {
        logger.info(`🏦 Banco detectado: ${parser.getBankName()}`);
        return parser;
      }
    }

    return new BIParser();
  }

  /**
   * Obtener lista de bancos soportados
   * @returns {Array<string>} Lista de nombres de bancos soportados
   */
  getSupportedBanks() {
    return this.parsers.map(parser => parser.getBankName());
  }

  /**
   * Registrar un nuevo parser (permite agregar bancos dinámicamente)
   * @param {BankParser} parser - Instancia del nuevo parser
   */
  registerParser(parser) {
    if (!(parser instanceof BankParser)) {
      throw new Error('El parser debe extender la clase BankParser');
    }
    
    this.parsers.push(parser);
    logger.info(`✅ Parser registrado: ${parser.getBankName()}`);
  }
}

