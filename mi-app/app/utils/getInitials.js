// utils/getInitials.js

export const getInitials = (name) => {
  if (!name) return '';

  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
};

export const resolveImageUrl = (imageUrl, apiBase) => {
  if (!imageUrl) return null;

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  if (!apiBase) return imageUrl;

  return `${apiBase}${imageUrl}`;
};