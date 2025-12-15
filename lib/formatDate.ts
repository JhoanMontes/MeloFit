// src/utils/formatDate.ts

/**
 * Formatea fechas para evitar el error de zona horaria (día anterior).
 * Soporta strings de Supabase (YYYY-MM-DD) y objetos Date.
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '---'; // O lo que quieras mostrar si es null

  // CASO 1: Es un string (ej: desde Supabase)
  if (typeof date === 'string') {
    // Si incluye 'T' (ej: "2025-12-20T15:00:00"), es un timestamp completo.
    // Dejamos que JS lo convierta a tu hora local real.
    if (date.includes('T')) {
      return new Date(date).toLocaleDateString('es-CO'); // Ajusta 'es-CO' a tu local
    }
    
    // Si NO tiene 'T' (ej: "2025-12-20"), es una fecha pura de base de datos.
    // Usamos split para evitar que JS reste 5 horas y cambie el día.
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  // CASO 2: Es un objeto Date de JS (ej: de un DatePicker en el estado)
  if (date instanceof Date) {
    return date.toLocaleDateString('es-CO');
  }

  return String(date);
};