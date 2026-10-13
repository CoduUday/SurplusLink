import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token for a given user ID and role
 * @param {string} id - User MongoDB ObjectID
 * @param {string} role - User role ('DONOR' | 'NGO')
 * @returns {string} Signed JWT
 */
export const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET || 'surpluslink_dev_secret_key_2026_jwt';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id, role }, secret, {
    expiresIn
  });
};

export default generateToken;
