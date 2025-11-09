# 🚀 Inicio Rápido OAuth2

Si no tienes acceso a contraseñas de aplicación de Gmail, usa OAuth2. Esta guía te lleva paso a paso.

## ⏱️ Tiempo estimado: 10 minutos

---

## Paso 1: Obtener Credenciales (5 minutos)

1. Ve a: **https://console.cloud.google.com/**

2. Crea un proyecto nuevo:
   - Selector de proyectos → "NUEVO PROYECTO"
   - Nombre: "Bank Assistant"
   - Click "CREAR"

3. Habilita Gmail API:
   - Menú ☰ → "APIs y servicios" → "Biblioteca"
   - Busca "Gmail API"
   - Click "HABILITAR"

4. Configura pantalla de consentimiento:
   - "Pantalla de consentimiento de OAuth"
   - Tipo: **Externo** → "CREAR"
   - Nombre: "Bank Assistant"
   - Tu email en todos los campos requeridos
   - "GUARDAR Y CONTINUAR" (3 veces)
   - En "Usuarios de prueba": Agregar tu email
   - "VOLVER AL PANEL"

5. Crear credenciales:
   - "Credenciales" → "+ CREAR CREDENCIALES"
   - "ID de cliente de OAuth"
   - Tipo: **Aplicación de escritorio**
   - Nombre: "Bank Assistant Desktop"
   - "CREAR"
   - **COPIA** el Client ID y Client Secret

---

## Paso 2: Configurar el Proyecto (2 minutos)

1. Abre (o crea) el archivo `.env` en tu proyecto

2. Configura estas variables:

```env
# Tu email
EMAIL_USER=tu_email@gmail.com

# Habilitar OAuth2
USE_OAUTH2=true

# Credenciales (copiadas del paso anterior)
GMAIL_OAUTH2_CLIENT_ID=xxxxx.apps.googleusercontent.com
GMAIL_OAUTH2_CLIENT_SECRET=GOCSPX-xxxxx
GMAIL_OAUTH2_REDIRECT_URI=http://localhost

# Configuración de Gmail
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_TLS=true
EMAIL_FOLDER=INBOX

# Tu banco
BANK_EMAIL_SENDERS=banco@correo.com
EMAIL_SUBJECT_KEYWORDS=estado de cuenta

# Otras configuraciones
CHECK_INTERVAL_MINUTES=5
DOWNLOAD_FOLDER=./downloads
LOG_FOLDER=./logs
LOG_LEVEL=info
```

3. **Guarda el archivo**

---

## Paso 3: Autorizar la Aplicación (3 minutos)

1. En la terminal, ejecuta:

```bash
npm run setup-oauth
```

2. El script mostrará una URL muy larga, **cópiala y ábrela en el navegador**

3. Inicia sesión con tu Gmail

4. Google dirá: **"Esta app no está verificada"**
   - Es normal, es tu app personal
   - Click en "Configuración avanzada"
   - Click en "Ir a Bank Assistant (no seguro)"
   - Click en "Continuar" para autorizar

5. Google te dará un **código**
   - Cópialo
   - Pégalo en la terminal
   - Presiona Enter

6. Verás: **"✅ ¡OAuth2 configurado correctamente!"**

---

## Paso 4: ¡Listo! Ejecutar el Sistema

```bash
npm start
```

Deberías ver:

```
✅ Configuración validada correctamente
Usando autenticación OAuth2...
✅ Conexión IMAP establecida correctamente (OAuth2)
✅ Sistema iniciado correctamente
```

---

## 🎉 ¡Funcionando!

Tu aplicación ahora está conectada con OAuth2. Los tokens se renuevan automáticamente.

---

## ⚠️ Si algo sale mal

### Error: "Invalid grant"
```bash
# Vuelve a autorizar
rm gmail-token.json
npm run setup-oauth
```

### Error: "Configuración incompleta"
- Verifica que todas las variables en `.env` estén configuradas
- Especialmente: `USE_OAUTH2=true`

### Error: "redirect_uri_mismatch"
- En `.env`: `GMAIL_OAUTH2_REDIRECT_URI=http://localhost`
- Debe ser exactamente eso

---

## 📖 Documentación Completa

Para más detalles, problemas y soluciones, consulta:

**[OAUTH2_SETUP.md](./OAUTH2_SETUP.md)**

---

**¡Eso es todo!** 🚀

