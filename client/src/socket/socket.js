import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventListeners = new Map();
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    try {
      this.socket = io('http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 20000
      });

      this.setupEventListeners();
      return this.socket;
    } catch (error) {
      console.error('Socket connection error:', error);
      throw error;
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Connected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('socket:connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      this.isConnected = false;
      this.emit('socket:disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      this.isConnected = false;
      this.emit('socket:error', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔌 Reconnected to server after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.emit('socket:reconnected');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🔌 Reconnection error:', error);
      this.emit('socket:reconnect_error', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('🔌 Reconnection failed');
      this.emit('socket:reconnect_failed');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Chat-specific methods
  joinRoom(roomId) {
    this.emit('room:join', { roomId });
  }

  leaveRoom(roomId) {
    this.emit('room:leave', { roomId });
  }

  sendMessage(roomId, content, type = 'text', fileData = null) {
    this.emit('message:send', { roomId, content, type, fileData });
  }

  startTyping(roomId) {
    this.emit('typing:start', { roomId });
  }

  stopTyping(roomId) {
    this.emit('typing:stop', { roomId });
  }

  editMessage(messageId, newContent) {
    this.emit('message:edit', { messageId, newContent });
  }

  deleteMessage(messageId) {
    this.emit('message:delete', { messageId });
  }

  markMessageAsRead(messageId, roomId) {
    this.emit('message:read', { messageId, roomId });
  }

  createRoom(name, isPrivate = false, members = []) {
    this.emit('room:create', { name, isPrivate, members });
  }

  sendPrivateMessage(recipientId, content, type = 'text', fileData = null) {
    this.emit('message:private', { recipientId, content, type, fileData });
  }

  shareFile(roomId, fileData, fileName, fileType, fileSize) {
    this.emit('file:share', { roomId, fileData, fileName, fileType, fileSize });
  }

  updateUserStatus(status) {
    this.emit('user:status', { status });
  }

  searchRooms(query) {
    this.emit('room:search', { query });
  }

  searchMessages(roomId, query) {
    this.emit('message:search', { roomId, query });
  }

  // Utility methods
  isConnected() {
    return this.isConnected;
  }

  getSocketId() {
    return this.socket ? this.socket.id : null;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService; 