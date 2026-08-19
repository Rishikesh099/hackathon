const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  // 1. Grab the token from the request headers
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided. Access denied.' });
  }

  // Tokens are usually sent as "Bearer <token>"
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : authHeader;

  if (!token) {
    return res.status(401).json({ error: 'Malformed token header. Access denied.' });
  }

  // 2. Verify the token using your secret key
  jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Failed to authenticate token. It may be expired or invalid.' });
    }

    // 3. Save both user ID variations and user role
    req.userId = decoded.userId || decoded.id;
    req.userRole = decoded.role;
    
    // Move on to the next handler
    next();
  });
};

// Security checkpoint specifically for Professors
exports.isProfessor = (req, res, next) => {
  if (req.userRole !== 'professor') {
    return res.status(403).json({ error: 'Access denied. Only professors can perform this action.' });
  }
  next();
};