# 🗂️ Configuración de Notion

Esta guía te ayudará a configurar la integración con Notion para guardar automáticamente la información de tus estados de cuenta.

## 📋 Requisitos Previos

- Una cuenta de Notion
- Acceso para crear integraciones en tu workspace

## 🚀 Pasos para Configurar

### 1. Crear una Integración en Notion

1. Ve a [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Haz clic en **"+ New integration"**
3. Dale un nombre a tu integración (ej: "Bank Statement Automation")
4. Selecciona el workspace donde quieres usar la integración
5. Configura los permisos:
   - ✅ **Read content**
   - ✅ **Insert content**
   - ✅ **Update content**
6. Haz clic en **"Submit"**
7. Copia el **"Internal Integration Token"** (empieza con `secret_...`)

### 2. Crear la Base de Datos en Notion

1. Abre Notion y crea una nueva página
2. Crea una **Database (Table)** en la página
3. Configura las siguientes columnas (propiedades):

   | Nombre de Columna | Tipo de Propiedad | Descripción |
   |-------------------|-------------------|-------------|
   | **Name** | Title | Campo obligatorio (título de cada entrada) |
   | **Payment Date** | Date | Fecha del pago |
   | **Payment Amount USD** | Number | Monto en dólares |
   | **Payment Amount GTQ** | Number | Monto en quetzales |
   | **Card** | Text | Últimos 4 dígitos de la tarjeta |

4. Los nombres de las columnas deben ser **exactamente** como se muestran arriba (incluyendo mayúsculas y espacios)

### 3. Obtener el ID de la Base de Datos

1. Abre la base de datos en Notion (vista completa de página)
2. Copia la URL de tu navegador. Se verá así:
   ```
   https://www.notion.so/[workspace]/[DATABASE_ID]?v=[VIEW_ID]
   ```
3. El `DATABASE_ID` es la parte entre el nombre del workspace y el `?v=`
4. Ejemplo:
   ```
   https://www.notion.so/miworkspace/a1b2c3d4e5f6789012345678?v=12345
                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                    Este es tu DATABASE_ID
   ```

### 4. Compartir la Base de Datos con tu Integración

⚠️ **IMPORTANTE:** Este paso es crucial para que la integración funcione.

1. Abre la página que contiene tu base de datos en Notion
2. Haz clic en los tres puntos **"..."** en la esquina superior derecha
3. Busca la opción **"Add connections"** o **"Connections"**
4. Busca y selecciona tu integración ("Bank Statement Automation")
5. Confirma que quieres dar acceso

### 5. Configurar las Variables de Entorno

1. Abre tu archivo `.env` (o créalo si no existe copiando `config.example.env`)
2. Agrega o actualiza estas líneas:

```env
# Configuración de Notion
NOTION_API_KEY=secret_tu_api_key_aqui
NOTION_DATABASE_ID=tu_database_id_aqui
```

3. Reemplaza:
   - `secret_tu_api_key_aqui` con el token que copiaste en el paso 1
   - `tu_database_id_aqui` con el ID que obtuviste en el paso 3

### 6. Probar la Conexión

Ejecuta el script de prueba para verificar que todo esté configurado correctamente:

```bash
npm run test:notion
```

Si todo está bien configurado, deberías ver:
```
✅ Conexión exitosa con la base de datos: "Nombre de tu DB"
   Propiedades disponibles: Nombre, Fecha de Pago, Pago Contado USD, Pago Contado GTQ, Tarjeta
```

## 🔍 Verificación

La aplicación ahora:
1. ✅ Detectará correos con estados de cuenta
2. ✅ Extraerá y procesará los PDFs
3. ✅ Guardará los datos en un archivo JSON (como antes)
4. ✅ **NUEVO:** Guardará automáticamente en Notion:
   - Fecha de pago
   - Pago Contado USD
   - Pago Contado GTQ
   - Últimos 4 dígitos de la tarjeta

## ⚠️ Solución de Problemas

### Error: "object_not_found"
- **Problema:** La base de datos no existe o la integración no tiene acceso
- **Solución:** Verifica que hayas compartido la base de datos con tu integración (Paso 4)

### Error: "unauthorized"
- **Problema:** API key inválida o sin permisos
- **Solución:** Verifica que el token sea correcto y tenga los permisos necesarios

### Error: "validation_error" - Propiedad no encontrada
- **Problema:** Los nombres de las columnas no coinciden
- **Solución:** Verifica que los nombres de las propiedades en Notion sean exactamente como se especifica (mayúsculas, espacios, acentos)

### Notion no está guardando nada
1. Verifica que las variables de entorno estén configuradas correctamente
2. Revisa los logs de la aplicación para ver mensajes de error específicos
3. Asegúrate de que `statementInfo.found` sea `true` (debe encontrar información en el PDF)

## 📊 Vista de la Base de Datos en Notion

Después de procesar algunos estados de cuenta, tu base de datos en Notion se verá así:

| Nombre | Fecha de Pago | Pago Contado USD | Pago Contado GTQ | Tarjeta |
|--------|---------------|------------------|------------------|---------|
| Pago 16/10/2024 - ****1234 | 16/10/2024 | $500.00 | Q3,850.00 | ****1234 |
| Pago 16/09/2024 - ****5678 | 16/09/2024 | $320.50 | Q2,465.85 | ****5678 |

## 🎨 Personalización

Puedes personalizar tu base de datos de Notion agregando:
- Vistas filtradas por fechas o montos
- Fórmulas para conversiones de moneda
- Gráficos y tableros (dashboards)
- Propiedades adicionales como notas o categorías

## 🔗 Enlaces Útiles

- [Documentación oficial de Notion API](https://developers.notion.com/)
- [Guía de integraciones de Notion](https://www.notion.so/help/add-and-manage-integrations-with-the-api)
- [SDK de Notion para JavaScript](https://github.com/makenotion/notion-sdk-js)

## 💡 Consejos

1. **Respaldos:** Notion guarda automáticamente el historial de cambios
2. **Acceso compartido:** Puedes compartir la base de datos con otros usuarios de tu workspace
3. **Automatizaciones:** Notion permite crear automatizaciones adicionales con los datos guardados
4. **Exportación:** Puedes exportar los datos de Notion a CSV/Excel en cualquier momento

