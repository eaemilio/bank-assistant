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

