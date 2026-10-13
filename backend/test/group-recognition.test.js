const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const originalLoad = Module._load;
let calls = [];
let failNotification = false;
let activeProgress = 0;
let maxActiveProgress = 0;
const query = async (sql, values) => {
  calls.push({ sql, values });
  if (sql.includes('SELECT id FROM users WHERE id = ANY')) return { rows: values[0].map(id => ({ id })) };
  if (sql.includes('INSERT INTO recognitions')) return { rows: [{ id: 42, receiver_id: values[1], receiver_ids: values[11] }] };
  if (failNotification && sql.includes('INSERT INTO notifications')) throw new Error('Notification failed');
  return { rows: [] };
};
const client = { query, release: () => calls.push({ sql: 'RELEASE' }) };
const pool = { query, connect: async () => client };
Module._load = function(request, parent, isMain) {
  if (request === '../db') return pool;
  if (request === '../config/storage') return { ensureUploadDir: () => process.cwd() };
  if (request === '../../moderationService') return { moderateText: async () => ({ permitido: true }) };
  if (request === '../services/aiService') return { classifyRecognitionText: () => new Promise(() => {}), generateBadgeMetadata: () => new Promise(() => {}) };
  if (request === '../services/recognitionEnrichmentService') return { ensureEnrichmentSchema: async () => {}, startEnrichmentWorker: () => {} };
  if (request === '../services/achievementService') return { evaluateAndUnlockAchievementsForUser: async () => { activeProgress++; maxActiveProgress = Math.max(maxActiveProgress, activeProgress); await new Promise(resolve => setImmediate(resolve)); activeProgress--; return {}; } };
  return originalLoad.apply(this, arguments);
};
const router = require('../src/routes/recognitionRoutes');
Module._load = originalLoad;
const handler = router.stack.find(layer => layer.route?.path === '/send').route.stack.at(-1).handle;
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; }, send(data) { this.data = data; return this; } });
test('creates one publication and notifies each recipient in one transaction', async () => {
  calls = []; failNotification = false;
  const res = response();
  await handler({ body: { sender_id: 1, receiver_ids: '[2,3,2]', message: 'Gracias', category: 'Colaboración' } }, res);
  assert.equal(res.code, 200);
  assert.equal(calls.filter(c => c.sql.includes('INSERT INTO recognitions')).length, 1);
  assert.deepEqual(res.data.data.receiver_ids, [2,3]);
  assert.deepEqual(calls.filter(c => c.sql.includes('INSERT INTO notifications')).flatMap(c => c.values[0]), [2,3]);
  assert.ok(calls.some(c => c.sql === 'COMMIT'));
});
test('rolls back the publication if any recipient notification cannot be saved', async () => {
  calls = []; failNotification = true;
  const res = response();
  await handler({ body: { sender_id: 1, receiver_ids: '[2,3]', message: 'Gracias' } }, res);
  assert.equal(res.code, 500);
  assert.ok(calls.some(c => c.sql === 'ROLLBACK'));
  assert.ok(!calls.some(c => c.sql === 'COMMIT'));
  failNotification = false;
});
test('rejects invalid recipient lists before inserting a publication', async () => {
  calls = [];
  const res = response();
  await handler({ body: { sender_id: 1, receiver_ids: '[1,3]', message: 'Gracias' } }, res);
  assert.equal(res.code, 400);
  assert.ok(!calls.some(c => c.sql.includes('INSERT INTO recognitions')));
});

test('does not wait for AI and evaluates rewards concurrently after releasing the transaction connection', { timeout: 1000 }, async () => {
  calls = []; maxActiveProgress = 0;
  const res = response();
  const start = performance.now();
  await handler({ body: { sender_id: 1, receiver_ids: '[2,3]', message: 'Gracias' } }, res);
  assert.equal(res.code, 200);
  assert.ok(maxActiveProgress > 1);
  const jobIndex = calls.findIndex(c => c.sql.includes('INSERT INTO recognition_enrichment_jobs'));
  const commitIndex = calls.findIndex(c => c.sql === 'COMMIT');
  assert.ok(jobIndex >= 0 && jobIndex < commitIndex);
  assert.equal(calls.filter(c => c.sql === 'RELEASE').length, 1);
  console.log('Envío con dependencias simuladas: ' + Math.round(performance.now() - start) + ' ms; IA pendiente sin bloquear.');
});
