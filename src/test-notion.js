import { config } from './config/config.js';
import { NotionService } from './services/notionService.js';
import { logger } from './utils/logger.js';

/**
 * Script de prueba para verificar la conexión con Notion
 * Uso: node src/test-notion.js
 */

async function testNotionConnection() {
  logger.info('='.repeat(60));
  logger.info('🧪 Test de Conexión con Notion');
  logger.info('='.repeat(60));
  logger.info('');

  // Verificar configuración
  if (!config.notion.apiKey) {
    logger.error('❌ NOTION_API_KEY no está configurada en .env');
    logger.info('');
    logger.info('Por favor, agrega esta línea a tu archivo .env:');
    logger.info('NOTION_API_KEY=secret_tu_api_key');
    logger.info('');
    logger.info('Para obtener tu API key, ve a: https://www.notion.so/my-integrations');
    process.exit(1);
  }

  if (!config.notion.databaseId) {
    logger.error('❌ NOTION_DATABASE_ID no está configurada en .env');
    logger.info('');
    logger.info('Por favor, agrega esta línea a tu archivo .env:');
    logger.info('NOTION_DATABASE_ID=tu_database_id');
    logger.info('');
    logger.info('El ID está en la URL de tu base de datos en Notion');
    process.exit(1);
  }

  logger.info('✅ Variables de entorno configuradas');
  logger.info(`   API Key: ${config.notion.apiKey.substring(0, 10)}...`);
  logger.info(`   Database ID: ${config.notion.databaseId}`);
  logger.info('');

  // Crear instancia del servicio
  const notionService = new NotionService();

  // Test 1: Verificar conexión
  logger.info('─'.repeat(60));
  logger.info('📡 Test 1: Verificando conexión y permisos...');
  logger.info('─'.repeat(60));
  
  const isConnected = await notionService.testConnection();
  
  if (!isConnected) {
    logger.error('');
    logger.error('❌ No se pudo conectar con Notion');
    logger.error('');
    logger.error('Posibles problemas:');
    logger.error('1. El API key es inválido');
    logger.error('2. El Database ID es incorrecto');
    logger.error('3. La integración no tiene acceso a la base de datos');
    logger.error('');
    logger.error('Solución:');
    logger.error('- Ve a tu base de datos en Notion');
    logger.error('- Haz clic en "..." (tres puntos) → "Add connections"');
    logger.error('- Agrega tu integración a la base de datos');
    logger.error('');
    logger.info('Consulta NOTION_SETUP.md para más detalles');
    process.exit(1);
  }

  logger.info('');

  // Test 2: Crear entrada de prueba
  logger.info('─'.repeat(60));
  logger.info('📝 Test 2: Creando entrada de prueba...');
  logger.info('─'.repeat(60));

  const testData = {
    paymentDate: new Date().toISOString().split('T')[0],
    paymentAmountUSD: 100.50,
    paymentAmountGTQ: 775.75,
    card: '1234',
    found: true,
  };

  logger.info('Datos de prueba:');
  logger.info(`   Fecha: ${testData.paymentDate}`);
  logger.info(`   USD: $${testData.paymentAmountUSD}`);
  logger.info(`   GTQ: Q${testData.paymentAmountGTQ}`);
  logger.info(`   Tarjeta: ****${testData.card}`);
  logger.info('');

  try {
    const result = await notionService.savePayment(testData);
    
    logger.info('');
    logger.info('✅ Entrada creada exitosamente!');
    logger.info(`   Notion Page ID: ${result.id}`);
    logger.info(`   URL: ${result.url}`);
    logger.info('');
    logger.info('Ve a tu base de datos en Notion para ver la entrada de prueba');

  } catch (error) {
    logger.error('');
    logger.error('❌ Error al crear entrada de prueba');
    logger.error(`   ${error.message}`);
    
    if (error.body) {
      logger.error('');
      logger.error('Detalles del error:');
      logger.error(JSON.stringify(error.body, null, 2));
    }

    logger.error('');
    logger.error('Posibles causas:');
    logger.error('1. Los nombres de las columnas en Notion no coinciden');
    logger.error('2. Las propiedades tienen el tipo incorrecto');
    logger.error('');
    logger.error('Verifica que tu base de datos tenga estas columnas:');
    logger.error('- Nombre (Title)');
    logger.error('- Fecha de Pago (Date)');
    logger.error('- Pago Contado USD (Number)');
    logger.error('- Pago Contado GTQ (Number)');
    logger.error('- Tarjeta (Text)');
    logger.error('');
    logger.info('Consulta NOTION_SETUP.md para más detalles');
    
    process.exit(1);
  }

  logger.info('');
  logger.info('='.repeat(60));
  logger.info('🎉 Todos los tests pasaron exitosamente!');
  logger.info('='.repeat(60));
  logger.info('');
  logger.info('Tu integración con Notion está lista para usar.');
  logger.info('La aplicación guardará automáticamente los datos de');
  logger.info('los estados de cuenta en tu base de datos.');
  logger.info('');
}

// Ejecutar tests
testNotionConnection().catch((error) => {
  logger.error('');
  logger.error('❌ Error inesperado:', error);
  process.exit(1);
});

