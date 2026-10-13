const normalizeUserSearch = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es')
  .trim()
  .replace(/\s+/g, ' ');
module.exports = { normalizeUserSearch };
