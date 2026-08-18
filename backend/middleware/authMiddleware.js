const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  // 1. Grab the token from the request headers
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(403).json({ error: 'No token provided. Access denied.' });
  }

  // Tokens are usually sent as "Bearer [token]", so we split it to just get the token string
  const token = authHeader.split(' ')[1];

  // 2. Verify the token using your secret key
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Failed to authenticate token. It may be expired.' });
    }

    // 3. If valid, save the user's ID and role to the request so the next functions can use it
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    // Move on to the actual API route
    next();
  });
};

// Optional: Extra security checkpoint specifically for Professors
exports.isProfessor = (req, res, next) => {
  if (req.userRole !== 'professor') {
    return res.status(403).json({ error: 'Access denied. Only professors can perform this action.' });
  }
  next();
};