const JWTUtils = require('../utils/jwt');
const User = require('../models/User');

// Middleware for HTTP routes
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);
    
    const decoded = JWTUtils.verifyToken(token);
    const user = User.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Middleware for Socket.io connections
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    
    const decoded = JWTUtils.verifyToken(cleanToken);
    const user = User.getUserById(decoded.userId);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user data to socket
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    socket.user = user;
    
    next();
  } catch (error) {
    return next(new Error('Invalid or expired token'));
  }
};

// Optional authentication middleware
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = JWTUtils.extractTokenFromHeader(authHeader);
    const decoded = JWTUtils.verifyToken(token);
    const user = User.getUserById(decoded.userId);
    
    if (user) {
      req.user = decoded;
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  authenticateSocket,
  optionalAuth
}; 