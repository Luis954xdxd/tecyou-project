const clients = new Map();
const presence = new Map();

const toKey = (userId) => String(userId);

const sendToResponse = (res, event, payload) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

const broadcast = (event, payload) => {
  clients.forEach((set) => {
    set.forEach((res) => sendToResponse(res, event, payload));
  });
};

const sendToUser = (userId, event, payload) => {
  const set = clients.get(toKey(userId));
  if (!set) return;
  set.forEach((res) => sendToResponse(res, event, payload));
};

const getPresenceSnapshot = () =>
  Array.from(presence.entries()).map(([userId, item]) => ({
    userId: Number(userId),
    online: item.count > 0,
    lastSeen: item.lastSeen,
  }));

const connectUser = (userId, res) => {
  const key = toKey(userId);
  if (!clients.has(key)) clients.set(key, new Set());
  clients.get(key).add(res);

  const current = presence.get(key) || { count: 0, lastSeen: new Date().toISOString() };
  const next = { count: current.count + 1, lastSeen: new Date().toISOString() };
  presence.set(key, next);

  sendToResponse(res, 'presence_snapshot', getPresenceSnapshot());
  broadcast('presence', {
    userId: Number(userId),
    online: true,
    lastSeen: next.lastSeen,
  });

  return () => {
    const set = clients.get(key);
    if (set) {
      set.delete(res);
      if (set.size === 0) clients.delete(key);
    }

    const previous = presence.get(key) || { count: 1, lastSeen: new Date().toISOString() };
    const count = Math.max(0, previous.count - 1);
    const lastSeen = new Date().toISOString();
    presence.set(key, { count, lastSeen });

    if (count === 0) {
      broadcast('presence', {
        userId: Number(userId),
        online: false,
        lastSeen,
      });
    }
  };
};

module.exports = {
  broadcast,
  connectUser,
  getPresenceSnapshot,
  sendToUser,
};
