const express = require('express');
const multer = require('multer');
const path = require('path');

const { requireAuth } = require('../middleware/auth');
const postsCtrl = require('../controllers/postsController');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename(req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error('Unsupported image type'));
    }
    return cb(null, true);
  },
});

const router = express.Router();

router.post('/', requireAuth(), upload.single('image'), postsCtrl.createPost);
router.get('/', postsCtrl.getPosts);
router.post('/like/:id', requireAuth(), postsCtrl.likePost);
router.post('/:id/comments', requireAuth(), postsCtrl.addComment);
router.get('/:id/comments', postsCtrl.getComments);

module.exports = router;