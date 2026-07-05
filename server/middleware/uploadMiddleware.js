const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');
const CERTIFICATE_DIR = path.join(UPLOAD_ROOT, 'certificates');

[UPLOAD_ROOT, AVATAR_DIR, CERTIFICATE_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

function makeStorage(destinationDir, prefix) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, destinationDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${prefix}-${req.user.id}-${Date.now()}${ext}`;
      cb(null, uniqueName);
    }
  });
}

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, or WebP images are allowed.'));
  }
  cb(null, true);
}

const uploadAvatar = multer({
  storage: makeStorage(AVATAR_DIR, 'avatar'),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
}).single('avatar');

const uploadCertificate = multer({
  storage: makeStorage(CERTIFICATE_DIR, 'certificate'),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
}).single('certificate');

function handleUpload(uploader) {
  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File is too large. Maximum size is 3MB.' });
        }
        return res.status(400).json({ error: err.message });
      }
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
}

module.exports = {
  handleAvatarUpload: handleUpload(uploadAvatar),
  handleCertificateUpload: handleUpload(uploadCertificate),
  AVATAR_DIR,
  CERTIFICATE_DIR
};
