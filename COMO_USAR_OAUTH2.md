# 🎯 Cómo Usar OAuth2 - Resumen Ejecutivo

## ✅ ¿Qué se implementó?

Tu proyecto ahora soporta **OAuth2** para conectarse a Gmail sin necesidad de contraseñas de aplicación.

---

## 🚀 Pasos para Empezar (Resumen)

### 1️⃣ Obtener Credenciales OAuth2 (10 minutos)

Ve a **https://console.cloud.google.com/** y:

1. Crea un proyecto llamado "Bank Assistant"
2. Habilita la "Gmail API"
3. Configura la pantalla de consentimiento OAuth
4. Crea credenciales OAuth 2.0 (tipo: Aplicación de escritorio)
5. Copia el **Client ID** y **Client Secret**

**📖 Guía detallada:** [OAUTH2_QUICKSTART.md](./OAUTH2_QUICKSTART.md)

---

### 2️⃣ Configurar tu archivo `yeyi.env`

Abre tu archivo `yeyi.env` y completa estas líneas:

```env
# Habilitar OAuth2
USE_OAUTH2=true

# Pega aquí las credenciales de Google Cloud Console
GMAIL_OAUTH2_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
GMAIL_OAUTH2_CLIENT_SECRET=GOCSPX-tu_secret_aqui
GMAIL_OAUTH2_REDIRECT_URI=http://localhost
```

**⚠️ Importante:** Deja comentada o elimina la línea `EMAIL_PASSWORD` cuando uses OAuth2.

---

### 3️⃣ Autorizar la Aplicación

En la terminal, ejecuta:

```bash
npm run setup-oauth
```

Sigue las instrucciones:
1. Abre la URL en tu navegador
2. Autoriza la aplicación (ignora la advertencia "app no verificada")
3. Copia el código y pégalo en la terminal

---

### 4️⃣ ¡Listo! Ejecutar

```bash
npm start
```

---

## 📂 Archivos Nuevos Creados

| Archivo | Descripción |
|---------|-------------|
| `OAUTH2_QUICKSTART.md` | Guía rápida de 10 minutos |
| `OAUTH2_SETUP.md` | Documentación completa y troubleshooting |
| `src/services/gmailOAuth2Service.js` | Servicio de autenticación OAuth2 |
| `src/setup-oauth.js` | Script interactivo para autorizar |
| `gmail-token.json` | Tokens guardados (se crea automáticamente) |

---

## 🔄 Dos Opciones de Autenticación

Tu proyecto ahora soporta **dos métodos**:

### Método 1: Contraseña de Aplicación (tradicional)

```env
USE_OAUTH2=false
EMAIL_PASSWORD=tu_contraseña_app
```

### Método 2: OAuth2 (recomendado si no tienes acceso)

```env
USE_OAUTH2=true
GMAIL_OAUTH2_CLIENT_ID=xxxxx
GMAIL_OAUTH2_CLIENT_SECRET=xxxxx
```

---

## 🆘 Si Tienes Problemas

### "Configuración incompleta"
- Verifica que `USE_OAUTH2=true` esté en tu `.env`
- Asegúrate de haber completado `GMAIL_OAUTH2_CLIENT_ID` y `GMAIL_OAUTH2_CLIENT_SECRET`

### "Invalid grant" o "Token expired"
```bash
rm gmail-token.json
npm run setup-oauth
```

### "redirect_uri_mismatch"
- En tu `.env`: `GMAIL_OAUTH2_REDIRECT_URI=http://localhost`

### Más ayuda:
**📖 [OAUTH2_SETUP.md](./OAUTH2_SETUP.md)** - Documentación completa con soluciones

---

## 🔒 Seguridad

- ✅ El archivo `gmail-token.json` está protegido en `.gitignore`
- ✅ Los tokens se renuevan automáticamente
- ✅ Puedes revocar el acceso en: https://myaccount.google.com/permissions

---

## 📋 Comandos Útiles

```bash
# Configurar OAuth2 por primera vez
npm run setup-oauth

# Ejecutar el sistema
npm start

# Verificar configuración
npm run check

# Ver logs detallados
# En .env: LOG_LEVEL=debug
```

---

## ✨ ¡Eso es Todo!

Ahora tu aplicación puede conectarse a Gmail usando OAuth2, sin restricciones de contraseñas de aplicación.

**Siguiente paso:** Sigue la guía [OAUTH2_QUICKSTART.md](./OAUTH2_QUICKSTART.md)

