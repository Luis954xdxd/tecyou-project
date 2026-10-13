const pool = require('../db');
let ready;
const ensureRecognitionRecipientsSchema = () => {
  if (!ready) {
    ready = pool.query('ALTER TABLE recognitions ADD COLUMN IF NOT EXISTS receiver_ids INTEGER[]')
      .catch((error) => { ready = null; throw error; });
  }
  return ready;
};
module.exports = { ensureRecognitionRecipientsSchema };
