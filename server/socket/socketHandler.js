const Message = require('../models/Message');
const User = require('../models/User');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.onlineUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // userId -> Set of socketIds
    this.roomSockets = new Map(); // roomId -> Set of socketIds
  }

  handleConnection(socket) {
    console.log(`🔌 User connected: ${socket.username} (${socket.userId})`);
    
    // Set user online
    User.setUserOnline(socket.userId, socket.id);
    this.onlineUsers.set(socket.userId, socket.id);
    
    // Initialize user sockets tracking
    if (!this.userSockets.has(socket.userId)) {
      this.userSockets.set(socket.userId, new Set());
    }
    this.userSockets.get(socket.userId).add(socket.id);

    // Join user to their default rooms
    this.joinDefaultRooms(socket);

    // Emit user online status
    this.io.emit('user:online', {
      userId: socket.userId,
      username: socket.username,
      avatar: socket.user.avatar
    });

    // Send online users list
    socket.emit('users:online', User.getOnlineUsers());

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Handle room joining
    socket.on('room:join', (data) => {
      this.handleJoinRoom(socket, data);
    });

    // Handle room leaving
    socket.on('room:leave', (data) => {
      this.handleLeaveRoom(socket, data);
    });

    // Handle message sending
    socket.on('message:send', (data) => {
      this.handleSendMessage(socket, data);
    });

    // Handle typing events
    socket.on('typing:start', (data) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('typing:stop', (data) => {
      this.handleTypingStop(socket, data);
    });

    // Handle message editing
    socket.on('message:edit', (data) => {
      this.handleEditMessage(socket, data);
    });

    // Handle message deletion
    socket.on('message:delete', (data) => {
      this.handleDeleteMessage(socket, data);
    });

    // Handle message read receipts
    socket.on('message:read', (data) => {
      this.handleMessageRead(socket, data);
    });

    // Handle room creation
    socket.on('room:create', (data) => {
      this.handleCreateRoom(socket, data);
    });

    // Handle private messaging
    socket.on('message:private', (data) => {
      this.handlePrivateMessage(socket, data);
    });

    // Handle file sharing
    socket.on('file:share', (data) => {
      this.handleFileShare(socket, data);
    });

    // Handle user status updates
    socket.on('user:status', (data) => {
      this.handleUserStatusUpdate(socket, data);
    });

    // Handle room search
    socket.on('room:search', (data) => {
      this.handleRoomSearch(socket, data);
    });

    // Handle message search
    socket.on('message:search', (data) => {
      this.handleMessageSearch(socket, data);
    });
  }

  handleDisconnection(socket) {
    console.log(`🔌 User disconnected: ${socket.username} (${socket.userId})`);
    
    // Remove socket from user tracking
    const userSockets = this.userSockets.get(socket.userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        this.userSockets.delete(socket.userId);
        this.onlineUsers.delete(socket.userId);
        
        // Set user offline if no more sockets
        User.setUserOffline(socket.userId);
        
        // Emit user offline status
        this.io.emit('user:offline', {
          userId: socket.userId,
          username: socket.username
        });
      }
    }

    // Remove socket from all rooms
    for (const [roomId, sockets] of this.roomSockets.entries()) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        this.roomSockets.delete(roomId);
      }
    }
  }

  joinDefaultRooms(socket) {
    const defaultRooms = ['global', 'general', 'random', 'help'];
    
    defaultRooms.forEach(roomId => {
      const room = Message.getRoomById(roomId);
      if (room) {
        socket.join(roomId);
        Message.addUserToRoom(roomId, socket.userId);
        
        // Track socket in room
        if (!this.roomSockets.has(roomId)) {
          this.roomSockets.set(roomId, new Set());
        }
        this.roomSockets.get(roomId).add(socket.id);
        
        // Send room info
        socket.emit('room:joined', {
          roomId,
          room: {
            id: room.id,
            name: room.name,
            memberCount: room.members.size
          }
        });
      }
    });
  }

  handleJoinRoom(socket, data) {
    const { roomId } = data;
    const room = Message.getRoomById(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Check if user can join private room
    if (room.isPrivate && !room.members.has(socket.userId)) {
      socket.emit('error', { message: 'Access denied to private room' });
      return;
    }

    socket.join(roomId);
    Message.addUserToRoom(roomId, socket.userId);
    
    // Track socket in room
    if (!this.roomSockets.has(roomId)) {
      this.roomSockets.set(roomId, new Set());
    }
    this.roomSockets.get(roomId).add(socket.id);

    // Send room messages
    const messages = Message.getMessagesByRoom(roomId, 50);
    socket.emit('room:messages', {
      roomId,
      messages: messages.reverse() // Send oldest first
    });

    // Notify others in room
    socket.to(roomId).emit('user:joined', {
      userId: socket.userId,
      username: socket.username,
      avatar: socket.user.avatar
    });
  }

  handleLeaveRoom(socket, data) {
    const { roomId } = data;
    
    socket.leave(roomId);
    Message.removeUserFromRoom(roomId, socket.userId);
    
    // Remove socket from room tracking
    const roomSockets = this.roomSockets.get(roomId);
    if (roomSockets) {
      roomSockets.delete(socket.id);
      if (roomSockets.size === 0) {
        this.roomSockets.delete(roomId);
      }
    }

    // Notify others in room
    socket.to(roomId).emit('user:left', {
      userId: socket.userId,
      username: socket.username
    });
  }

  handleSendMessage(socket, data) {
    const { roomId, content, type = 'text', fileData = null } = data;
    
    if (!content || !roomId) {
      socket.emit('error', { message: 'Message content and room ID are required' });
      return;
    }

    const room = Message.getRoomById(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Create message
    const message = Message.createMessage(socket.userId, roomId, content, type, fileData);
    
    // Broadcast to room
    this.io.to(roomId).emit('message:received', {
      message: {
        id: message.id,
        content: message.content,
        type: message.type,
        fileData: message.fileData,
        senderId: message.senderId,
        senderName: socket.username,
        senderAvatar: socket.user.avatar,
        timestamp: message.timestamp,
        edited: message.edited
      },
      roomId
    });

    // Clear typing indicator for sender
    this.handleTypingStop(socket, { roomId });
  }

  handleTypingStart(socket, data) {
    const { roomId } = data;
    const typingUsers = Message.setTypingStatus(roomId, socket.userId, true);
    
    socket.to(roomId).emit('typing:started', {
      roomId,
      userId: socket.userId,
      username: socket.username,
      typingUsers
    });
  }

  handleTypingStop(socket, data) {
    const { roomId } = data;
    const typingUsers = Message.setTypingStatus(roomId, socket.userId, false);
    
    socket.to(roomId).emit('typing:stopped', {
      roomId,
      userId: socket.userId,
      username: socket.username,
      typingUsers
    });
  }

  handleEditMessage(socket, data) {
    const { messageId, newContent } = data;
    
    const updatedMessage = Message.editMessage(messageId, newContent, socket.userId);
    if (!updatedMessage) {
      socket.emit('error', { message: 'Cannot edit message' });
      return;
    }

    // Broadcast to room
    this.io.to(updatedMessage.roomId).emit('message:edited', {
      messageId,
      newContent,
      roomId: updatedMessage.roomId,
      editedBy: socket.userId,
      editedAt: updatedMessage.updatedAt
    });
  }

  handleDeleteMessage(socket, data) {
    const { messageId } = data;
    
    const deletedMessage = Message.deleteMessage(messageId, socket.userId);
    if (!deletedMessage) {
      socket.emit('error', { message: 'Cannot delete message' });
      return;
    }

    // Broadcast to room
    this.io.to(deletedMessage.roomId).emit('message:deleted', {
      messageId,
      roomId: deletedMessage.roomId,
      deletedBy: socket.userId
    });
  }

  handleMessageRead(socket, data) {
    const { messageId, roomId } = data;
    
    Message.markMessageAsRead(messageId, socket.userId);
    
    // Notify message sender
    const message = Message.getMessageById(messageId);
    if (message && message.senderId !== socket.userId) {
      const senderSocket = this.onlineUsers.get(message.senderId);
      if (senderSocket) {
        this.io.to(senderSocket).emit('message:read', {
          messageId,
          readBy: socket.userId,
          readByUsername: socket.username
        });
      }
    }
  }

  handleCreateRoom(socket, data) {
    const { name, isPrivate = false, members = [] } = data;
    
    if (!name) {
      socket.emit('error', { message: 'Room name is required' });
      return;
    }

    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const room = Message.createRoom(roomId, name, socket.userId, isPrivate, [socket.userId, ...members]);
    
    // Join creator to room
    socket.join(roomId);
    Message.addUserToRoom(roomId, socket.userId);
    
    // Track socket in room
    if (!this.roomSockets.has(roomId)) {
      this.roomSockets.set(roomId, new Set());
    }
    this.roomSockets.get(roomId).add(socket.id);

    // Notify creator
    socket.emit('room:created', {
      room: {
        id: room.id,
        name: room.name,
        isPrivate: room.isPrivate,
        memberCount: room.members.size,
        createdAt: room.createdAt
      }
    });

    // Notify invited members
    members.forEach(memberId => {
      const memberSocket = this.onlineUsers.get(memberId);
      if (memberSocket) {
        this.io.to(memberSocket).emit('room:invited', {
          room: {
            id: room.id,
            name: room.name,
            createdBy: socket.userId,
            createdByUsername: socket.username
          }
        });
      }
    });
  }

  handlePrivateMessage(socket, data) {
    const { recipientId, content, type = 'text', fileData = null } = data;
    
    if (!recipientId || !content) {
      socket.emit('error', { message: 'Recipient ID and content are required' });
      return;
    }

    const recipient = User.getUserById(recipientId);
    if (!recipient) {
      socket.emit('error', { message: 'Recipient not found' });
      return;
    }

    // Create private room ID (sorted to ensure consistency)
    const roomId = [socket.userId, recipientId].sort().join('_');
    
    // Create or get private room
    let room = Message.getRoomById(roomId);
    if (!room) {
      room = Message.createRoom(roomId, `Private: ${socket.username} & ${recipient.username}`, 'system', true, [socket.userId, recipientId]);
    }

    // Create message
    const message = Message.createMessage(socket.userId, roomId, content, type, fileData);
    
    // Send to recipient if online
    const recipientSocket = this.onlineUsers.get(recipientId);
    if (recipientSocket) {
      this.io.to(recipientSocket).emit('message:private', {
        message: {
          id: message.id,
          content: message.content,
          type: message.type,
          fileData: message.fileData,
          senderId: message.senderId,
          senderName: socket.username,
          senderAvatar: socket.user.avatar,
          timestamp: message.timestamp
        },
        roomId
      });
    }

    // Send confirmation to sender
    socket.emit('message:sent', {
      messageId: message.id,
      roomId
    });
  }

  handleFileShare(socket, data) {
    const { roomId, fileData, fileName, fileType, fileSize } = data;
    
    if (!fileData || !fileName) {
      socket.emit('error', { message: 'File data and name are required' });
      return;
    }

    const room = Message.getRoomById(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Create file message
    const message = Message.createMessage(socket.userId, roomId, fileName, 'file', {
      data: fileData,
      type: fileType,
      size: fileSize
    });
    
    // Broadcast to room
    this.io.to(roomId).emit('file:shared', {
      message: {
        id: message.id,
        content: fileName,
        type: 'file',
        fileData: message.fileData,
        senderId: message.senderId,
        senderName: socket.username,
        senderAvatar: socket.user.avatar,
        timestamp: message.timestamp
      },
      roomId
    });
  }

  handleUserStatusUpdate(socket, data) {
    const { status } = data;
    
    const updatedUser = User.updateUserStatus(socket.userId, status);
    if (updatedUser) {
      this.io.emit('user:status', {
        userId: socket.userId,
        username: socket.username,
        status: updatedUser.status,
        lastSeen: updatedUser.lastSeen
      });
    }
  }

  handleRoomSearch(socket, data) {
    const { query } = data;
    
    const rooms = Message.getAllRooms().filter(room => 
      room.name.toLowerCase().includes(query.toLowerCase())
    );
    
    socket.emit('room:search:results', {
      query,
      rooms
    });
  }

  handleMessageSearch(socket, data) {
    const { roomId, query } = data;
    
    const messages = Message.searchMessages(roomId, query, socket.userId);
    
    socket.emit('message:search:results', {
      roomId,
      query,
      messages
    });
  }
}

module.exports = SocketHandler; 