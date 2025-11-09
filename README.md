# 🏦 Automatización de Estados de Cuenta Bancarios

Sistema automatizado para procesar estados de cuenta de tarjetas de crédito recibidos por correo electrónico. El sistema monitorea tu bandeja de entrada, extrae los PDFs de estados de cuenta y encuentra automáticamente la información de pago de contado.

## 🎯 Características

- ✉️ **Monitoreo automático de correos** - Revisa tu bandeja de entrada periódicamente
- 📎 **Extracción de PDFs** - Detecta y descarga archivos PDF adjuntos
- 🔍 **Análisis inteligente** - Extrae información clave del estado de cuenta:
  - Pago de contado (USD y GTQ)
  - Fecha de pago
  - Últimos 4 dígitos de tarjeta
  - Saldo total
  - Número de cuenta
  - Período del estado de cuenta
- 💾 **Guardado de resultados** - Almacena PDFs y resultados en formato JSON
- 🗂️ **Integración con Notion** - Guarda automáticamente la información en tu base de datos de Notion
- 📊 **Logging completo** - Sistema de logs detallado para seguimiento
- 💱 **Soporte multi-moneda** - MXN, USD, GTQ y más
- 🏦 **Sistema modular por banco** - Detección automática y estrategias específicas por banco
- 🎨 **Abstract Factory Pattern** - Arquitectura profesional y escalable

## 📋 Requisitos Previos

- Node.js 18 o superior
- Cuenta de correo electrónico con acceso IMAP habilitado
- Estados de cuenta bancarios en formato PDF
- (Opcional) Cuenta de Notion para guardar datos automáticamente

## 🚀 Instalación

1. **Clonar o descargar el proyecto**

```bash
cd bank-assistant
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Copia el archivo de plantilla y edita con tus datos:

```bash
copy .env.template .env
```

Edita el archivo `.env` con tu editor de texto favorito y configura:

```env
# Configuración del Correo Electrónico
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_contraseña
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_TLS=true

# Remitente del banco
BANK_EMAIL_SENDER=notificaciones@banco.com

# Palabras clave para identificar estados de cuenta
EMAIL_SUBJECT_KEYWORDS=estado de cuenta,state,tarjeta de credito
```

## 🔐 Configuración de Gmail

Si usas Gmail, necesitas habilitar el acceso IMAP y crear una contraseña de aplicación:

### 1. Habilitar IMAP

1. Ve a Gmail → Configuración (⚙️) → Ver toda la configuración
2. Pestaña "Reenvío y correo POP/IMAP"
3. Habilita "Habilitar IMAP"
4. Guarda los cambios

### 2. Crear Contraseña de Aplicación

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Seguridad → Verificación en dos pasos (debe estar activada)
3. Contraseñas de aplicaciones
4. Selecciona "Correo" y "Otro dispositivo personalizado"
5. Copia la contraseña generada (16 caracteres)
6. Úsala en `EMAIL_PASSWORD` en tu archivo `.env`

## 🗂️ Configuración de Notion (Opcional)

Para guardar automáticamente la información en una base de datos de Notion:

1. **Sigue la guía completa en:** [NOTION_SETUP.md](NOTION_SETUP.md)
2. **Agrega a tu `.env`:**
   ```env
   NOTION_API_KEY=secret_tu_api_key
   NOTION_DATABASE_ID=tu_database_id
   ```
3. **Prueba la conexión:**
   ```bash
   npm run test:notion
   ```

**Información que se guarda en Notion:**
- 📅 Fecha de pago
- 💵 Pago Contado USD
- 💰 Pago Contado GTQ
- 💳 Últimos 4 dígitos de tarjeta

> **Nota:** La integración con Notion es opcional. Si no configuras las variables, la aplicación funcionará normalmente guardando solo los archivos JSON locales.

## ⚙️ Configuración para Otros Bancos

### Configurar el Remitente del Banco

Necesitas identificar desde qué dirección de correo tu banco envía los estados de cuenta:

1. Abre un correo de estado de cuenta de tu banco
2. Mira la dirección del remitente (ej: `notificaciones@banamex.com`)
3. Configúralo en `.env`:

```env
BANK_EMAIL_SENDER=notificaciones@tuBanco.com
```

### Configurar Palabras Clave

Configura las palabras que aparecen en el asunto de los correos:

```env
EMAIL_SUBJECT_KEYWORDS=estado de cuenta,tarjeta,credit card
```

## 🎮 Uso

### Modo Normal

```bash
npm start
```

El sistema:
1. Se conecta a tu correo
2. Busca correos no leídos del banco
3. Procesa los PDFs adjuntos
4. Extrae la información de pago
5. Guarda los resultados localmente (JSON)
6. Guarda en Notion (si está configurado)
7. Marca los correos como leídos
8. Repite el proceso cada X minutos (configurado en `.env`)

### Modo Desarrollo (con auto-reinicio)

```bash
npm run dev
```

### Detener el Sistema

Presiona `Ctrl + C` en la terminal

## 📁 Estructura del Proyecto

```
bank-assistant/
├── src/
│   ├── config/
│   │   └── config.js          # Configuración de la aplicación
│   ├── services/
│   │   ├── emailService.js    # Servicio de correo electrónico
│   │   ├── pdfService.js      # Servicio de procesamiento de PDFs
│   │   ├── parserService.js   # Servicio de análisis de texto
│   │   └── notionService.js   # Servicio de integración con Notion
│   ├── utils/
│   │   └── logger.js          # Sistema de logging
│   └── index.js               # Archivo principal
├── downloads/                  # PDFs y resultados descargados
├── logs/                       # Archivos de log
├── .env                        # Variables de entorno (no incluir en git)
├── .env.template              # Plantilla de configuración
├── .gitignore
├── package.json
└── README.md
```

## 📄 Salida de Resultados

Cada estado de cuenta procesado genera dos archivos en la carpeta `downloads/`:

### 1. PDF Original
```
[timestamp]_estado_cuenta.pdf
```

### 2. Resultados en JSON
```json
{
  "email": {
    "subject": "Tu Estado de Cuenta",
    "from": "banco@example.com",
    "date": "2024-11-06T12:00:00.000Z"
  },
  "pdf": {
    "filename": "estado_cuenta.pdf",
    "filepath": "./downloads/1234567890_estado_cuenta.pdf"
  },
  "statement": {
    "found": true,
    "pagoContado": 5432.10,
    "pagoMinimo": 150.00,
    "saldoTotal": 5432.10,
    "fechaLimite": "20/11/2024",
    "moneda": "MXN",
    "accountNumber": "1234",
    "period": {
      "start": "20/10/2024",
      "end": "19/11/2024"
    },
    "processedAt": "2024-11-06T12:00:00.000Z"
  }
}
```

## 🔧 Personalización

### Ajustar Patrones de Búsqueda

Si el sistema no encuentra la información correctamente, puedes ajustar los patrones de búsqueda en `src/services/parserService.js`:

```javascript
const patterns = {
  pagoContado: [
    /pago\s+(?:de\s+)?contado[:\s]+(?:[$]|MXN|USD)?\s*([\d,]+\.?\d*)/gi,
    // Agrega tus propios patrones aquí
  ],
  // ...
};
```

### Cambiar Intervalo de Revisión

En tu archivo `.env`:

```env
# Revisar cada 5 minutos
CHECK_INTERVAL_MINUTES=5

# Revisar cada hora
CHECK_INTERVAL_MINUTES=60
```

## 📝 Logs

Los logs se guardan en la carpeta `logs/`:

- `combined.log` - Todos los eventos
- `error.log` - Solo errores

También se muestran en la consola con colores.

## 🐛 Solución de Problemas

### Error de Autenticación

```
Error: Invalid credentials
```

**Solución:**
- Verifica que `EMAIL_USER` y `EMAIL_PASSWORD` sean correctos
- Si usas Gmail, usa una contraseña de aplicación, no tu contraseña normal
- Verifica que la verificación en dos pasos esté activada (Gmail)

### No Encuentra Correos

**Solución:**
- Verifica que `BANK_EMAIL_SENDER` sea correcto
- Revisa las palabras clave en `EMAIL_SUBJECT_KEYWORDS`
- Verifica que los correos no estén marcados como leídos

### No Extrae la Información

**Solución:**
- Revisa el log para ver el texto extraído del PDF
- Ajusta los patrones de búsqueda en `parserService.js`
- Algunos PDFs pueden tener formato de imagen y no texto (necesitarían OCR)

### Error al Conectar IMAP

```
Error: connect ECONNREFUSED
```

**Solución:**
- Verifica que `EMAIL_HOST` y `EMAIL_PORT` sean correctos
- Verifica tu conexión a internet
- Algunos proveedores pueden bloquear conexiones IMAP, contacta a tu proveedor

## 🔒 Seguridad

- **NUNCA** compartas tu archivo `.env`
- **NUNCA** subas tu archivo `.env` a Git (está en `.gitignore`)
- Usa contraseñas de aplicación en lugar de tu contraseña principal
- Revisa periódicamente los accesos a tu cuenta de correo

## 🏦 Agregar Soporte para Nuevos Bancos

El sistema cuenta con un **sistema modular de detección por banco** que permite agregar fácilmente soporte para nuevos bancos.

### Bancos Actualmente Soportados

- ✅ **Banco Promerica (Guatemala)** - Totalmente soportado con estrategia específica
- 📋 **Otros bancos** - Usa estrategia genérica (puede requerir ajustes)

### Cómo Funciona

1. El sistema detecta automáticamente el banco del PDF
2. Aplica la estrategia de extracción específica para ese banco
3. Si no reconoce el banco, usa una estrategia genérica

### Guía Completa

- **`BANKS.md`** - Guía para agregar bancos, ejemplos y troubleshooting
- **`ARCHITECTURE_FACTORY.md`** - Documentación completa del patrón Abstract Factory implementado

## 🚀 Mejoras Futuras

- [ ] Soporte para OCR en PDFs con imágenes
- [ ] Notificaciones (email, SMS, webhook)
- [ ] Base de datos para historial de pagos
- [ ] Dashboard web para visualizar resultados
- [ ] Soporte para múltiples bancos/cuentas
- [ ] Integración con APIs de pago automático
- [ ] Recordatorios de fechas de pago

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en la carpeta `logs/`
2. Verifica tu configuración en `.env`
3. Asegúrate de tener la última versión de Node.js
4. Revisa que todas las dependencias estén instaladas: `npm install`

## 📄 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**Nota:** Este proyecto es para uso personal y educativo. Asegúrate de cumplir con los términos de servicio de tu proveedor de correo electrónico y las políticas de tu banco.

