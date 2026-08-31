export function avatarFallbackDataUrl(name = 'U') {
  const initial = String(name || 'U').trim().charAt(0).toUpperCase() || 'U';
  const safeInitial = initial
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="64" fill="#253553" />
      <text x="64" y="66" text-anchor="middle" dominant-baseline="middle"
        fill="#f8fafc" font-family="Arial, sans-serif" font-size="54" font-weight="700">${safeInitial}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function applyAvatarFallback(event, name) {
  const image = event.currentTarget;
  image.onerror = null;
  image.src = avatarFallbackDataUrl(name);
}
