const { requireAuth: clerkRequireAuth, getAuth: clerkGetAuth } = require('@clerk/express');

const devBypassAuth = String(process.env.DEV_BYPASS_AUTH || '').toLowerCase() === 'true';

function parseRoles(sessionClaims) {
  const metadata = sessionClaims?.metadata || {};
  const publicMetadata = sessionClaims?.public_metadata || {};

  if (Array.isArray(metadata.roles)) {
    return metadata.roles;
  }
  if (Array.isArray(publicMetadata.roles)) {
    return publicMetadata.roles;
  }
  if (typeof metadata.role === 'string') {
    return [metadata.role];
  }
  if (typeof publicMetadata.role === 'string') {
    return [publicMetadata.role];
  }

  return [];
}

function getRequestAuth(req) {
  if (devBypassAuth) {
    return req.devAuth || null;
  }
  return clerkGetAuth(req);
}

function requireAuth() {
  if (devBypassAuth) {
    return (req, res, next) => {
      req.devAuth = {
        userId: process.env.DEV_USER_ID || 'dev_user_1',
        sessionClaims: {
          email: process.env.DEV_USER_EMAIL || 'dev@example.com',
          metadata: { roles: ['admin'] },
          public_metadata: { roles: ['admin'] },
        },
      };
      next();
    };
  }
  return clerkRequireAuth();
}

function requireAdmin(req, res, next) {
  const auth = getRequestAuth(req);
  if (!auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const roles = parseRoles(auth.sessionClaims);
  if (!roles.includes('admin')) {
    return res.status(403).json({ message: 'Forbidden: admin only' });
  }

  return next();
}

module.exports = {
  requireAuth,
  getRequestAuth,
  requireAdmin,
};
