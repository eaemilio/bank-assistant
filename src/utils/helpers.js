/**
 * Funciones auxiliares para el procesamiento de datos
 */

/**
 * Formatear moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (MXN, USD, etc)
 * @returns {string} Cantidad formateada
 */
export function formatCurrency(amount, currency = 'MXN') {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'N/A';
  }

  const currencySymbols = {
    MXN: '$',
    USD: '$',
    GTQ: 'Q',
    EUR: '€',
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}

/**
 * Formatear fecha
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export function formatDate(date) {
  if (!date) return 'N/A';

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return date.toString();
  }
}

/**
 * Limpiar nombre de archivo
 * @param {string} filename - Nombre del archivo
 * @returns {string} Nombre limpio
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9_\-\.]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Verificar si una fecha está vencida
 * @param {string} dateString - Fecha en formato DD/MM/YYYY o similar
 * @returns {boolean} true si está vencida
 */
export function isDateExpired(dateString) {
  if (!dateString) return false;

  try {
    // Intentar parsear diferentes formatos de fecha
    const parts = dateString.split(/[\-\/]/);
    let date;

    if (parts.length === 3) {
      // Asumir DD/MM/YYYY o DD-MM-YYYY
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Meses en JS son 0-indexed
      const year = parseInt(parts[2]);
      date = new Date(year, month, day);
    } else {
      date = new Date(dateString);
    }

    return date < new Date();
  } catch (error) {
    return false;
  }
}

/**
 * Calcular días hasta fecha límite
 * @param {string} dateString - Fecha límite
 * @returns {number} Días restantes (negativo si ya pasó)
 */
export function daysUntil(dateString) {
  if (!dateString) return null;

  try {
    const parts = dateString.split(/[\-\/]/);
    let targetDate;

    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      targetDate = new Date(year, month, day);
    } else {
      targetDate = new Date(dateString);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    return null;
  }
}

/**
 * Extraer números de un texto
 * @param {string} text - Texto a procesar
 * @returns {Array<number>} Array de números encontrados
 */
export function extractNumbers(text) {
  if (!text) return [];

  const matches = text.match(/\d+(?:\.\d+)?/g);
  return matches ? matches.map(n => parseFloat(n)) : [];
}

/**
 * Normalizar texto para búsqueda
 * @param {string} text - Texto a normalizar
 * @returns {string} Texto normalizado
 */
export function normalizeText(text) {
  if (!text) return '';

  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .trim();
}

/**
 * Parsear fecha con meses en español o formato numérico
 * Convierte fechas con meses abreviados en español a objetos Date válidos
 * Soporta formatos como: 
 *   - "15-DIC-2024", "15 DIC 2024", "15/DIC/2024" (meses en español)
 *   - "15/12/2024", "15-12-2024" (formato numérico DD/MM/YYYY)
 *   - "2024-12-15" (formato ISO YYYY-MM-DD)
 * 
 * @param {string} dateString - Fecha a parsear
 * @returns {Date|null} Objeto Date o null si no se puede parsear
 */
export function parseSpanishDate(dateString) {
  if (!dateString) return null;

  // Mapeo de meses en español a números (0-11 para JavaScript Date)
  const spanishMonths = {
    'ENE': 0, 'ENERO': 0,
    'FEB': 1, 'FEBRERO': 1,
    'MAR': 2, 'MARZO': 2,
    'ABR': 3, 'ABRIL': 3,
    'MAY': 4, 'MAYO': 4,
    'JUN': 5, 'JUNIO': 5,
    'JUL': 6, 'JULIO': 6,
    'AGO': 7, 'AGOSTO': 7,
    'SEP': 8, 'SEPT': 8, 'SEPTIEMBRE': 8,
    'OCT': 9, 'OCTUBRE': 9,
    'NOV': 10, 'NOVIEMBRE': 10,
    'DIC': 11, 'DICIEMBRE': 11,
  };

  try {
    // Limpiar y normalizar la fecha
    const cleanDate = dateString.trim().toUpperCase();
    
    // Patrón 1: Fecha con mes en español (DD-MES-YYYY o DD/MES/YYYY o DD MES YYYY)
    const spanishPattern = /(\d{1,2})[\s\-\/]([A-Z]{3,10})[\s\-\/](\d{4})/;
    const spanishMatch = cleanDate.match(spanishPattern);

    if (spanishMatch) {
      const day = parseInt(spanishMatch[1]);
      const monthStr = spanishMatch[2];
      const year = parseInt(spanishMatch[3]);

      // Buscar el mes en el mapeo
      const month = spanishMonths[monthStr];

      if (month !== undefined && !isNaN(day) && !isNaN(year)) {
        const date = new Date(year, month, day);
        
        // Validar que la fecha sea válida
        if (date.getFullYear() === year && 
            date.getMonth() === month && 
            date.getDate() === day) {
          return date;
        }
      }
    }

    // Patrón 2: Fecha numérica DD/MM/YYYY o DD-MM-YYYY
    const numericPattern = /(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})/;
    const numericMatch = cleanDate.match(numericPattern);

    if (numericMatch) {
      const day = parseInt(numericMatch[1]);
      const month = parseInt(numericMatch[2]) - 1; // JavaScript usa 0-11 para meses
      const year = parseInt(numericMatch[3]);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month, day);
        
        // Validar que la fecha sea válida
        if (date.getFullYear() === year && 
            date.getMonth() === month && 
            date.getDate() === day) {
          return date;
        }
      }
    }

    // Patrón 3: Formato ISO (YYYY-MM-DD)
    const isoPattern = /(\d{4})-(\d{1,2})-(\d{1,2})/;
    const isoMatch = cleanDate.match(isoPattern);

    if (isoMatch) {
      const year = parseInt(isoMatch[1]);
      const month = parseInt(isoMatch[2]) - 1;
      const day = parseInt(isoMatch[3]);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month, day);
        
        // Validar que la fecha sea válida
        if (date.getFullYear() === year && 
            date.getMonth() === month && 
            date.getDate() === day) {
          return date;
        }
      }
    }

    // Si ningún patrón coincide, intentar parseo estándar de JavaScript
    const standardDate = new Date(dateString);
    if (!isNaN(standardDate.getTime())) {
      return standardDate;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Formatear fecha española a formato ISO (YYYY-MM-DD)
 * @param {string} dateString - Fecha con mes en español
 * @returns {string|null} Fecha en formato ISO o null
 */
export function formatSpanishDateToISO(dateString) {
  const date = parseSpanishDate(dateString);
  if (!date) return null;
  
  return date.toISOString().split('T')[0]; // Retorna solo YYYY-MM-DD
}

/**
 * Formatear fecha española a formato legible
 * @param {string} dateString - Fecha con mes en español
 * @returns {string|null} Fecha formateada o null
 */
export function formatSpanishDate(dateString) {
  const date = parseSpanishDate(dateString);
  if (!date) return null;
  
  return date.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

