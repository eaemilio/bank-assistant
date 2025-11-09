import winston from 'winston';
import { config } from '../config/config.js';
import { existsSync, mkdirSync } from 'fs';

// Crear carpeta de logs si no existe
if (!existsSync(config.app.logFolder)) {
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

export const logger = winston.createLogger({
  level: config.app.logLevel,
  format: logFormat,
  transports: [
    // Escribir logs en consola
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
    // Escribir logs en archivo
    new winston.transports.File({
      filename: `${config.app.logFolder}/error.log`,
      level: 'error',
    }),
    new winston.transports.File({
      filename: `${config.app.logFolder}/combined.log`,
    }),
  ],
});

