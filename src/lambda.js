import { config, validateConfig } from './config/config.js';
import { logger } from './utils/logger.js';
import { EmailService } from './services/emailService.js';
import { PDFService } from './services/pdfService.js';
import { ParserService } from './services/parserService.js';
import { NotionService } from './services/notionService.js';

/**
 * AWS Lambda Handler para procesamiento de estados de cuenta bancarios
 * Este handler se ejecuta cada hora via EventBridge
 */
export const handler = async (event, context) => {
  const startTime = Date.now();
  
  // Configurar context para que Lambda no espere el event loop vacío
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    // Validar configuración
    validateConfig();

    // Inicializar servicios
    // En Lambda, no guardamos archivos (saveFiles = false)
    const emailService = new EmailService();
    const pdfService = new PDFService(false);
    const parserService = new ParserService();
    const notionService = new NotionService();

    // Conectar al correo
    await emailService.connect();

    // Buscar correos del banco
    const emails = await emailService.searchBankStatements();

    if (emails.length === 0) {
      logger.info('✅ No hay correos nuevos para procesar');
      
      // Desconectar
      emailService.disconnect();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`⏱️  Tiempo de ejecución: ${duration}s`);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No hay correos nuevos',
          emailsProcessed: 0,
          duration: `${duration}s`,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    logger.info(`📧 Encontrados ${emails.length} correo(s) para procesar`);

    // Procesar cada correo
    const results = [];
    
    for (const email of emails) {
      try {
        const result = await processEmail(
          email,
          pdfService,
          parserService,
          notionService,
          emailService
        );
        results.push(result);
      } catch (error) {
        logger.error(`❌ Error al procesar correo "${email.subject}":`, error);
        results.push({
          success: false,
          email: email.subject,
          error: error.message,
        });
      }
    }

    // Desconectar
    emailService.disconnect();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successCount = results.filter(r => r.success).length;
    
    logger.info('='.repeat(60));
    logger.info(`✅ Procesamiento completado en ${duration}s`);
    logger.info(`📊 Resultado: ${successCount}/${emails.length} correos procesados exitosamente`);
    logger.info('='.repeat(60));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Procesamiento completado',
        emailsProcessed: emails.length,
        successCount,
        failureCount: emails.length - successCount,
        duration: `${duration}s`,
        timestamp: new Date().toISOString(),
        results,
      }),
    };

  } catch (error) {
    logger.error('❌ Error fatal en Lambda function:', error);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error al procesar correos',
        error: error.message,
        duration: `${duration}s`,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

/**
 * Procesar un correo individual
 */
async function processEmail(email, pdfService, parserService, notionService, emailService) {
  logger.info('─'.repeat(60));
  logger.info(`📧 Procesando: ${email.subject}`);
  logger.info(`   De: ${email.from}`);
  logger.info(`   Fecha: ${email.date}`);
  logger.info(`   UID: ${email.uid}`);

  try {
    // Extraer PDFs
    const pdfFiles = await pdfService.extractPDFs(email.attachments);

    if (pdfFiles.length === 0) {
      logger.warn('⚠️  No se encontraron PDFs en el correo');
      return {
        success: false,
        email: email.subject,
        message: 'No se encontraron PDFs',
      };
    }

    logger.info(`📎 ${pdfFiles.length} PDF(s) encontrado(s)`);

    // Procesar cada PDF
    const pdfResults = [];
    
    for (const pdfFile of pdfFiles) {
      const pdfResult = await processPDF(
        pdfFile,
        parserService,
        notionService
      );
      pdfResults.push(pdfResult);
    }

    // Marcar correo como leído usando UID
    await emailService.markAsRead(email.uid);
    logger.info('✅ Correo marcado como leído');

    // Etiquetar y archivar el correo
    try {
      await emailService.labelAndArchive(email.uid, 'Bank Statements');
      logger.info('🏷️  Correo etiquetado como "Bank Statements" y archivado');
    } catch (error) {
      logger.error('⚠️  Error al etiquetar/archivar (continuando):', error.message);
    }

    return {
      success: true,
      email: email.subject,
      pdfResults,
    };

  } catch (error) {
    logger.error(`❌ Error al procesar correo:`, error);
    throw error;
  }
}

/**
 * Procesar un PDF individual
 */
async function processPDF(pdfFile, parserService, notionService) {
  try {
    logger.info(`📄 Procesando PDF: ${pdfFile.filename}`);

    // Extraer texto del PDF
    const processedPDF = await pdfFile.processPDF ? 
      pdfFile : 
      { ...pdfFile, text: await extractText(pdfFile.content) };

    if (!processedPDF.text) {
      logger.error('❌ No se pudo extraer texto del PDF');
      return {
        success: false,
        filename: pdfFile.filename,
        message: 'No se pudo extraer texto',
      };
    }

    // Parsear el estado de cuenta
    const statementInfo = parserService.parseStatement(processedPDF.text);

    // Guardar en Notion
    if (statementInfo.found) {
      try {
        await notionService.savePayment(statementInfo);
        logger.info('💾 Información guardada en Notion');
      } catch (error) {
        logger.error('Error al guardar en Notion (continuando con el proceso):', error.message);
      }
    } else {
      logger.warn('⚠️  No se guardará en Notion porque no se encontró información completa');
    }

    // Mostrar resumen
    displaySummary(statementInfo);

    return {
      success: true,
      filename: pdfFile.filename,
      statementInfo,
    };

  } catch (error) {
    logger.error(`❌ Error al procesar PDF ${pdfFile.filename}:`, error);
    return {
      success: false,
      filename: pdfFile.filename,
      error: error.message,
    };
  }
}

/**
 * Mostrar resumen de la información encontrada
 */
function displaySummary(statementInfo) {
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

// Helper para extraer texto (si se llama directamente)
async function extractText(buffer) {
  const pdf = await import('pdf-parse');
  const data = await pdf.default(buffer);
  return data.text;
}

