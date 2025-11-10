import winston from 'winston';
import { config } from '../config/config.js';
import { existsSync, mkdirSync } from 'fs';

// Detectar si estamos en Lambda
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.AWS_EXECUTION_ENV;

// Crear carpeta de logs solo si NO estamos en Lambda
if (!isLambda && !existsSync(config.app.logFolder)) {
  mkdirSync(config.app.logFolder, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    const msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    return stack ? `${msg}\n${stack}` : msg;
  })
);

// Configurar transports según el entorno
const transports = [
  // Siempre escribir logs en consola (en Lambda va a CloudWatch)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    ),
  }),
];

// Solo agregar archivos de log si NO estamos en Lambda
if (!isLambda) {
  transports.push(
    new winston.transports.File({
      filename: `${config.app.logFolder}/error.log`,
      level: 'error',
    }),
    new winston.transports.File({
      filename: `${config.app.logFolder}/combined.log`,
    })
  );
}

export const logger = winston.createLogger({
  level: config.app.logLevel,
  format: logFormat,
  defaultMeta: { 
    environment: isLambda ? 'lambda' : 'local'
  },
  transports,
});

