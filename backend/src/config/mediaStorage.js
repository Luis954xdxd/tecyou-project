const fs = require('fs');

const CLOUDINARY_FOLDER_PREFIX = process.env.CLOUDINARY_FOLDER_PREFIX || 'tecyou';

const isCloudinaryConfigured = () => Boolean(
  process.env.CLOUDINARY_CLOUD_NAME
    && process.env.CLOUDINARY_API_KEY
    && process.env.CLOUDINARY_API_SECRET
);

let cloudinaryClient = null;

const getCloudinaryClient = () => {
  if (!isCloudinaryConfigured()) return null;
  if (cloudinaryClient) return cloudinaryClient;

  let cloudinary;
  try {
    cloudinary = require('cloudinary').v2;
  } catch (error) {
    throw new Error('Cloudinary esta configurado, pero falta instalar la dependencia "cloudinary". Ejecuta npm install en backend.');
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  cloudinaryClient = cloudinary;
  return cloudinaryClient;
};

const removeLocalTempFile = (filePath) => {
  if (!filePath) return;
  fs.unlink(filePath, (error) => {
    if (error && error.code !== 'ENOENT') {
      console.error('No se pudo eliminar archivo temporal:', error.message);
    }
  });
};

const uploadMediaFile = async (file, folderName) => {
  if (!file) return null;

  const cloudinary = getCloudinaryClient();
  if (!cloudinary) {
    return `/uploads/${folderName}/${file.filename}`;
  }

  const result = await cloudinary.uploader.upload(file.path, {
    folder: `${CLOUDINARY_FOLDER_PREFIX}/${folderName}`,
    resource_type: 'auto',
  });

  removeLocalTempFile(file.path);
  return result.secure_url;
};

const removeLocalUploadByUrl = (url, uploadDir, label = 'archivo') => {
  if (typeof url !== 'string' || !url.startsWith('/uploads/')) return;

  const path = require('path');
  const filePath = path.join(uploadDir, path.basename(url));
  fs.unlink(filePath, (error) => {
    if (error && error.code !== 'ENOENT') {
      console.error(`Error eliminando ${label}:`, error.message);
    }
  });
};

module.exports = {
  isCloudinaryConfigured,
  uploadMediaFile,
  removeLocalUploadByUrl,
};
