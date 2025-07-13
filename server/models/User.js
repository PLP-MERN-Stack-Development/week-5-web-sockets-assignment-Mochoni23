const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor() {
    this.users = new Map();
    this.onlineUsers = new Map();
  }

  async createUser(username, password, email) {
    // Check if user already exists
    if (this.getUserByUsername(username)) {
      throw new Error('Username already exists');
    }

    if (this.getUserByEmail(email)) {
      throw new Error('Email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      status: 'offline',
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(user.id, user);
    return user;
  }

  async validateUser(username, password) {
    const user = this.getUserByUsername(username);
    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  getUserById(id) {
    return this.users.get(id);
  }

  getUserByUsername(username) {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  getUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  updateUserStatus(userId, status) {
    const user = this.getUserById(userId);
    if (user) {
      user.status = status;
      user.lastSeen = new Date();
      user.updatedAt = new Date();
      return user;
    }
    return null;
  }

  setUserOnline(userId, socketId) {
    const user = this.getUserById(userId);
    if (user) {
      user.status = 'online';
      user.lastSeen = new Date();
      user.updatedAt = new Date();
      this.onlineUsers.set(userId, socketId);
      return user;
    }
    return null;
  }

  setUserOffline(userId) {
    const user = this.getUserById(userId);
    if (user) {
      user.status = 'offline';
      user.lastSeen = new Date();
      user.updatedAt = new Date();
      this.onlineUsers.delete(userId);
      return user;
    }
    return null;
  }

  getOnlineUsers() {
    const onlineUsers = [];
    for (const [userId, socketId] of this.onlineUsers.entries()) {
      const user = this.getUserById(userId);
      if (user) {
        onlineUsers.push({
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          status: user.status,
          lastSeen: user.lastSeen
        });
      }
    }
    return onlineUsers;
  }

  getAllUsers() {
    return Array.from(this.users.values()).map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt
    }));
  }

  updateUserProfile(userId, updates) {
    const user = this.getUserById(userId);
    if (user) {
      Object.assign(user, updates, { updatedAt: new Date() });
      return user;
    }
    return null;
  }

  deleteUser(userId) {
    const user = this.getUserById(userId);
    if (user) {
      this.users.delete(userId);
      this.onlineUsers.delete(userId);
      return true;
    }
    return false;
  }
}

// Export singleton instance
module.exports = new User(); 