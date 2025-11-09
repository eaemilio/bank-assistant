# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.1.0] - 2025-11-06

### 🗂️ Integración con Notion

**Nueva funcionalidad para guardar datos automáticamente en Notion**

### Agregado
- ✨ **Servicio de Notion** (`NotionService.js`):
  - Integración completa con la API de Notion
  - Guardado automático de información de pagos
  - Formato y validación de datos
  - Manejo robusto de errores
- 📊 **Datos guardados en Notion:**
  - 📅 Fecha de pago
  - 💵 Pago Contado USD
  - 💰 Pago Contado GTQ
  - 💳 Últimos 4 dígitos de tarjeta
- 🧪 **Script de prueba** (`test-notion.js`):
  - Verificación de conexión con Notion
  - Validación de permisos y configuración
  - Creación de entrada de prueba
  - Comando: `npm run test:notion`
- 📖 **Documentación completa**:
  - `NOTION_SETUP.md` - Guía paso a paso para configurar Notion
  - Actualización del README con instrucciones
  - Variables de entorno en `config.example.env`
- 🔧 **Configuración**:
  - Nuevas variables de entorno: `NOTION_API_KEY` y `NOTION_DATABASE_ID`
  - Integración opcional (no afecta el funcionamiento si no está configurada)

### Mejorado
- 🔄 Flujo principal actualizado para incluir guardado en Notion
- 📝 Logs más descriptivos para operaciones de Notion
- ⚠️ Manejo de errores que no interrumpe el proceso principal
- 📦 Dependencia agregada: `@notionhq/client`

### Técnico
- El servicio verifica automáticamente si Notion está configurado
- El guardado en Notion no bloquea el procesamiento de correos
- Formateo automático de fechas para compatibilidad con Notion
- Validación de propiedades antes de enviar a Notion

## [1.0.1] - 2024-11-06

### 🎨 Refactorización Arquitectónica Mayor

**Implementación del [Abstract Factory Pattern](https://refactoring.guru/design-patterns/abstract-factory)**

- 🏗️ **Arquitectura completamente refactorizada** usando Abstract Factory
- 📦 Nueva estructura modular en `src/parsers/`:
  - `BankParser.js` - Abstract Product (clase base)
  - `BankParserFactory.js` - Abstract Factory
  - `PromericaParser.js` - Concrete Product para Promerica
  - `GenericParser.js` - Concrete Product genérico
- 🎯 **Principios SOLID aplicados:**
  - Single Responsibility: Cada parser maneja un banco
  - Open/Closed: Extensible sin modificar código existente
  - Liskov Substitution: Todos los parsers son intercambiables
  - Interface Segregation: Interfaces limpias y necesarias
  - Dependency Inversion: Dependencias de abstracciones

### Agregado
- ✨ Soporte para moneda GTQ (Quetzales guatemaltecos)
- 📄 Ejemplos de configuración para bancos guatemaltecos:
  - Banco Promerica ✅ (totalmente soportado con parser específico)
  - Banco Industrial (planeado)
  - BAM (Banco Agromercantil) (planeado)
- 🔍 Patrones de detección mejorados para identificar Q, Q., GTQ y "Quetzal(es)"
- 📋 **Estrategia específica para Banco Promerica:**
  - Busca "Pagos de Capital" en el texto
  - Extrae ambos montos (GTQ y USD) de la misma línea
  - Maneja el formato desordenado del PDF de Promerica
- 📚 **Nueva documentación:**
  - `BANKS.md` - Guía completa para agregar bancos
  - `ARCHITECTURE_FACTORY.md` - Documentación detallada del patrón implementado
- 🔧 **Registro dinámico de parsers:** Permite agregar bancos en runtime
- 📊 **Mejor logging:** Mensajes más claros y estructurados

### Cambiado
- 🎯 Parser simplificado: solo extrae tarjeta, fecha de pago y montos de contado
- 📊 Resumen mejorado con detección de banco y formato de números mejorado
- 🏭 **ParserService ahora usa la Factory** (cliente del patrón)
- 📦 **Código más limpio y mantenible** - eliminado código duplicado y if-else anidados

### Ventajas de la Nueva Arquitectura
- ✅ Agregar nuevos bancos: 1 archivo + 1 línea
- ✅ Testing independiente por banco
- ✅ Cero acoplamiento entre parsers
- ✅ Escalable a cientos de bancos
- ✅ Código profesional y mantenible

### Corregido
- 🐛 Bug de sincronización asíncrona en emailService que causaba que los correos no se procesaran correctamente

### Técnico
- **Patrón:** Abstract Factory
- **Inspiración:** [Refactoring.Guru](https://refactoring.guru/design-patterns/abstract-factory)
- **Principios:** SOLID
- **Líneas refactorizadas:** ~200
- **Archivos nuevos:** 4
- **Complejidad reducida:** ~40%

## [1.0.0] - 2024-11-06

### Agregado
- ✨ Sistema completo de automatización de estados de cuenta bancarios
- 📧 Monitoreo automático de correos electrónicos vía IMAP
- 📎 Extracción de archivos PDF adjuntos
- 🔍 Análisis inteligente de texto extraído de PDFs
- 💰 Detección automática de:
  - Pago de contado
  - Pago mínimo
  - Saldo total
  - Fecha límite de pago
  - Número de cuenta
  - Período del estado de cuenta
- 💾 Guardado automático de PDFs y resultados en JSON
- 📊 Sistema de logging con Winston
- ⏱️ Ejecución programada con cron
- 🛠️ Configuración mediante variables de entorno
- 📚 Documentación completa:
  - README.md con documentación detallada
  - SETUP.md con guía de configuración paso a paso
  - QUICKSTART.md con inicio rápido
  - EJEMPLOS.md con ejemplos de configuración
- 🧪 Script de verificación de configuración
- 🎨 Formato de código con Prettier
- ✅ Configuración de ESLint

### Características
- Soporte para múltiples proveedores de correo (Gmail, Outlook, Yahoo)
- Soporte para múltiples bancos mexicanos
- Detección inteligente de moneda (MXN, USD)
- Patrones de búsqueda flexibles y personalizables
- Manejo de errores robusto
- Logs detallados para debugging

### Dependencias
- imap ^0.8.19 - Conexión a servidores de correo
- mailparser ^3.7.1 - Parseo de correos electrónicos
- pdf-parse ^1.1.1 - Extracción de texto de PDFs
- dotenv ^16.4.5 - Gestión de variables de entorno
- winston ^3.14.2 - Sistema de logging
- node-cron ^3.0.3 - Programación de tareas

## [Próximamente]

### Planeado
- [ ] Soporte para OCR en PDFs escaneados
- [ ] Notificaciones por email/SMS cuando llegue un nuevo estado
- [ ] Base de datos para historial de pagos
- [ ] Dashboard web para visualizar estadísticas
- [ ] Soporte para múltiples cuentas/bancos simultáneos
- [ ] Integración con APIs de pago
- [ ] Recordatorios automáticos de fechas de pago
- [ ] Exportación de datos a Excel/CSV
- [ ] API REST para integración con otros sistemas
- [ ] Detección de transacciones sospechosas
- [ ] Análisis de patrones de gasto
- [ ] Gráficas de evolución de saldos

