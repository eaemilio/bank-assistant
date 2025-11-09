# ⚡ Inicio Rápido

## 1️⃣ Instalar

```bash
npm install
```

## 2️⃣ Configurar

Crea un archivo `.env` con:

```env
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_aplicacion
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_TLS=true
EMAIL_FOLDER=INBOX
BANK_EMAIL_SENDER=notificaciones@banco.com
EMAIL_SUBJECT_KEYWORDS=estado de cuenta,tarjeta
CHECK_INTERVAL_MINUTES=5
DOWNLOAD_FOLDER=./downloads
LOG_FOLDER=./logs
LOG_LEVEL=info
```

## 3️⃣ Ejecutar

```bash
npm start
```

## 📋 Checklist Pre-ejecución

- [ ] Node.js 18+ instalado
- [ ] Gmail IMAP habilitado
- [ ] Contraseña de aplicación creada
- [ ] Archivo `.env` configurado
- [ ] Email del banco identificado

## 🔍 ¿Qué hace el sistema?

1. ✅ Conecta a tu correo cada X minutos
2. ✅ Busca correos no leídos del banco
3. ✅ Descarga PDFs adjuntos
4. ✅ Extrae el texto del PDF
5. ✅ Encuentra el pago de contado
6. ✅ Guarda los resultados
7. ✅ Marca el correo como leído

## 📁 ¿Dónde encuentro los resultados?

```
downloads/
├── 1234567890_estado_cuenta.pdf    ← PDF original
└── result_1234567890.json          ← Resultados procesados
```

## 🆘 Ayuda Rápida

### No se conecta
→ Revisa `EMAIL_USER`, `EMAIL_PASSWORD` y `EMAIL_HOST`

### No encuentra correos
→ Revisa `BANK_EMAIL_SENDER` y `EMAIL_SUBJECT_KEYWORDS`

### No extrae datos
→ Revisa `logs/combined.log` para ver el texto extraído

## 📚 Más información

- **Configuración detallada:** Ver `SETUP.md`
- **Documentación completa:** Ver `README.md`
- **Logs:** Carpeta `logs/`

