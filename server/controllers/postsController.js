const postsModel = require('../models/postsModel');
const { getRequestAuth } = require('../middleware/auth');
const deepfakeService = require('../services/deepfakeService');
const fs = require('fs');

function isValidCoordinate(value, min, max) {
  const num = Number(value);
  return Number.isFinite(num) && num >= min && num <= max;
}

async function createPost(req, res, next) {
  try {
    const { description, latitude, longitude, location_name } = req.body;

    if (!description || !location_name) {
      return res.status(400).json({ message: 'description and location_name are required' });
    }
    if (!isValidCoordinate(latitude, -90, 90)) {
      return res.status(400).json({ message: 'latitude must be a number between -90 and 90' });
    }
    if (!isValidCoordinate(longitude, -180, 180)) {
      return res.status(400).json({ message: 'longitude must be a number between -180 and 180' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'image is required' });
    }

    // Validate image with deepfake detection (optional - skip if service unavailable)
    const enableAIValidation = process.env.ENABLE_AI_VALIDATION === 'true';
    let aiValidation = null;

    if (enableAIValidation) {
      try {
        console.log('Starting deepfake detection for:', req.file.path);
        const validation = await deepfakeService.validateImage(req.file.path);

        if (!validation.isValid) {
          // Delete the uploaded file if it's fake
          fs.unlinkSync(req.file.path);
          return res.status(400).json({
            message: 'Image validation failed: This image appears to be AI-generated or manipulated.',
            details: validation.message,
            confidence: validation.confidence,
            aiValidated: true
          });
        }

        aiValidation = {
          verified: true,
          label: validation.label,
          confidence: validation.confidence,
          message: validation.message
        };
        console.log('Image validated successfully:', validation.message);
      } catch (error) {
        console.error('Deepfake detection error:', error);
        // Continue without validation if service is unavailable
        console.log('Continuing without AI validation...');
        aiValidation = { verified: false, message: 'AI validation service unavailable, skipped.' };
      }
    } else {
      console.log('AI validation disabled - skipping image validation');
    }

    const auth = getRequestAuth(req);
    const userId = auth.userId;
    const email = auth.sessionClaims?.email || `${userId}@clerk.local`;

    await postsModel.upsertUser({ id: userId, email });

    const imagePath = `/uploads/${req.file.filename}`;
    const postId = await postsModel.createPost({
      userId,
      description: description.trim(),
      imagePath,
      latitude: Number(latitude),
      longitude: Number(longitude),
      locationName: location_name.trim(),
    });

    return res.status(201).json({
      id: postId,
      message: 'Post created successfully',
      aiValidation,
    });
  } catch (err) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return next(err);
  }
}

async function getPosts(req, res, next) {
  try {
    const posts = await postsModel.getAllPosts();
    return res.status(200).json(posts);
  } catch (err) {
    return next(err);
  }
}

async function likePost(req, res, next) {
  try {
    const postId = Number(req.params.id);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const auth = getRequestAuth(req);
    const userId = auth.userId;

    const result = await postsModel.likePost(postId, userId);
    if (result === 'missing') {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (result === 'exists') {
      return res.status(200).json({ message: 'Already liked' });
    }

    return res.status(201).json({ message: 'Liked post' });
  } catch (err) {
    return next(err);
  }
}

async function addComment(req, res, next) {
  try {
    const postId = Number(req.params.id);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const auth = getRequestAuth(req);
    const userId = auth.userId;
    const userEmail = auth.sessionClaims?.email || `${userId}@clerk.local`;

    const comment = await postsModel.addComment(postId, userId, userEmail, text.trim());
    return res.status(201).json(comment);
  } catch (err) {
    return next(err);
  }
}

async function getComments(req, res, next) {
  try {
    const postId = Number(req.params.id);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const comments = await postsModel.getComments(postId);
    return res.status(200).json(comments);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createPost,
  getPosts,
  likePost,
  addComment,
  getComments,
};
