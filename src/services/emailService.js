import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import { GmailOAuth2Service } from './gmailOAuth2Service.js';

export class EmailService {
  constructor() {
    this.imap = null;
    this.isConnected = false;
    this.oauth2Service = null;
    
    // Inicializar OAuth2 si está configurado
    if (config.email.useOAuth2 && config.email.oauth2ClientId) {
      this.oauth2Service = new GmailOAuth2Service(
        config.email.oauth2ClientId,
        config.email.oauth2ClientSecret,
        config.email.oauth2RedirectUri
      );
    }
  }

  /**
   * Conectar al servidor IMAP con OAuth2 o contraseña
   */
  async connect() {
    return new Promise(async (resolve, reject) => {
      try {
        let imapConfig = {
          user: config.email.user,
          host: config.email.host,
          port: config.email.port,
          tls: config.email.tls,
          tlsOptions: { rejectUnauthorized: false },
        };

        // Si OAuth2 está habilitado, usar XOAUTH2
        if (config.email.useOAuth2 && this.oauth2Service) {
          try {
            const xoauth2Token = await this.oauth2Service.getXOAuth2String(config.email.user);
            imapConfig.xoauth2 = xoauth2Token;
          } catch (error) {
            logger.error('Error al obtener token OAuth2:', error);
            logger.error('Ejecuta "npm run setup-oauth" para configurar OAuth2');
            reject(error);
            return;
          }
        } else {
          imapConfig.password = config.email.password;
        }

        this.imap = new Imap(imapConfig);

        this.imap.once('ready', () => {
          this.isConnected = true;
          const authMethod = config.email.useOAuth2 ? 'OAuth2' : 'contraseña';
          logger.info(`Conexión IMAP establecida correctamente (${authMethod})`);
          resolve();
        });

        this.imap.once('error', (err) => {
          logger.error('Error de conexión IMAP:', err);
          this.isConnected = false;
          
          // Mensaje de ayuda específico para OAuth2
          if (config.email.useOAuth2) {
            logger.error('Si el error es de autenticación, ejecuta: npm run setup-oauth');
          }
          
          reject(err);
        });

        this.imap.once('end', () => {
          this.isConnected = false;
          logger.info('Conexión IMAP cerrada');
        });

        this.imap.connect();
      } catch (error) {
        logger.error('Error al intentar conectar:', error);
        reject(error);
      }
    });
  }

  /**
   * Desconectar del servidor IMAP
   */
  disconnect() {
    if (this.imap && this.isConnected) {
      this.imap.end();
    }
  }

  /**
   * Buscar correos no leídos del banco con estados de cuenta
   */
  async searchBankStatements() {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('No hay conexión IMAP activa'));
        return;
      }

      this.imap.openBox(config.email.folder, false, (err, box) => {
        if (err) {
          logger.error('Error al abrir la carpeta de correo:', err);
          reject(err);
          return;
        }

        // Para búsquedas con múltiples remitentes, haremos búsquedas individuales
        // y combinaremos los resultados (más simple y confiable)
        const allResults = new Set();
        let searchesCompleted = 0;
        let searchError = null;

        const performSearches = () => {
          for (const senderEmail of config.bank.senderEmails) {
            const searchCriteria = [
              'UNSEEN',
              ['FROM', senderEmail],
            ];

            this.imap.search(searchCriteria, (err, results) => {
              if (err) {
                logger.error(`Error al buscar correos de ${senderEmail}:`, err);
                searchError = err;
              } else if (results && results.length > 0) {
                results.forEach(uid => allResults.add(uid));
              }

              searchesCompleted++;

              // Cuando todas las búsquedas terminan
              if (searchesCompleted === config.bank.senderEmails.length) {
                handleSearchComplete();
              }
            });
          }
        };

        const handleSearchComplete = () => {
          if (searchError) {
            this.imap.closeBox((closeErr) => {
              if (closeErr) logger.error('Error al cerrar buzón:', closeErr);
            });
            reject(searchError);
            return;
          }

          const results = Array.from(allResults);

          if (results.length === 0) {
            this.imap.closeBox((closeErr) => {
              if (closeErr) logger.error('Error al cerrar buzón:', closeErr);
            });
            resolve([]);
            return;
          }

          logger.info(`Se encontraron ${results.length} correo(s) nuevo(s) del banco`);

          const emails = [];
          let processedCount = 0;
          const totalMessages = results.length;

          // Usar fetch con UIDs en lugar de seqno
          const fetch = this.imap.fetch(results, {
            bodies: '',
            struct: true,
            markSeen: false,
          });

          fetch.on('message', (msg, seqno) => {
            let buffer = '';
            let uid = null;

            msg.on('body', (stream, info) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            // Capturar el UID del mensaje
            msg.once('attributes', (attrs) => {
              uid = attrs.uid;
            });

            msg.once('end', async () => {
              try {
                const parsed = await simpleParser(buffer);
                
                // Verificar si el asunto contiene palabras clave del estado de cuenta
                const subjectMatch = config.bank.subjectKeywords.some(keyword =>
                  parsed.subject?.toLowerCase().includes(keyword.toLowerCase().trim())
                );

                if (subjectMatch) {
                  logger.info(`Correo relevante encontrado: "${parsed.subject}" (UID: ${uid})`);
                  emails.push({
                    uid,
                    seqno,
                    subject: parsed.subject,
                    from: parsed.from?.text,
                    date: parsed.date,
                    attachments: parsed.attachments,
                  });
                } else {
                  logger.debug(`Correo omitido (asunto no coincide): "${parsed.subject}"`);
                }
              } catch (error) {
                logger.error('Error al parsear el correo:', error);
              }

              // Incrementar contador y resolver cuando todos estén procesados
              processedCount++;
              if (processedCount === totalMessages) {
                logger.info(`Procesamiento de correos completado. ${emails.length} relevante(s)`);
                // Cerrar el buzón después de procesar todos los mensajes
                this.imap.closeBox((closeErr) => {
                  if (closeErr) logger.error('Error al cerrar buzón:', closeErr);
                });
                resolve(emails);
              }
            });
          });

          fetch.once('error', (err) => {
            logger.error('Error al obtener mensajes:', err);
            this.imap.closeBox((closeErr) => {
              if (closeErr) logger.error('Error al cerrar buzón:', closeErr);
            });
            reject(err);
          });
        };

        // Iniciar las búsquedas
        performSearches();
      });
    });
  }

  /**
   * Marcar un correo como leído usando UID
   */
  async markAsRead(uid) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('No hay conexión IMAP activa'));
        return;
      }

      if (!uid) {
        logger.error('UID no proporcionado para marcar como leído');
        reject(new Error('UID no proporcionado'));
        return;
      }

      // Necesitamos abrir el buzón para marcar el correo
      this.imap.openBox(config.email.folder, false, (err, box) => {
        if (err) {
          logger.error('Error al abrir la carpeta para marcar como leído:', err);
          reject(err);
          return;
        }

        // Buscar el mensaje por UID primero
        this.imap.search([['UID', uid]], (searchErr, results) => {
          if (searchErr) {
            logger.error(`Error al buscar correo UID ${uid}:`, searchErr);
            this.imap.closeBox((closeErr) => {
              if (closeErr) logger.error('Error al cerrar buzón:', closeErr);
            });
            reject(searchErr);
            return;
          }

          if (!results || results.length === 0) {
            logger.error(`No se encontró el correo con UID ${uid}`);
            this.imap.closeBox((closeErr) => {
              if (closeErr) logger.error('Error al cerrar buzón:', closeErr);
            });
            reject(new Error(`Correo con UID ${uid} no encontrado`));
            return;
          }

          // Marcar como leído usando el resultado de la búsqueda
          this.imap.addFlags(results, ['\\Seen'], (flagErr) => {
            if (flagErr) {
              logger.error(`Error al marcar correo UID ${uid} como leído:`, flagErr);
              this.imap.closeBox((closeErr) => {
                if (closeErr) logger.error('Error al cerrar buzón:', closeErr);
              });
              reject(flagErr);
            } else {
              logger.info(`Correo UID ${uid} marcado como leído`);
              // Cerrar el buzón para asegurar que los cambios se persistan
              this.imap.closeBox((closeErr) => {
                if (closeErr) {
                  logger.error('Error al cerrar buzón:', closeErr);
                  reject(closeErr);
                } else {
                  resolve();
                }
              });
            }
          });
        });
      });
    });
  }

  /**
   * Agregar una etiqueta a un correo (Gmail)
   * En Gmail, las etiquetas se manejan como carpetas IMAP
   */
  async addLabel(uid, labelName) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('No hay conexión IMAP activa'));
        return;
      }

      if (!uid) {
        logger.error('UID no proporcionado para agregar etiqueta');
        reject(new Error('UID no proporcionado'));
        return;
      }

      // Abrir el buzón actual
      this.imap.openBox(config.email.folder, false, (err, box) => {
        if (err) {
          logger.error('Error al abrir la carpeta:', err);
          reject(err);
          return;
        }

        // Buscar el mensaje por UID
        this.imap.search([['UID', uid]], (searchErr, results) => {
          if (searchErr) {
            logger.error(`Error al buscar correo UID ${uid}:`, searchErr);
            this.imap.closeBox(() => {});
            reject(searchErr);
            return;
          }

          if (!results || results.length === 0) {
            logger.error(`No se encontró el correo con UID ${uid}`);
            this.imap.closeBox(() => {});
            reject(new Error(`Correo con UID ${uid} no encontrado`));
            return;
          }

          // Copiar el mensaje a la etiqueta (carpeta)
          this.imap.copy(results, labelName, (copyErr) => {
            if (copyErr) {
              // Si el error es porque la carpeta no existe, intentar crearla
              if (copyErr.textCode === 'TRYCREATE' || copyErr.message.includes('does not exist')) {
                logger.info(`Creando etiqueta "${labelName}"...`);
                
                this.imap.addBox(labelName, (addErr) => {
                  if (addErr) {
                    logger.error(`Error al crear etiqueta "${labelName}":`, addErr);
                    this.imap.closeBox(() => {});
                    reject(addErr);
                    return;
                  }

                  // Intentar copiar nuevamente después de crear la carpeta
                  this.imap.copy(results, labelName, (retryCopyErr) => {
                    if (retryCopyErr) {
                      logger.error(`Error al copiar mensaje a "${labelName}":`, retryCopyErr);
                      this.imap.closeBox(() => {});
                      reject(retryCopyErr);
                    } else {
                      logger.info(`Correo UID ${uid} etiquetado como "${labelName}"`);
                      this.imap.closeBox(() => {});
                      resolve();
                    }
                  });
                });
              } else {
                logger.error(`Error al copiar mensaje a "${labelName}":`, copyErr);
                this.imap.closeBox(() => {});
                reject(copyErr);
              }
            } else {
              logger.info(`Correo UID ${uid} etiquetado como "${labelName}"`);
              this.imap.closeBox(() => {});
              resolve();
            }
          });
        });
      });
    });
  }

  /**
   * Archivar un correo (moverlo fuera de INBOX)
   * En Gmail, esto significa mover el correo a [Gmail]/All Mail
   */
  async archiveEmail(uid) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('No hay conexión IMAP activa'));
        return;
      }

      if (!uid) {
        logger.error('UID no proporcionado para archivar');
        reject(new Error('UID no proporcionado'));
        return;
      }

      // Abrir el buzón INBOX
      this.imap.openBox(config.email.folder, false, (err, box) => {
        if (err) {
          logger.error('Error al abrir la carpeta:', err);
          reject(err);
          return;
        }

        // Buscar el mensaje por UID
        this.imap.search([['UID', uid]], (searchErr, results) => {
          if (searchErr) {
            logger.error(`Error al buscar correo UID ${uid}:`, searchErr);
            this.imap.closeBox(() => {});
            reject(searchErr);
            return;
          }

          if (!results || results.length === 0) {
            logger.error(`No se encontró el correo con UID ${uid}`);
            this.imap.closeBox(() => {});
            reject(new Error(`Correo con UID ${uid} no encontrado`));
            return;
          }

          // Marcar el mensaje para eliminar de INBOX (archivar)
          // En Gmail, esto lo mueve a [Gmail]/All Mail
          this.imap.addFlags(results, ['\\Deleted'], (flagErr) => {
            if (flagErr) {
              logger.error(`Error al archivar correo UID ${uid}:`, flagErr);
              this.imap.closeBox(() => {});
              reject(flagErr);
            } else {
              // Expunge para aplicar los cambios
              this.imap.expunge((expungeErr) => {
                if (expungeErr) {
                  logger.error(`Error al expunge correo UID ${uid}:`, expungeErr);
                  this.imap.closeBox(() => {});
                  reject(expungeErr);
                } else {
                  logger.info(`Correo UID ${uid} archivado`);
                  this.imap.closeBox(() => {});
                  resolve();
                }
              });
            }
          });
        });
      });
    });
  }

  /**
   * Etiquetar y archivar un correo en una sola operación
   */
  async labelAndArchive(uid, labelName = 'Bank/Bank Statements') {
    try {
      // Primero agregar la etiqueta
      await this.addLabel(uid, labelName);
      
      // Luego archivar el correo
      await this.archiveEmail(uid);
      
      logger.info(`Correo UID ${uid} etiquetado como "${labelName}" y archivado`);
      return true;
    } catch (error) {
      logger.error(`Error al etiquetar y archivar correo UID ${uid}:`, error);
      throw error;
    }
  }
}
