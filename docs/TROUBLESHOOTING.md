# 🔧 Guía de Solución de Problemas

## Tabla de Contenidos
- [Problemas de Instalación](#problemas-de-instalación)
- [Problemas de Configuración](#problemas-de-configuración)
- [Problemas de Conexión](#problemas-de-conexión)
- [Problemas de Procesamiento](#problemas-de-procesamiento)
- [Problemas de Performance](#problemas-de-performance)
- [Herramientas de Diagnóstico](#herramientas-de-diagnóstico)

---

## Problemas de Instalación

### Error: `npm install` falla

**Síntoma:**
```
npm ERR! code ENOENT
npm ERR! syscall open
```

**Causa:** No estás en el directorio correcto o no existe `package.json`

**Solución:**
```bash
# Windows
cd C:\ruta\a\bank-assistant

# Mac/Linux
cd /ruta/a/bank-assistant

# Verificar que exista package.json
dir  # Windows
ls   # Mac/Linux
```

### Error: Node.js no encontrado

**Síntoma:**
```
'node' is not recognized as an internal or external command
```

**Causa:** Node.js no está instalado o no está en el PATH

**Solución:**
1. Descarga Node.js: https://nodejs.org/
2. Instala la versión LTS
3. Reinicia la terminal
4. Verifica: `node --version`

### Error al instalar dependencias específicas

**Síntoma:**
```
npm ERR! gyp ERR! build error
```

**Causa:** Falta compilador C++ para módulos nativos

**Solución Windows:**
```bash
npm install --global windows-build-tools
```

**Solución Mac:**
```bash
xcode-select --install
```

**Solución Linux:**
```bash
sudo apt-get install build-essential
```

---

## Problemas de Configuración

### Error: "Configuration incomplete"

**Síntoma:**
```
Error: Configuración incompleta. Faltan las siguientes variables: email.user, email.password
```

**Causa:** Archivo `.env` no existe o está incompleto

**Solución:**
1. Verifica que exista el archivo `.env` (con punto al inicio)
2. Copia desde plantilla:
   ```bash
   # Windows
   copy config.example.env .env
   
   # Mac/Linux
   cp config.example.env .env
   ```
3. Edita `.env` con tus datos
4. Verifica con: `npm run check`

### Error: No se carga el archivo .env

**Síntoma:** Las variables están en `.env` pero el sistema dice que faltan

**Causa:** Nombre incorrecto del archivo

**Solución:**
```bash
# El archivo debe llamarse EXACTAMENTE .env
# NO .env.txt
# NO env
# NO .env.example

# Windows - ver archivos ocultos:
# Explorador → Ver → Opciones → Ver → Mostrar archivos ocultos

# Renombrar si es necesario:
ren env .env           # Windows
mv env .env            # Mac/Linux
```

### Variables de entorno no se reconocen

**Síntoma:** `undefined` en lugar de valores

**Causa:** Formato incorrecto en `.env`

**Solución:**
```env
# ❌ INCORRECTO:
EMAIL_USER = mi_email@gmail.com    # NO spaces around =
EMAIL_USER="mi_email@gmail.com"    # NO quotes unless needed
EMAIL_USER                          # NO missing value

# ✅ CORRECTO:
EMAIL_USER=mi_email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

---

## Problemas de Conexión

### Error: "Invalid credentials"

**Síntoma:**
```
Error: Invalid credentials (Failure)
```

**Diagnóstico:**
```bash
# Verificar configuración
npm run check
```

**Causas y Soluciones:**

#### 1. Gmail sin contraseña de aplicación
```env
# ❌ INCORRECTO:
EMAIL_PASSWORD=mi_contraseña_normal

# ✅ CORRECTO:
EMAIL_PASSWORD=abcd efgh ijkl mnop  # 16 caracteres
```

**Cómo obtener contraseña de aplicación:**
1. https://myaccount.google.com/security
2. Habilitar verificación en dos pasos
3. Buscar "Contraseñas de aplicaciones"
4. Generar nueva para "Correo"
5. Copiar los 16 caracteres

#### 2. Usuario incorrecto
```env
# ✅ CORRECTO - email completo:
EMAIL_USER=juan.perez@gmail.com

# ❌ INCORRECTO - sin dominio:
EMAIL_USER=juan.perez
```

#### 3. IMAP no habilitado en Gmail
**Solución:**
1. Gmail → ⚙️ → Ver toda la configuración
2. "Reenvío y correo POP/IMAP"
3. "Habilitar IMAP"
4. Guardar cambios

### Error: "Connection timeout"

**Síntoma:**
```
Error: connect ETIMEDOUT
```

**Causas y Soluciones:**

#### 1. Firewall/Antivirus bloqueando
- Agrega excepción para Node.js
- Permite conexiones IMAP (puerto 993)

#### 2. Host/Puerto incorrecto
```env
# Gmail
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993

# Outlook
EMAIL_HOST=outlook.office365.com
EMAIL_PORT=993

# Yahoo
EMAIL_HOST=imap.mail.yahoo.com
EMAIL_PORT=993
```

#### 3. Sin conexión a internet
```bash
# Probar conexión
ping google.com
```

### Error: "Certificate has expired"

**Síntoma:**
```
Error: certificate has expired
```

**Solución temporal:**
```javascript
// En src/services/emailService.js, línea ~20:
tlsOptions: { rejectUnauthorized: false }
```

**Solución permanente:**
- Actualiza Node.js a la última versión

---

## Problemas de Procesamiento

### No encuentra correos del banco

**Síntoma:** Sistema dice "No se encontraron correos nuevos"

**Diagnóstico:**
```bash
# 1. Verificar configuración
npm run check

# 2. Ver nivel debug
# En .env:
LOG_LEVEL=debug

# 3. Revisar logs
# Windows:
type logs\combined.log

# Mac/Linux:
cat logs/combined.log
```

**Causas y Soluciones:**

#### 1. Remitente incorrecto
```bash
# Verificar email EXACTO del banco
# Abrir correo → Ver detalles → De:
```

```env
# ✅ CORRECTO - email completo:
BANK_EMAIL_SENDER=notificaciones@banamex.com

# ❌ INCORRECTO - parcial:
BANK_EMAIL_SENDER=banamex.com
```

#### 2. Palabras clave no coinciden
```env
# Ver el asunto real del correo y agregar palabras clave:
EMAIL_SUBJECT_KEYWORDS=estado de cuenta,tarjeta,credit card,estado cuenta
```

#### 3. Correos ya marcados como leídos
**Solución:** Marca un correo como no leído en tu bandeja

#### 4. Correos en otra carpeta
```env
# Por defecto busca en INBOX
# Si están en otra carpeta:
EMAIL_FOLDER=Promociones
EMAIL_FOLDER=Bandeja de entrada
```

### PDF no tiene adjuntos

**Síntoma:** "No se encontraron PDFs en el correo"

**Causas:**
- El estado de cuenta está en el cuerpo del correo, no adjunto
- El adjunto no es PDF (puede ser imagen o link)

**Solución:** Verifica que el correo realmente tenga un PDF adjunto

### No extrae información del PDF

**Síntoma:** "No se encontró información de pago de contado"

**Diagnóstico:**
```javascript
// Ver texto extraído en logs:
LOG_LEVEL=debug
```

**Causas y Soluciones:**

#### 1. PDF es imagen escaneada
**Causa:** El PDF no tiene texto, es una imagen

**Identificar:**
- Abre el PDF
- Intenta seleccionar texto
- Si no puedes, es imagen

**Solución:** Actualmente no hay soporte para OCR (próximamente)

#### 2. Formato del banco diferente
**Causa:** Los patrones no coinciden con tu banco

**Solución:**
1. Revisa el texto en `logs/combined.log`
2. Busca manualmente el pago de contado
3. Edita `src/services/parserService.js`
4. Agrega tu patrón:

```javascript
pagoContado: [
  /pago\s+(?:de\s+)?contado[:\s]+(?:[$]|MXN|USD)?\s*([\d,]+\.?\d*)/gi,
  // Agrega tu patrón aquí:
  /tu\s+patrón\s+personalizado/gi,
],
```

#### 3. PDF encriptado/protegido
**Solución:** No hay soporte actual para PDFs protegidos

### Error al guardar archivos

**Síntoma:**
```
Error: EACCES: permission denied
```

**Causa:** Sin permisos en carpeta

**Solución:**
```bash
# Windows - ejecutar como administrador

# Mac/Linux - dar permisos:
chmod -R 755 downloads/
chmod -R 755 logs/
```

---

## Problemas de Performance

### Uso alto de CPU

**Causa:** Procesamiento de PDFs grandes

**Solución:**
```env
# Reducir frecuencia de revisión
CHECK_INTERVAL_MINUTES=15
```

### Uso alto de memoria

**Causa:** PDFs muy grandes en memoria

**Normal:** Temporal durante procesamiento

**Solución si persiste:**
- Cerrar otros programas
- Aumentar RAM del sistema
- Procesar PDFs de menor tamaño

### Sistema muy lento

**Diagnóstico:**
```bash
# Ver uso de recursos
# Windows:
taskmgr

# Mac:
Activity Monitor

# Linux:
top
```

**Soluciones:**
- Aumentar `CHECK_INTERVAL_MINUTES`
- Verificar que no haya múltiples instancias corriendo
- Reiniciar el sistema

---

## Herramientas de Diagnóstico

### 1. Verificar Configuración

```bash
npm run check
```

Verifica que todas las variables estén correctas.

### 2. Ver Logs Detallados

```bash
# Cambiar nivel de log
# En .env:
LOG_LEVEL=debug

# Ver logs en tiempo real (Windows):
Get-Content logs\combined.log -Wait

# Mac/Linux:
tail -f logs/combined.log
```

### 3. Probar Conexión IMAP Manualmente

Crea `test-imap.js`:

```javascript
import Imap from 'imap';

const imap = new Imap({
  user: 'tu_email@gmail.com',
  password: 'tu_password',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
});

imap.once('ready', () => {
  console.log('✅ Conexión exitosa!');
  imap.end();
});

imap.once('error', (err) => {
  console.error('❌ Error:', err.message);
});

imap.connect();
```

```bash
node test-imap.js
```

### 4. Probar Extracción de PDF

Crea `test-pdf.js`:

```javascript
import pdf from 'pdf-parse';
import { readFileSync } from 'fs';

const dataBuffer = readFileSync('ruta/a/tu/estado.pdf');

pdf(dataBuffer).then((data) => {
  console.log('Páginas:', data.numpages);
  console.log('Texto:', data.text.substring(0, 500));
});
```

```bash
node test-pdf.js
```

### 5. Ver Variables de Entorno Cargadas

Crea `test-env.js`:

```javascript
import dotenv from 'dotenv';
dotenv.config();

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('BANK_EMAIL_SENDER:', process.env.BANK_EMAIL_SENDER);
// NO imprimas EMAIL_PASSWORD por seguridad
```

```bash
node test-env.js
```

---

## Checklist de Diagnóstico

Cuando tengas un problema, sigue este orden:

- [ ] 1. ¿Node.js está instalado? `node --version`
- [ ] 2. ¿Dependencias instaladas? `npm install`
- [ ] 3. ¿Archivo `.env` existe y está completo? `npm run check`
- [ ] 4. ¿Hay errores en los logs? Revisar `logs/error.log`
- [ ] 5. ¿La conexión funciona? Verificar credenciales
- [ ] 6. ¿Los correos existen? Verificar bandeja
- [ ] 7. ¿El PDF tiene texto? Intentar seleccionar texto en el PDF

---

## Obtener Ayuda

Si ninguna solución funciona:

1. **Recopila información:**
   - Versión de Node.js: `node --version`
   - Sistema operativo
   - Contenido de `logs/error.log` (sin contraseñas)
   - Pasos exactos para reproducir

2. **Busca problemas similares:**
   - Revisa FAQ.md
   - Busca en GitHub Issues

3. **Crea un Issue:**
   - Incluye toda la información recopilada
   - Describe el problema claramente
   - Incluye logs relevantes (SIN contraseñas ni información sensible)

---

**¿El problema persiste?** Abre un issue en GitHub con:
- Descripción del problema
- Logs relevantes (sin info sensible)
- Sistema operativo y versión de Node.js
- Pasos para reproducir

