const pool = require('../db');
const { classifyRecognitionText, generateBadgeMetadata } = require('./aiService');
let schemaReady;
let running = false;
let timer;
const ensureEnrichmentSchema = () => {
  if (!schemaReady) schemaReady = pool.query(    'CREATE TABLE IF NOT EXISTS recognition_enrichment_jobs (recognition_id INTEGER PRIMARY KEY REFERENCES recognitions(id) ON DELETE CASCADE, attempts INTEGER NOT NULL DEFAULT 0, locked_at TIMESTAMPTZ, available_at TIMESTAMPTZ NOT NULL DEFAULT NOW())'
  ).catch(error => { schemaReady = null; throw error; });
  return schemaReady;
};
async function processEnrichmentJobs() {
  if (running) return;
  running = true;
  let job;
  try {
    await ensureEnrichmentSchema();
    const result = await pool.query(
      `UPDATE recognition_enrichment_jobs SET locked_at = NOW(), attempts = attempts + 1
       WHERE recognition_id = (SELECT recognition_id FROM recognition_enrichment_jobs
         WHERE attempts < 3 AND available_at <= NOW() AND (locked_at IS NULL OR locked_at < NOW() - INTERVAL '10 minutes')
         ORDER BY recognition_id LIMIT 1 FOR UPDATE SKIP LOCKED)
       RETURNING recognition_id`
    );
    job = result.rows[0];
    if (!job) return;
    const lookup = await pool.query('SELECT message, category FROM recognitions WHERE id = $1', [job.recognition_id]);
    if (!lookup.rows.length) return;
    const recognition = lookup.rows[0];
    const classification = await classifyRecognitionText({ message: recognition.message });
    const badge = await generateBadgeMetadata({ message: recognition.message, category: classification.category || recognition.category,
      sentiment: classification.sentiment || 'positivo', intensity: classification.intensity || 'media', tags: classification.tags || [] });
    await pool.query(`UPDATE recognitions SET ai_category = $2, ai_sentiment = $3, ai_intensity = $4, ai_tags = $5, ai_badge_title = $6, ai_badge_prompt = $7 WHERE id = $1`,
      [job.recognition_id, classification.category || null, classification.sentiment || null, classification.intensity || null,
       classification.tags || null, badge.badgeTitle || null, badge.badgePrompt || null]);
    await pool.query('DELETE FROM recognition_enrichment_jobs WHERE recognition_id = $1', [job.recognition_id]);
  } catch (error) {
    console.error('Error enriqueciendo reconocimiento:', error.message);
    if (job) await pool.query(`UPDATE recognition_enrichment_jobs SET locked_at = NULL, available_at = NOW() + INTERVAL '30 seconds' WHERE recognition_id = $1`, [job.recognition_id]).catch(() => {});
  } finally { running = false; }
}
function startEnrichmentWorker() {
  if (timer) return;
  timer = setInterval(() => { void processEnrichmentJobs(); }, 2000);
  timer.unref();
}
module.exports = { ensureEnrichmentSchema, processEnrichmentJobs, startEnrichmentWorker };
