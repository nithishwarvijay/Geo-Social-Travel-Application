const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const dataDir = path.join(__dirname, '../data');
const storeFile = path.join(dataDir, 'dev-store.json');

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(storeFile)) {
    fs.writeFileSync(
      storeFile,
      JSON.stringify({ users: [], posts: [], likes: [], comments: [], nextPostId: 1, nextCommentId: 1 }, null, 2),
      'utf8'
    );
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(storeFile, 'utf8'));
}

function writeStore(store) {
  ensureStore();
  fs.writeFileSync(storeFile, JSON.stringify(store, null, 2), 'utf8');
}

function shouldFallback(err) {
  const retryableCodes = new Set([
    'ER_ACCESS_DENIED_ERROR',
    'ECONNREFUSED',
    'PROTOCOL_CONNECTION_LOST',
    'ENOTFOUND',
  ]);
  return retryableCodes.has(err?.code);
}

async function withDbFallback(dbFn, fallbackFn) {
  try {
    return await dbFn();
  } catch (err) {
    if (!shouldFallback(err)) {
      throw err;
    }
    return fallbackFn();
  }
}

async function createPost({ userId, description, imagePath, latitude, longitude, locationName }) {
  return withDbFallback(
    async () => {
      const [result] = await pool.execute(
        'INSERT INTO posts (user_id, description, image_path, latitude, longitude, location_name) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, description, imagePath, latitude, longitude, locationName]
      );
      return result.insertId;
    },
    () => {
      const store = readStore();
      const post = {
        id: store.nextPostId++,
        user_id: userId,
        description,
        image_path: imagePath,
        latitude,
        longitude,
        location_name: locationName,
        created_at: new Date().toISOString(),
      };
      store.posts.push(post);
      writeStore(store);
      return post.id;
    }
  );
}

async function upsertUser({ id, email }) {
  return withDbFallback(
    async () => {
      await pool.execute(
        'INSERT INTO users (id, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE email = VALUES(email)',
        [id, email]
      );
      return true;
    },
    () => {
      const store = readStore();
      const existing = store.users.find((user) => user.id === id);
      if (existing) {
        existing.email = email;
      } else {
        store.users.push({ id, email, created_at: new Date().toISOString() });
      }
      writeStore(store);
      return true;
    }
  );
}

async function getAllPosts() {
  return withDbFallback(
    async () => {
      const [rows] = await pool.execute(`
        SELECT
          p.id,
          p.user_id,
          p.description,
          p.image_path,
          p.latitude,
          p.longitude,
          p.location_name,
          p.created_at,
          u.email AS user_email,
          COUNT(l.post_id) AS like_count
        FROM posts p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN likes l ON l.post_id = p.id
        GROUP BY p.id
        ORDER BY like_count DESC, p.created_at DESC
      `);
      return rows;
    },
    () => {
      const store = readStore();
      const likesByPost = store.likes.reduce((acc, like) => {
        acc[like.post_id] = (acc[like.post_id] || 0) + 1;
        return acc;
      }, {});

      return store.posts
        .map((post) => {
          const user = store.users.find((u) => u.id === post.user_id);
          return {
            ...post,
            user_email: user?.email || '',
            like_count: likesByPost[post.id] || 0,
          };
        })
        .sort((a, b) => {
          if (b.like_count !== a.like_count) return b.like_count - a.like_count;
          return new Date(b.created_at) - new Date(a.created_at);
        });
    }
  );
}

async function likePost(postId, userId) {
  return withDbFallback(
    async () => {
      const [postRows] = await pool.execute('SELECT id FROM posts WHERE id = ?', [postId]);
      if (postRows.length === 0) {
        return 'missing';
      }

      const [existing] = await pool.execute(
        'SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?',
        [postId, userId]
      );

      if (existing.length > 0) {
        return 'exists';
      }

      await pool.execute('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);
      return 'liked';
    },
    () => {
      const store = readStore();
      const existsPost = store.posts.some((post) => post.id === postId);
      if (!existsPost) {
        return 'missing';
      }

      const existing = store.likes.some((like) => like.post_id === postId && like.user_id === userId);
      if (existing) {
        return 'exists';
      }

      store.likes.push({ post_id: postId, user_id: userId, created_at: new Date().toISOString() });
      writeStore(store);
      return 'liked';
    }
  );
}

async function deletePost(postId) {
  return withDbFallback(
    async () => {
      const [result] = await pool.execute('DELETE FROM posts WHERE id = ?', [postId]);
      return result.affectedRows > 0;
    },
    () => {
      const store = readStore();
      const before = store.posts.length;
      store.posts = store.posts.filter((post) => post.id !== postId);
      store.likes = store.likes.filter((like) => like.post_id !== postId);
      if (store.comments) {
        store.comments = store.comments.filter((comment) => comment.post_id !== postId);
      }
      writeStore(store);
      return store.posts.length < before;
    }
  );
}

async function addComment(postId, userId, userEmail, text) {
  return withDbFallback(
    async () => {
      const [result] = await pool.execute(
        'INSERT INTO comments (post_id, user_id, user_email, text) VALUES (?, ?, ?, ?)',
        [postId, userId, userEmail, text]
      );
      return { id: result.insertId, post_id: postId, user_id: userId, user_email: userEmail, text, created_at: new Date().toISOString() };
    },
    () => {
      const store = readStore();
      if (!store.comments) store.comments = [];
      if (!store.nextCommentId) store.nextCommentId = 1;
      
      const comment = {
        id: store.nextCommentId++,
        post_id: postId,
        user_id: userId,
        user_email: userEmail,
        text,
        created_at: new Date().toISOString(),
      };
      store.comments.push(comment);
      writeStore(store);
      return comment;
    }
  );
}

async function getComments(postId) {
  return withDbFallback(
    async () => {
      const [rows] = await pool.execute(
        'SELECT id, post_id, user_id, user_email, text, created_at FROM comments WHERE post_id = ? ORDER BY created_at DESC',
        [postId]
      );
      return rows;
    },
    () => {
      const store = readStore();
      if (!store.comments) return [];
      return store.comments
        .filter((comment) => comment.post_id === postId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  );
}

module.exports = {
  createPost,
  upsertUser,
  getAllPosts,
  likePost,
  deletePost,
  addComment,
  getComments,
};
