# 🔐 Guía de Configuración OAuth2 para Gmail

Esta guía te ayudará a configurar OAuth2 para acceder a Gmail sin necesidad de contraseñas de aplicación.

---

## 📋 Pasos de Configuración

### Paso 1: Crear un Proyecto en Google Cloud Console

1. Ve a: **https://console.cloud.google.com/**

2. Inicia sesión con tu cuenta de Gmail

3. Click en el selector de proyectos (parte superior izquierda, al lado de "Google Cloud")

4. Click en **"NUEVO PROYECTO"**

5. Configura el proyecto:
   - **Nombre:** "Bank Assistant" (o el nombre que prefieras)
   - **Organización:** Déjala como está
   - Click en **"CREAR"**

6. Espera a que se cree el proyecto (aparecerá una notificación)

7. Selecciona el proyecto recién creado desde el selector de proyectos

---

### Paso 2: Habilitar la API de Gmail

1. En el menú de navegación (☰), ve a: **"APIs y servicios" → "Biblioteca"**

2. En el buscador, escribe: **"Gmail API"**

3. Click en **"Gmail API"**

4. Click en el botón **"HABILITAR"**

5. Espera a que se habilite la API

---

### Paso 3: Configurar Pantalla de Consentimiento OAuth

1. En el menú lateral, ve a: **"Pantalla de consentimiento de OAuth"**

2. Selecciona el tipo de usuario:
   - **Externo** (para cuentas personales de Gmail)
   - Click en **"CREAR"**

3. **Página 1: Información de la aplicación**
   ```
   Nombre de la aplicación: Bank Assistant
   Correo del usuario: tu_email@gmail.com
   ```
   - Deja los demás campos vacíos por ahora
   - Click en **"GUARDAR Y CONTINUAR"**

4. **Página 2: Permisos**
   - Click en **"AGREGAR O QUITAR PERMISOS"**
   - En el filtro, busca: **"Gmail API"**
   - Selecciona el permiso:
     - ✅ `https://mail.google.com/` (Acceso completo a Gmail)
   - Click en **"ACTUALIZAR"**
   - Click en **"GUARDAR Y CONTINUAR"**

5. **Página 3: Usuarios de prueba**
   - Click en **"+ AGREGAR USUARIOS"**
   - Escribe tu email: `tu_email@gmail.com`
   - Click en **"AGREGAR"**
   - Click en **"GUARDAR Y CONTINUAR"**

6. **Página 4: Resumen**
   - Revisa la información
   - Click en **"VOLVER AL PANEL"**

---

### Paso 4: Crear Credenciales OAuth 2.0

1. En el menú lateral, ve a: **"Credenciales"**

2. Click en **"+ CREAR CREDENCIALES"** (parte superior)

3. Selecciona: **"ID de cliente de OAuth"**

4. Configura las credenciales:
   ```
   Tipo de aplicación: Aplicación de escritorio
   Nombre: Bank Assistant Desktop
   ```

5. Click en **"CREAR"**

6. Aparecerá un diálogo con tus credenciales:
   - **ID de cliente:** `xxxxx.apps.googleusercontent.com`
   - **Secreto del cliente:** `GOCSPX-xxxxx`
   
7. **¡IMPORTANTE!** Copia estos valores, los necesitarás en el siguiente paso

---

### Paso 5: Configurar el Archivo .env

1. Abre tu archivo `.env` (o crea uno desde `config.example.env`)

2. Configura las siguientes variables:

```env
# Tu correo de Gmail
EMAIL_USER=tu_email@gmail.com

# Habilitar OAuth2
USE_OAUTH2=true

# Credenciales de OAuth2 (copiadas del paso anterior)
GMAIL_OAUTH2_CLIENT_ID=xxxxx.apps.googleusercontent.com
GMAIL_OAUTH2_CLIENT_SECRET=GOCSPX-xxxxx
GMAIL_OAUTH2_REDIRECT_URI=http://localhost

# NO necesitas EMAIL_PASSWORD con OAuth2
# EMAIL_PASSWORD=(déjalo comentado o eliminado)

# Resto de la configuración (mantén tus valores actuales)
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_TLS=true
EMAIL_FOLDER=INBOX

BANK_EMAIL_SENDERS=tu_banco@banco.com
EMAIL_SUBJECT_KEYWORDS=estado de cuenta

CHECK_INTERVAL_MINUTES=5
DOWNLOAD_FOLDER=./downloads
LOG_FOLDER=./logs
LOG_LEVEL=info

# Configuración de Notion (si la usas)
NOTION_API_KEY=tu_notion_api_key
NOTION_DATABASE_ID=tu_notion_database_id
```

3. **Guarda el archivo**

---

### Paso 6: Autorizar la Aplicación

1. Abre la terminal en la carpeta del proyecto

2. Ejecuta el script de configuración:

```bash
npm run setup-oauth
```

3. El script te mostrará:
   - Una **URL de autorización** muy larga
   - Instrucciones para continuar

4. **Copia la URL completa** y pégala en tu navegador

5. Inicia sesión con tu cuenta de Gmail (si no lo estás)

6. Google te mostrará una advertencia:
   ```
   "Esta app no está verificada"
   ```
   - Esto es **normal** porque es tu propia aplicación
   - Click en **"Configuración avanzada"** o **"Advanced"**
   - Click en **"Ir a Bank Assistant (no seguro)"** o **"Go to Bank Assistant (unsafe)"**

7. Autoriza los permisos:
   - ✅ "Ver, redactar, enviar y eliminar permanentemente todos tus correos de Gmail"
   - Click en **"Continuar"** o **"Allow"**

8. Google te mostrará un **código de autorización**:
   ```
   4/0AanRRrvxxxxxxxxxxxxxxxxxxxxxxx
   ```
   - **Copia este código**

9. Vuelve a la terminal y pega el código cuando te lo pida

10. Si todo sale bien, verás:
    ```
    ✅ ¡OAuth2 configurado correctamente!
    Los tokens se han guardado en: gmail-token.json
    ```

---

### Paso 7: Probar la Conexión

1. Ejecuta el sistema:

```bash
npm start
```

2. Deberías ver:

```
🏦 Sistema de Automatización de Estados de Cuenta Bancarios
✅ Configuración validada correctamente
📧 Monitoreando: tu_email@gmail.com
🏦 Banco: tu_banco@banco.com
Usando autenticación OAuth2...
✅ Conexión IMAP establecida correctamente (OAuth2)
✅ Sistema iniciado correctamente
```

3. **¡Listo!** Tu sistema ahora usa OAuth2

---

## 🔒 Seguridad

### Archivos Sensibles

El archivo `gmail-token.json` contiene tokens de acceso a tu cuenta de Gmail:

- ⚠️ **NUNCA** lo compartas
- ⚠️ **NUNCA** lo subas a Git/GitHub
- ⚠️ Guárdalo de forma segura
- ✅ Ya está incluido en `.gitignore`

### Revocar Acceso

Si necesitas revocar el acceso en el futuro:

1. Ve a: https://myaccount.google.com/permissions
2. Busca "Bank Assistant"
3. Click en **"Quitar acceso"**
4. Elimina el archivo `gmail-token.json`

---

## 🔄 Renovación Automática

Los tokens OAuth2 expiran cada hora, pero el sistema los renueva **automáticamente**:

- ✅ No necesitas hacer nada manualmente
- ✅ El sistema usa el **refresh token** para obtener nuevos tokens
- ✅ Funciona indefinidamente mientras no revokes el acceso

---

## ⚠️ Problemas Comunes

### Error: "Invalid grant" o "Token has been expired or revoked"

**Causa:** Los tokens han expirado o fueron revocados

**Solución:**
1. Elimina el archivo `gmail-token.json`
2. Ejecuta de nuevo: `npm run setup-oauth`
3. Vuelve a autorizar la aplicación

### Error: "redirect_uri_mismatch"

**Causa:** El redirect URI no coincide con el configurado en Google Cloud

**Solución:**
1. Verifica que en tu `.env` tengas:
   ```
   GMAIL_OAUTH2_REDIRECT_URI=http://localhost
   ```
2. En Google Cloud Console → Credenciales → Edita tu OAuth Client
3. En "URIs de redireccionamiento autorizados", asegúrate de tener:
   - `http://localhost`

### Error: "Access blocked: This app's request is invalid"

**Causa:** Falta habilitar la Gmail API o configurar la pantalla de consentimiento

**Solución:**
- Repite el **Paso 2** y **Paso 3** de esta guía
- Asegúrate de haber agregado tu email como usuario de prueba

### Error: "The user has not granted your app permission"

**Causa:** No autorizaste los permisos correctamente

**Solución:**
1. Ve a: https://myaccount.google.com/permissions
2. Revoca el acceso si existe
3. Ejecuta de nuevo: `npm run setup-oauth`
4. Asegúrate de hacer click en "Permitir" en todos los permisos

---

## 🆘 ¿Necesitas Ayuda?

Si sigues teniendo problemas:

1. **Verifica los logs:**
   ```bash
   cat logs/combined.log
   ```

2. **Modo debug:**
   En tu `.env`, cambia:
   ```env
   LOG_LEVEL=debug
   ```

3. **Revisa la configuración:**
   ```bash
   npm run check
   ```

4. **Vuelve a intentar:**
   - Elimina `gmail-token.json`
   - Ejecuta `npm run setup-oauth`

---

## 📚 Recursos Adicionales

- [Documentación OAuth2 de Google](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Google Cloud Console](https://console.cloud.google.com/)

---

¡Listo! Ahora tu aplicación usa OAuth2 de forma segura y sin restricciones. 🎉

