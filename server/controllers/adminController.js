const postsModel = require('../models/postsModel');

async function deletePost(req, res, next) {
  try {
    const postId = Number(req.params.id);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const deleted = await postsModel.deletePost(postId);
    if (!deleted) {
      return res.status(404).json({ message: 'Post not found' });
    }

    return res.status(200).json({ message: 'Post deleted' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  deletePost,
};