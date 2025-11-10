import cron from 'node-cron';
import { config, validateConfig } from './config/config.js';
import { logger } from './utils/logger.js';
import { EmailService } from './services/emailService.js';
import { PDFService } from './services/pdfService.js';
import { ParserService } from './services/parserService.js';
import { NotionService } from './services/notionService.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

class BankStatementAutomation {
  constructor() {
    this.emailService = new EmailService();
    this.pdfService = new PDFService();
    this.parserService = new ParserService();
    this.notionService = new NotionService();
    this.isProcessing = false;
  }

  /**
   * Iniciar la aplicación
   */
  async start() {
    try {
      // Validar configuración
      validateConfig();
      logger.info('✅ Configuración validada correctamente');

      // Mostrar configuración
      logger.info(`📧 Monitoreando: ${config.email.user}`);
      logger.info(`🏦 Remitentes del banco (${config.bank.senderEmails.length}):`);
      config.bank.senderEmails.forEach((email, index) => {
        logger.info(`   ${index + 1}. ${email}`);
      });
      logger.info(`⏱️  Intervalo: cada ${config.app.checkIntervalMinutes} minuto(s)`);
      logger.info('='.repeat(60));

      await this.emailService.connect();
      await this.processEmails();

      const cronExpression = `*/${config.app.checkIntervalMinutes} * * * *`;
      logger.info(`⏰ Programando revisiones: ${cronExpression}`);

      cron.schedule(cronExpression, async () => {
        if (!this.isProcessing) {
          await this.processEmails();
        } else {
          logger.warn('⚠️  Proceso anterior aún en ejecución, saltando esta revisión');
        }
      });

      logger.info('✅ Sistema iniciado correctamente');
      logger.info('🔄 Esperando nuevos estados de cuenta...');
      logger.info('Presiona Ctrl+C para detener');

    } catch (error) {
      logger.error('❌ Error al iniciar la aplicación:', error);
      process.exit(1);
    }
  }

  /**
   * Procesar correos electrónicos
   */
  async processEmails() {
    if (this.isProcessing) {
      logger.warn('Ya hay un proceso en ejecución');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      logger.info('📬 Buscando nuevos estados de cuenta...');

      // Buscar correos del banco
      const emails = await this.emailService.searchBankStatements();

      if (emails.length === 0) {
        logger.info('✅ No hay correos nuevos para procesar');
        this.isProcessing = false;
        return;
      }

      // Procesar cada correo
      for (const email of emails) {
        await this.processEmail(email);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`✅ Procesamiento completado en ${duration}s`);

    } catch (error) {
      logger.error('❌ Error al procesar correos:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Procesar un correo individual
   */
  async processEmail(email) {
    try {
      logger.info('─'.repeat(60));
      logger.info(`📧 Procesando: ${email.subject}`);
      logger.info(`   De: ${email.from}`);
      logger.info(`   Fecha: ${email.date}`);
      logger.info(`   UID: ${email.uid}`);

      // Extraer PDFs
      const pdfFiles = await this.pdfService.extractPDFs(email.attachments);

      if (pdfFiles.length === 0) {
        logger.warn('⚠️  No se encontraron PDFs en el correo');
        return;
      }

      logger.info(`📎 ${pdfFiles.length} PDF(s) encontrado(s)`);

      // Procesar cada PDF
      for (const pdfFile of pdfFiles) {
        await this.processPDF(pdfFile, email);
      }

      // Marcar correo como leído usando UID
      await this.emailService.markAsRead(email.uid);
      logger.info('✅ Correo marcado como leído');

      // Etiquetar y archivar el correo
      try {
        await this.emailService.labelAndArchive(email.uid, 'Bank Statements');
        logger.info('🏷️  Correo etiquetado como "Bank Statements" y archivado');
      } catch (error) {
        logger.error('⚠️  Error al etiquetar/archivar (continuando):', error.message);
      }

    } catch (error) {
      logger.error(`❌ Error al procesar correo "${email.subject}":`, error);
    }
  }

  /**
   * Procesar un PDF individual
   */
  async processPDF(pdfFile, email) {
    try {
      logger.info(`📄 Procesando PDF: ${pdfFile.filename}`);

      // Extraer texto del PDF
      const processedPDF = await this.pdfService.processPDF(pdfFile);

      if (!processedPDF.text) {
        logger.error('❌ No se pudo extraer texto del PDF');
        return;
      }

      // Parsear el estado de cuenta
      const statementInfo = this.parserService.parseStatement(processedPDF.text);


      // Guardar en Notion
      if (statementInfo.found) {
        try {
          await this.notionService.savePayment(statementInfo);
        } catch (error) {
          logger.error('Error al guardar en Notion (continuando con el proceso):', error.message);
        }
      } else {
        logger.warn('⚠️  No se guardará en Notion porque no se encontró información completa');
      }

      // Mostrar resumen
      this.displaySummary(statementInfo);

    } catch (error) {
      logger.error(`❌ Error al procesar PDF ${pdfFile.filename}:`, error);
    }
  }

  /**
   * Guardar resultados en un archivo JSON
   */
  async saveResults(statementInfo, email, pdfFile) {
    try {
      const timestamp = Date.now();
      const resultFilename = `result_${timestamp}.json`;
      const resultPath = join(config.app.downloadFolder, resultFilename);

      const results = {
        email: {
          subject: email.subject,
          from: email.from,
          date: email.date,
        },
        pdf: {
          filename: pdfFile.filename,
          filepath: pdfFile.filepath,
        },
        statement: statementInfo,
        processedAt: new Date().toISOString(),
      };

      writeFileSync(resultPath, JSON.stringify(results, null, 2), 'utf8');
      logger.info(`💾 Resultados guardados en: ${resultPath}`);

    } catch (error) {
      logger.error('Error al guardar resultados:', error);
    }
  }

  /**
   * Mostrar resumen de la información encontrada
   */
  displaySummary(statementInfo) {
    logger.info('');
    logger.info('╔═══════════════════════════════════════════════════════╗');
    logger.info('║            RESUMEN DEL ESTADO DE CUENTA              ║');
    logger.info('╚═══════════════════════════════════════════════════════╝');

    if (statementInfo.bank) {
      logger.info(`   🏦 Banco: ${statementInfo.bank}`);
    }

    if (statementInfo.card) {
      logger.info(`   💳 Tarjeta: ****${statementInfo.card}`);
    }

    if (statementInfo.paymentDate) {
      logger.info(`   📅 Fecha de pago: ${statementInfo.paymentDate}`);
    }

    if (statementInfo.paymentAmountGTQ && statementInfo.paymentAmountUSD) {
      logger.info(`   💰 PAGO DE CONTADO:`);
      logger.info(`      • Quetzales: Q${statementInfo.paymentAmountGTQ.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      logger.info(`      • Dólares:   $${statementInfo.paymentAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    } else if (statementInfo.paymentAmountGTQ) {
      logger.info(`   💰 PAGO DE CONTADO: Q${statementInfo.paymentAmountGTQ.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    } else if (statementInfo.paymentAmountUSD) {
      logger.info(`   💰 PAGO DE CONTADO: $${statementInfo.paymentAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    }

    if (!statementInfo.found) {
      logger.warn('   ⚠️  No se encontró información de pago');
    }

    logger.info('═══════════════════════════════════════════════════════');
    logger.info('');
  }

  /**
   * Detener la aplicación
   */
  async stop() {
    logger.info('🛑 Deteniendo aplicación...');
    this.emailService.disconnect();
    logger.info('👋 Aplicación detenida');
  }
}

// Iniciar la aplicación
const app = new BankStatementAutomation();

// Manejar señales de terminación
process.on('SIGINT', async () => {
  logger.info('\n\n⚠️  Señal de interrupción recibida');
  await app.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\n\n⚠️  Señal de terminación recibida');
  await app.stop();
  process.exit(0);
});

// Capturar errores no manejados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Promesa rechazada no manejada:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Excepción no capturada:', error);
  process.exit(1);
});

// Iniciar
app.start().catch((error) => {
  logger.error('❌ Error fatal:', error);
  process.exit(1);
});

