import pdf from 'pdf-parse';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export class PDFService {
  constructor() {
    // Crear carpeta de descargas si no existe
    if (!existsSync(config.app.downloadFolder)) {
      mkdirSync(config.app.downloadFolder, { recursive: true });
    }
  }

  /**
   * Extraer PDFs de los adjuntos de un correo
   * @param {Array} attachments - Adjuntos del correo
   * @returns {Array} Lista de PDFs guardados con su ruta
   */
  async extractPDFs(attachments) {
    if (!attachments || attachments.length === 0) {
      logger.info('No hay adjuntos en el correo');
      return [];
    }

    const pdfFiles = [];

    for (const attachment of attachments) {
      if (attachment.contentType === 'application/pdf' || 
          attachment.filename?.toLowerCase().endsWith('.pdf')) {
        
        try {
          const timestamp = Date.now();
          const filename = `${timestamp}_${attachment.filename || 'estado_cuenta.pdf'}`;
          const filepath = join(config.app.downloadFolder, filename);

          pdfFiles.push({
            filename,
            filepath,
            content: attachment.content,
          });
        } catch (error) {
          logger.error(`Error al guardar PDF ${attachment.filename}:`, error);
        }
      }
    }

    return pdfFiles;
  }

  /**
   * Extraer texto de un PDF
   * @param {Buffer} pdfBuffer - Buffer con el contenido del PDF
   * @returns {Promise<string>} Texto extraído del PDF
   */
  async extractText(pdfBuffer) {
    try {
      logger.info('Extrayendo texto del PDF...');
      const data = await pdf(pdfBuffer);
      logger.info(`Texto extraído: ${data.numpages} página(s), ${data.text.length} caracteres`);
      return data.text;
    } catch (error) {
      logger.error('Error al extraer texto del PDF:', error);
      throw error;
    }
  }

  /**
   * Procesar un PDF y extraer su texto
   * @param {Object} pdfFile - Objeto con información del PDF
   * @returns {Promise<Object>} Información del PDF con texto extraído
   */
  async processPDF(pdfFile) {
    try {
      const text = await this.extractText(pdfFile.content);
      return {
        ...pdfFile,
        text,
      };
    } catch (error) {
      logger.error(`Error al procesar PDF ${pdfFile.filename}:`, error);
      return {
        ...pdfFile,
        text: null,
        error: error.message,
      };
    }
  }

  /**
   * Procesar todos los PDFs
   * @param {Array} pdfFiles - Lista de PDFs a procesar
   * @returns {Promise<Array>} Lista de PDFs procesados con texto extraído
   */
  async processAllPDFs(pdfFiles) {
    const processed = [];

    for (const pdfFile of pdfFiles) {
      const result = await this.processPDF(pdfFile);
      processed.push(result);
    }

    return processed;
  }
}

