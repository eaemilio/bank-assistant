/**
 * Script para verificar la configuración antes de ejecutar el sistema completo
 */

import { config, validateConfig } from './config/config.js';
import { logger } from './utils/logger.js';

console.log('\n');
console.log('='.repeat(70));
console.log('🔍 VERIFICACIÓN DE CONFIGURACIÓN');
console.log('='.repeat(70));
console.log('\n');

try {
  // Validar configuración
  validateConfig();

  console.log('✅ Configuración validada correctamente\n');

  // Mostrar configuración (sin contraseña)
  console.log('📧 CONFIGURACIÓN DE CORREO:');
  console.log(`   Usuario: ${config.email.user}`);
  console.log(`   Host: ${config.email.host}`);
  console.log(`   Puerto: ${config.email.port}`);
  console.log(`   TLS: ${config.email.tls ? 'Sí' : 'No'}`);
  console.log(`   Carpeta: ${config.email.folder}`);
  console.log(`   Contraseña: ${'*'.repeat(config.email.password.length)} (oculta)\n`);

  console.log('🏦 CONFIGURACIÓN DEL BANCO:');
  console.log(`   Remitente: ${config.bank.senderEmail}`);
  console.log(`   Palabras clave: ${config.bank.subjectKeywords.join(', ')}\n`);

  console.log('⚙️  CONFIGURACIÓN DE LA APLICACIÓN:');
  console.log(`   Intervalo de revisión: ${config.app.checkIntervalMinutes} minuto(s)`);
  console.log(`   Carpeta de descargas: ${config.app.downloadFolder}`);
  console.log(`   Carpeta de logs: ${config.app.logFolder}`);
  console.log(`   Nivel de log: ${config.app.logLevel}\n`);

  console.log('='.repeat(70));
  console.log('✅ TODO ESTÁ CORRECTO');
  console.log('='.repeat(70));
  console.log('\n💡 Tip: Ejecuta "npm start" para iniciar el sistema\n');

  process.exit(0);
} catch (error) {
  console.error('\n❌ ERROR EN LA CONFIGURACIÓN:\n');
  console.error(`   ${error.message}\n`);

  console.log('📝 PASOS PARA SOLUCIONARLO:\n');
  console.log('   1. Crea un archivo .env en la raíz del proyecto');
  console.log('   2. Copia el contenido de config.example.env');
  console.log('   3. Completa los valores requeridos\n');

  console.log('📚 Consulta SETUP.md para más información\n');

  process.exit(1);
}

