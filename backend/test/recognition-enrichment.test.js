const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const original = Module._load;
let calls = [], failAI = false;
const pool = { query: async (sql, values) => {
  calls.push({ sql, values });
  if (sql.includes('RETURNING recognition_id')) return { rows: [{ recognition_id: 42 }] };
  if (sql.includes('SELECT message, category')) return { rows: [{ message: 'Gracias', category: 'Colaboración' }] };
  return { rows: [] };
} };
Module._load = function(request) {
  if (request === '../db') return pool;
  if (request === './aiService') return {
    classifyRecognitionText: async () => { if (failAI) throw new Error('AI offline'); return { category: 'Liderazgo', tags: ['equipo'] }; },
    generateBadgeMetadata: async () => ({ badgeTitle: 'Buen equipo', badgePrompt: 'Equipo' }),
  };
  return original.apply(this, arguments);
};
const { processEnrichmentJobs } = require('../src/services/recognitionEnrichmentService');
Module._load = original;
test('updates optional AI fields and completes the persisted job', async () => {
  calls = []; failAI = false;
  await processEnrichmentJobs();
  const update = calls.find(c => c.sql.startsWith('UPDATE recognitions SET'));
  assert.equal(update.values[0], 42);
  assert.equal(update.values[1], 'Liderazgo');
  assert.ok(calls.some(c => c.sql.startsWith('DELETE FROM recognition_enrichment_jobs')));
});
test('retains the job for retry when AI is unavailable', async () => {
  calls = []; failAI = true;
  await processEnrichmentJobs();
  assert.ok(calls.some(c => c.sql.includes('available_at = NOW()')));
  assert.ok(!calls.some(c => c.sql.startsWith('DELETE FROM recognition_enrichment_jobs')));
});
