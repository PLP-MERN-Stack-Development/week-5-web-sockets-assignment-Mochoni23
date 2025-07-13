const User = require('../models/User');
const JWTUtils = require('../utils/jwt');

class AuthController {
  async register(req, res) {
    try {
      const { username, password, email } = req.body;

      // Validation
      if (!username || !password || !email) {
        return res.status(400).json({
          success: false,
          message: 'Username, password, and email are required'
        });
      }

      if (username.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Username must be at least 3 characters long'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      // Check if user already exists
      const existingUser = User.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }

      // Create user
      const user = await User.createUser(username, password, email);

      // Generate JWT token
      const token = JWTUtils.generateToken({
        userId: user.id,
        username: user.username,
        email: user.email
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userWithoutPassword,
          token
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validation
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      // Validate user credentials
      const user = await User.validateUser(username, password);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      // Generate JWT token
      const token = JWTUtils.generateToken({
        userId: user.id,
        username: user.username,
        email: user.email
      });

      // Update user status to online
      User.updateUserStatus(user.id, 'online');

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const user = User.getUserById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: userWithoutPassword
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { username, email, avatar } = req.body;

      const user = User.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Validate email if being updated
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address'
          });
        }
      }

      // Update user
      const updates = {};
      if (username) updates.username = username;
      if (email) updates.email = email;
      if (avatar) updates.avatar = avatar;

      const updatedUser = User.updateUserProfile(userId, updates);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: userWithoutPassword
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  async getUsers(req, res) {
    try {
      const users = User.getAllUsers();
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users'
      });
    }
  }

  async getOnlineUsers(req, res) {
    try {
      const onlineUsers = User.getOnlineUsers();
      res.json({
        success: true,
        data: onlineUsers
      });
    } catch (error) {
      console.error('Get online users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get online users'
      });
    }
  }
}

module.exports = new AuthController(); 