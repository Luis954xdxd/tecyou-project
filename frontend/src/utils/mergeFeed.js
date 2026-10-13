export function mergeFeed(recognitions, challenges, sortBy = 'recent') {
  const entries = [...recognitions.map(item => ({ type: 'recognition', item })), ...challenges.map(item => ({ type: 'institutional', item }))];
  return entries.sort((a, b) => {
    if (sortBy === 'az') return (a.item.sender_name || a.item.creator_name || '').localeCompare(b.item.sender_name || b.item.creator_name || '', 'es');
    if (sortBy === 'category') return (a.item.category || 'Institucional').localeCompare(b.item.category || 'Institucional', 'es');
    const difference = (Date.parse(b.item.created_at) || 0) - (Date.parse(a.item.created_at) || 0);
    const order = difference || (a.type === b.type ? Number(b.item.id) - Number(a.item.id) : a.type.localeCompare(b.type));
    return sortBy === 'oldest' ? -order : order;
  });
}
