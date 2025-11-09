import { GmailOAuth2Service } from './services/gmailOAuth2Service.js';
import { config } from './config/config.js';
import readline from 'readline';

/**
 * Script interactivo para configurar OAuth2 de Gmail
 */
async function setupOAuth() {
  console.log('\n🔐 Configuración de OAuth2 para Gmail\n');
  console.log('━'.repeat(50));

  // Validar que existan las credenciales OAuth2
  if (!config.email.oauth2ClientId || !config.email.oauth2ClientSecret) {
    console.error('❌ Error: Faltan credenciales OAuth2 en el archivo .env');
    process.exit(1);
  }

  const oauth2Service = new GmailOAuth2Service(
    config.email.oauth2ClientId,
    config.email.oauth2ClientSecret,
    config.email.oauth2RedirectUri
  );

  // Verificar si ya existe un token válido
  if (oauth2Service.hasValidToken()) {
    console.log('✅ Ya tienes tokens de OAuth2 configurados.\n');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question('¿Quieres volver a autenticarte? (s/n): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 's') {
      console.log('\n✅ Configuración completada. Puedes ejecutar "npm start"\n');
      process.exit(0);
    }
  }

  // Generar URL de autorización
  const authUrl = oauth2Service.getAuthUrl();
  
  console.log('\n📋 PASO 1: Autoriza la aplicación');
  console.log('━'.repeat(50));
  console.log('\n1. Abre el siguiente enlace en tu navegador:\n');
  console.log(`   ${authUrl}\n`);
  console.log('2. Inicia sesión con tu cuenta de Gmail');
  console.log('3. Autoriza la aplicación');
  console.log('4. Copia el código de autorización que aparece\n');

  // Solicitar el código de autorización
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('━'.repeat(50));
  const code = await new Promise((resolve) => {
    rl.question('\n📋 PASO 2: Pega el código de autorización aquí: ', resolve);
  });
  rl.close();

  try {
    console.log('\n⏳ Obteniendo tokens...\n');
    await oauth2Service.getTokenFromCode(code.trim());
    
    console.log('━'.repeat(50));
    console.log('\n✅ ¡OAuth2 configurado correctamente!\n');
    console.log('Los tokens se han guardado en: gmail-token.json');
    console.log('\n⚠️  IMPORTANTE: No compartas este archivo, contiene información sensible.\n');
    console.log('Ahora puedes ejecutar: npm start\n');
    console.log('━'.repeat(50));
  } catch (error) {
    console.error('\n❌ Error al configurar OAuth2:', error.message);
    console.log('\nIntenta de nuevo ejecutando: npm run setup-oauth\n');
    process.exit(1);
  }
}

// Ejecutar el setup
setupOAuth().catch((error) => {
  console.error('Error inesperado:', error);
  process.exit(1);
});

