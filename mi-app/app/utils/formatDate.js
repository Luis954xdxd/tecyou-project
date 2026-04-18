// utils/formatDate.js

/**
 * Convierte una fecha a formato relativo tipo:
 * Hace 2 min, Hace 3 h, Hace 1 d, etc.
 */
export const formatRelativeDate = (dateString) => {
  if (!dateString) return '';

  const now = new Date();
  const date = new Date(dateString);

  const diffMs = now - date;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Hace unos segundos';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours} h`;
  if (days < 7) return `Hace ${days} d`;

  // Si es más viejo, muestra fecha normal
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};