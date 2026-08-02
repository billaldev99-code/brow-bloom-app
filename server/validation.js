export const validateName = (value, { required = true, min = 2, max = 50, label = 'Nom' } = {}) => {
  const v = (value ?? '').toString().trim();
  if (required && !v) return `${label} est requis`;
  if (!v) return null;
  if (v.length < min) return `${label} doit contenir au moins ${min} caractères`;
  if (v.length > max) return `${label} ne peut pas dépasser ${max} caractères`;
  return null;
};

export const validatePhone = (value, { required = true, label = 'Téléphone' } = {}) => {
  const v = (value ?? '').toString().trim();
  if (required && !v) return `${label} est requis`;
  if (!v) return null;
  if (!/^\+?[0-9][0-9\s.-]{5,19}$/.test(v)) return `${label} invalide`;
  return null;
};

export const validateEmail = (value, { required = false, max = 120, label = 'Email' } = {}) => {
  const v = (value ?? '').toString().trim();
  if (required && !v) return `${label} est requis`;
  if (!v) return null;
  if (v.length > max) return `${label} ne peut pas dépasser ${max} caractères`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return `${label} invalide`;
  return null;
};

export const validateMessage = (value, { required = false, max = 1000, label = 'Message' } = {}) => {
  const v = (value ?? '').toString().trim();
  if (required && !v) return `${label} est requis`;
  if (!v) return null;
  if (v.length > max) return `${label} ne peut pas dépasser ${max} caractères`;
  return null;
};

export const firstError = (results) => results.find(Boolean) || null;

export const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};
