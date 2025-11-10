# 🚀 Guía de Configuración Rápida

## Paso 1: Instalar Node.js

1. Descarga Node.js desde: https://nodejs.org/
2. Instala la versión LTS (Long Term Support)
3. Verifica la instalación:

```bash
node --version
npm --version
```

## Paso 2: Configurar el Proyecto

1. Abre la terminal en la carpeta del proyecto
2. Instala las dependencias:

```bash
npm install
```

## Paso 3: Configurar Gmail (si usas Gmail)

### Habilitar IMAP

1. Abre Gmail
2. Click en ⚙️ (Configuración) → "Ver toda la configuración"
3. Pestaña "Reenvío y correo POP/IMAP"
4. Selecciona "Habilitar IMAP"
5. Guarda cambios

### Crear Contraseña de Aplicación

**Importante:** Gmail requiere verificación en dos pasos para usar contraseñas de aplicación

1. Ve a https://myaccount.google.com/security
2. Activa "Verificación en dos pasos" (si no está activa)
3. Busca "Contraseñas de aplicaciones"
4. Selecciona:
   - Aplicación: "Correo"
   - Dispositivo: "Otro (nombre personalizado)" → escribe "Bank Assistant"
5. Copia la contraseña de 16 caracteres (sin espacios)

## Paso 4: Identificar el Correo de tu Banco

1. Abre un correo de estado de cuenta de tu banco
2. Mira la dirección de correo del remitente

Ejemplos comunes:
- BBVA: `notificaciones@bbva.com`
- Santander: `estadodecuenta@santander.com.mx`
- Banamex: `notificaciones@banamex.com`
- HSBC: `estadodecuenta@hsbc.com.mx`

## Paso 5: Crear Archivo de Configuración

1. En la carpeta del proyecto, crea un archivo llamado `.env`
2. Copia este contenido y completa con tus datos:

```env
# TU CORREO
EMAIL_USER=tu_email@gmail.com

# LA CONTRASEÑA DE APLICACIÓN DE 16 CARACTERES
EMAIL_PASSWORD=aaaa bbbb cccc dddd

# SERVIDOR DE CORREO (Gmail por defecto)
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_TLS=true

# CARPETA DE CORREO
EMAIL_FOLDER=INBOX

# CORREO DE TU BANCO
BANK_EMAIL_SENDER=notificaciones@banco.com

# PALABRAS CLAVE EN EL ASUNTO DEL CORREO
EMAIL_SUBJECT_KEYWORDS=estado de cuenta,tarjeta

# REVISAR CADA 5 MINUTOS
CHECK_INTERVAL_MINUTES=5

# CARPETAS
DOWNLOAD_FOLDER=./downloads
LOG_FOLDER=./logs

# NIVEL DE LOG
LOG_LEVEL=info
```

## Paso 6: Probar la Conexión

Ejecuta el programa:

```bash
npm start
```

Deberías ver:

```
🏦 Sistema de Automatización de Estados de Cuenta Bancarios
✅ Configuración validada correctamente
📧 Monitoreando: tu_email@gmail.com
🏦 Banco: notificaciones@banco.com
✅ Sistema iniciado correctamente
```

## ⚠️ Problemas Comunes

### Error: "Invalid credentials"

**Causa:** Usuario o contraseña incorrectos

**Solución:**
- Verifica tu email en `EMAIL_USER`
- Verifica que uses la contraseña de aplicación (16 caracteres)
- NO uses tu contraseña normal de Gmail

### Error: "Configuration incomplete"

**Causa:** Falta información en el archivo `.env`

**Solución:**
- Verifica que el archivo se llame exactamente `.env` (con el punto al inicio)
- Verifica que todas las variables estén configuradas
- No dejes espacios antes o después del `=`

### No encuentra correos

**Causa:** Configuración incorrecta del banco o palabras clave

**Solución:**
- Verifica que `BANK_EMAIL_SENDER` sea exactamente el correo del banco
- Ajusta `EMAIL_SUBJECT_KEYWORDS` con palabras que aparezcan en el asunto
- Verifica que tengas correos no leídos del banco en tu bandeja

## 📧 Configuración para Otros Proveedores

### Outlook/Hotmail

```env
EMAIL_HOST=outlook.office365.com
EMAIL_PORT=993
EMAIL_TLS=true
```

### Yahoo

```env
EMAIL_HOST=imap.mail.yahoo.com
EMAIL_PORT=993
EMAIL_TLS=true
```

⚠️ **Nota:** Estos proveedores también pueden requerir contraseñas de aplicación

## ✅ Siguiente Paso

Una vez que veas que el sistema se conecta correctamente:

1. Envíate un correo de prueba con un PDF adjunto
2. O espera a que llegue tu próximo estado de cuenta
3. El sistema lo detectará automáticamente y lo procesará

## 🆘 ¿Necesitas Ayuda?

Revisa el archivo `logs/combined.log` para ver información detallada sobre lo que está sucediendo.

Para ver más logs en la consola, cambia en `.env`:

```env
LOG_LEVEL=debug
```

