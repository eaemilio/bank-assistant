#!/usr/bin/env node

/**
 * Script para subir el token OAuth2 de Gmail a AWS SSM Parameter Store
 * Útil para la configuración inicial de Lambda
 */

import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm';
import { readFileSync, existsSync } from 'fs';
import { logger } from './utils/logger.js';

const SSM_PARAMETER_NAME = '/bank-assistant/gmail-token';
const TOKEN_FILE_PATH = 'gmail-token.json';

async function uploadTokenToSSM() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  Subir Token OAuth2 de Gmail a AWS SSM Parameter Store   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Verificar que el archivo de token existe
    if (!existsSync(TOKEN_FILE_PATH)) {
      logger.error(`❌ Archivo ${TOKEN_FILE_PATH} no encontrado`);
      logger.info('');
      logger.info('Debes ejecutar primero: npm run setup-oauth');
      logger.info('Esto creará el archivo gmail-token.json localmente');
      process.exit(1);
    }

    // Leer el token
    logger.info(`📖 Leyendo token desde ${TOKEN_FILE_PATH}...`);
    const tokenData = readFileSync(TOKEN_FILE_PATH, 'utf8');
    const token = JSON.parse(tokenData);

    // Validar que tiene refresh_token
    if (!token.refresh_token) {
      logger.error('❌ El token no tiene refresh_token');
      logger.error('El token debe tener un refresh_token para funcionar en Lambda');
      process.exit(1);
    }

    logger.info('✅ Token leído correctamente');
    logger.info('');

    // Obtener región de AWS
    const region = process.env.AWS_REGION || 'us-east-1';
    logger.info(`🌎 Región de AWS: ${region}`);

    // Crear cliente SSM
    const ssmClient = new SSMClient({ region });

    // Subir token a SSM
    logger.info(`📤 Subiendo token a SSM Parameter Store...`);
    logger.info(`   Parámetro: ${SSM_PARAMETER_NAME}`);

    const command = new PutParameterCommand({
      Name: SSM_PARAMETER_NAME,
      Value: tokenData,
      Type: 'SecureString',
      Overwrite: true,
      Description: 'Gmail OAuth2 token for bank assistant',
    });

    await ssmClient.send(command);

    logger.info('');
    logger.info('╔═══════════════════════════════════════════════════════════╗');
    logger.info('║                    ✅ ¡Éxito!                             ║');
    logger.info('╚═══════════════════════════════════════════════════════════╝');
    logger.info('');
    logger.info(`Token OAuth2 subido correctamente a AWS SSM`);
    logger.info(`Parámetro: ${SSM_PARAMETER_NAME}`);
    logger.info(`Región: ${region}`);
    logger.info('');
    logger.info('Próximos pasos:');
    logger.info('1. Desplegar la función Lambda: npm run lambda:deploy');
    logger.info('2. Probar la función: npm run lambda:test');
    logger.info('3. Ver logs: npm run lambda:logs');
    logger.info('');

  } catch (error) {
    logger.error('');
    logger.error('❌ Error al subir token a SSM:');
    
    if (error.name === 'CredentialsError' || error.message.includes('credentials')) {
      logger.error('');
      logger.error('No se encontraron credenciales de AWS configuradas');
      logger.error('');
      logger.error('Ejecuta: aws configure');
      logger.error('Y proporciona:');
      logger.error('  - AWS Access Key ID');
      logger.error('  - AWS Secret Access Key');
      logger.error('  - Default region (ej: us-east-1)');
    } else if (error.name === 'AccessDeniedException') {
      logger.error('');
      logger.error('Tu usuario de AWS no tiene permisos para SSM Parameter Store');
      logger.error('');
      logger.error('Necesitas estos permisos:');
      logger.error('  - ssm:PutParameter');
      logger.error('  - ssm:GetParameter');
    } else {
      logger.error(error.message);
    }
    
    process.exit(1);
  }
}

// Ejecutar
uploadTokenToSSM();

