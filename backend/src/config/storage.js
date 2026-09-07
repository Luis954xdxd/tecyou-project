const fs = require('fs');
const path = require('path');

const uploadsRoot = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, '..', 'uploads');

const ensureUploadDir = (folderName) => {
  const dir = path.join(uploadsRoot, folderName);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

module.exports = {
  uploadsRoot,
  ensureUploadDir,
};
