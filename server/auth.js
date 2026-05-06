const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const ALLOWED_ADMIN_EMAILS = (process.env.ALLOWED_ADMIN_EMAILS || '').replace(/"/g, '').split(',');

// JWKS Client for fetching Supabase public keys (required for ES256)
const client = jwksClient({
  jwksUri: `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`
});

function getKey(header, callback) {
  if (header.alg === 'ES256') {
    client.getSigningKey(header.kid, (err, key) => {
      if (err) return callback(err);
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    });
  } else {
    // Fallback to symmetric secret for HS256
    callback(null, SUPABASE_JWT_SECRET);
  }
}

const isAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, getKey, { algorithms: ['HS256', 'ES256'] }, (err, payload) => {
        if (err) {
            console.error('JWT Validation Error:', err.message);
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const email = payload.email;

        if (!email || !ALLOWED_ADMIN_EMAILS.includes(email)) {
            console.log(`ADMIN AUTH FAIL: ${email} not in whitelist ${ALLOWED_ADMIN_EMAILS}`);
            return res.status(403).json({ error: `Access denied. ${email} is not an authorized admin.` });
        }

        req.user = payload;
        next();
    });
};

module.exports = { isAdmin };
