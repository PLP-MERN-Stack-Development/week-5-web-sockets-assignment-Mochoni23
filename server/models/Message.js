const { v4: uuidv4 } = require('uuid');

class Message {
  constructor() {
    this.messages = new Map();
    this.rooms = new Map();
    this.typingUsers = new Map(); // roomId -> Set of typing user IDs
  }

  createMessage(senderId, roomId, content, type = 'text', fileData = null) {
    const message = {
      id: uuidv4(),
      senderId,
      roomId,
      content,
      type, // 'text', 'file', 'image', 'system'
      fileData,
      timestamp: new Date(),
      readBy: new Set([senderId]), // Sender has read their own message
      edited: false,
      deleted: false
    };

    this.messages.set(message.id, message);
    return message;
  }

  createRoom(roomId, name, createdBy, isPrivate = false, members = []) {
    const room = {
      id: roomId,
      name,
      createdBy,
      isPrivate,
      members: new Set(members),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getMessageById(messageId) {
    return this.messages.get(messageId);
  }

  getRoomById(roomId) {
    return this.rooms.get(roomId);
  }

  getMessagesByRoom(roomId, limit = 50, offset = 0) {
    const messages = [];
    for (const message of this.messages.values()) {
      if (message.roomId === roomId && !message.deleted) {
        messages.push(message);
      }
    }

    // Sort by timestamp (newest first)
    messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return messages.slice(offset, offset + limit);
  }

  getAllRooms() {
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      createdBy: room.createdBy,
      isPrivate: room.isPrivate,
      memberCount: room.members.size,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt
    }));
  }

  getPublicRooms() {
    return Array.from(this.rooms.values())
      .filter(room => !room.isPrivate)
      .map(room => ({
        id: room.id,
        name: room.name,
        createdBy: room.createdBy,
        memberCount: room.members.size,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt
      }));
  }

  getUserRooms(userId) {
    const userRooms = [];
    for (const room of this.rooms.values()) {
      if (room.members.has(userId) || room.createdBy === userId) {
        userRooms.push({
          id: room.id,
          name: room.name,
          createdBy: room.createdBy,
          isPrivate: room.isPrivate,
          memberCount: room.members.size,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt
        });
      }
    }
    return userRooms;
  }

  addUserToRoom(roomId, userId) {
    const room = this.getRoomById(roomId);
    if (room) {
      room.members.add(userId);
      room.updatedAt = new Date();
      return room;
    }
    return null;
  }

  removeUserFromRoom(roomId, userId) {
    const room = this.getRoomById(roomId);
    if (room) {
      room.members.delete(userId);
      room.updatedAt = new Date();
      return room;
    }
    return null;
  }

  markMessageAsRead(messageId, userId) {
    const message = this.getMessageById(messageId);
    if (message) {
      message.readBy.add(userId);
      return message;
    }
    return null;
  }

  markRoomAsRead(roomId, userId) {
    let updatedCount = 0;
    for (const message of this.messages.values()) {
      if (message.roomId === roomId && !message.readBy.has(userId)) {
        message.readBy.add(userId);
        updatedCount++;
      }
    }
    return updatedCount;
  }

  getUnreadCount(roomId, userId) {
    let count = 0;
    for (const message of this.messages.values()) {
      if (message.roomId === roomId && 
          !message.readBy.has(userId) && 
          message.senderId !== userId) {
        count++;
      }
    }
    return count;
  }

  editMessage(messageId, newContent, userId) {
    const message = this.getMessageById(messageId);
    if (message && message.senderId === userId) {
      message.content = newContent;
      message.edited = true;
      message.updatedAt = new Date();
      return message;
    }
    return null;
  }

  deleteMessage(messageId, userId) {
    const message = this.getMessageById(messageId);
    if (message && (message.senderId === userId || message.type === 'system')) {
      message.deleted = true;
      message.updatedAt = new Date();
      return message;
    }
    return null;
  }

  setTypingStatus(roomId, userId, isTyping) {
    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Set());
    }

    const typingUsers = this.typingUsers.get(roomId);
    
    if (isTyping) {
      typingUsers.add(userId);
    } else {
      typingUsers.delete(userId);
    }

    return Array.from(typingUsers);
  }

  getTypingUsers(roomId) {
    return this.typingUsers.has(roomId) 
      ? Array.from(this.typingUsers.get(roomId))
      : [];
  }

  searchMessages(roomId, query, userId) {
    const results = [];
    for (const message of this.messages.values()) {
      if (message.roomId === roomId && 
          !message.deleted &&
          message.content.toLowerCase().includes(query.toLowerCase())) {
        results.push(message);
      }
    }
    return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getMessageStats(roomId) {
    let totalMessages = 0;
    let textMessages = 0;
    let fileMessages = 0;
    let imageMessages = 0;

    for (const message of this.messages.values()) {
      if (message.roomId === roomId && !message.deleted) {
        totalMessages++;
        switch (message.type) {
          case 'text':
            textMessages++;
            break;
          case 'file':
            fileMessages++;
            break;
          case 'image':
            imageMessages++;
            break;
        }
      }
    }

    return {
      totalMessages,
      textMessages,
      fileMessages,
      imageMessages
    };
  }
}

// Export singleton instance
module.exports = new Message(); 