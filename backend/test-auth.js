const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './config.env' });

// Test the JWT token generation and verification
const testUser = {
  id: 1,
  username: 'admin',
  role: 'admin',
  email: 'admin@company.com'
};

console.log('Testing JWT authentication...');
console.log('JWT_SECRET:', process.env.JWT_SECRET);

// Generate a token
const token = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '24h' });
console.log('Generated token:', token);

// Verify the token
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Decoded user:', decoded);
  console.log('User role:', decoded.role);
  console.log('✅ JWT authentication is working correctly');
} catch (error) {
  console.error('❌ JWT authentication failed:', error);
} 