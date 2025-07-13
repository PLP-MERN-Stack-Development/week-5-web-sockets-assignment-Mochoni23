import { create } from 'zustand';
import socketService from '../socket/socket';

const useChatStore = create((set, get) => ({
  // State
  messages: new Map(), // roomId -> messages[]
  rooms: [],
  currentRoom: null,
  onlineUsers: [],
  typingUsers: new Map(), // roomId -> typing users[]
  unreadCounts: new Map(), // roomId -> count
  isConnected: false,
  isLoading: false,
  error: null,

  // Actions
  initializeSocket: (token) => {
    try {
      const socket = socketService.connect(token);
      
      // Set up socket event listeners
      socketService.on('socket:connected', () => {
        set({ isConnected: true });
      });

      socketService.on('socket:disconnected', () => {
        set({ isConnected: false });
      });

      socketService.on('users:online', (users) => {
        set({ onlineUsers: users });
      });

      socketService.on('user:online', (user) => {
        set((state) => ({
          onlineUsers: [...state.onlineUsers.filter(u => u.id !== user.id), user]
        }));
      });

      socketService.on('user:offline', (user) => {
        set((state) => ({
          onlineUsers: state.onlineUsers.filter(u => u.id !== user.id)
        }));
      });

      socketService.on('room:joined', (data) => {
        set((state) => ({
          rooms: [...state.rooms.filter(r => r.id !== data.room.id), data.room]
        }));
      });

      socketService.on('room:messages', (data) => {
        set((state) => {
          const newMessages = new Map(state.messages);
          newMessages.set(data.roomId, data.messages);
          return { messages: newMessages };
        });
      });

      socketService.on('message:received', (data) => {
        set((state) => {
          const newMessages = new Map(state.messages);
          const roomMessages = newMessages.get(data.roomId) || [];
          newMessages.set(data.roomId, [...roomMessages, data.message]);
          
          // Update unread count if not in current room
          if (state.currentRoom?.id !== data.roomId) {
            const newUnreadCounts = new Map(state.unreadCounts);
            const currentCount = newUnreadCounts.get(data.roomId) || 0;
            newUnreadCounts.set(data.roomId, currentCount + 1);
            return { 
              messages: newMessages,
              unreadCounts: newUnreadCounts
            };
          }
          
          return { messages: newMessages };
        });
      });

      socketService.on('message:edited', (data) => {
        set((state) => {
          const newMessages = new Map(state.messages);
          const roomMessages = newMessages.get(data.roomId) || [];
          const updatedMessages = roomMessages.map(msg => 
            msg.id === data.messageId 
              ? { ...msg, content: data.newContent, edited: true }
              : msg
          );
          newMessages.set(data.roomId, updatedMessages);
          return { messages: newMessages };
        });
      });

      socketService.on('message:deleted', (data) => {
        set((state) => {
          const newMessages = new Map(state.messages);
          const roomMessages = newMessages.get(data.roomId) || [];
          const updatedMessages = roomMessages.filter(msg => msg.id !== data.messageId);
          newMessages.set(data.roomId, updatedMessages);
          return { messages: newMessages };
        });
      });

      socketService.on('typing:started', (data) => {
        set((state) => {
          const newTypingUsers = new Map(state.typingUsers);
          newTypingUsers.set(data.roomId, data.typingUsers);
          return { typingUsers: newTypingUsers };
        });
      });

      socketService.on('typing:stopped', (data) => {
        set((state) => {
          const newTypingUsers = new Map(state.typingUsers);
          newTypingUsers.set(data.roomId, data.typingUsers);
          return { typingUsers: newTypingUsers };
        });
      });

      socketService.on('user:joined', (user) => {
        // Handle user joining room
        console.log('User joined:', user);
      });

      socketService.on('user:left', (user) => {
        // Handle user leaving room
        console.log('User left:', user);
      });

      socketService.on('room:created', (data) => {
        set((state) => ({
          rooms: [...state.rooms, data.room]
        }));
      });

      socketService.on('file:shared', (data) => {
        set((state) => {
          const newMessages = new Map(state.messages);
          const roomMessages = newMessages.get(data.roomId) || [];
          newMessages.set(data.roomId, [...roomMessages, data.message]);
          return { messages: newMessages };
        });
      });

      socketService.on('message:private', (data) => {
        set((state) => {
          const newMessages = new Map(state.messages);
          const roomMessages = newMessages.get(data.roomId) || [];
          newMessages.set(data.roomId, [...roomMessages, data.message]);
          
          // Update unread count
          const newUnreadCounts = new Map(state.unreadCounts);
          const currentCount = newUnreadCounts.get(data.roomId) || 0;
          newUnreadCounts.set(data.roomId, currentCount + 1);
          
          return { 
            messages: newMessages,
            unreadCounts: newUnreadCounts
          };
        });
      });

      socketService.on('error', (error) => {
        set({ error: error.message });
      });

    } catch (error) {
      set({ error: error.message });
    }
  },

  disconnectSocket: () => {
    socketService.disconnect();
    set({ 
      isConnected: false,
      messages: new Map(),
      rooms: [],
      currentRoom: null,
      onlineUsers: [],
      typingUsers: new Map(),
      unreadCounts: new Map()
    });
  },

  setCurrentRoom: (room) => {
    set({ currentRoom: room });
    
    // Mark messages as read when entering room
    if (room) {
      const { unreadCounts } = get();
      const newUnreadCounts = new Map(unreadCounts);
      newUnreadCounts.set(room.id, 0);
      set({ unreadCounts: newUnreadCounts });
    }
  },

  joinRoom: (roomId) => {
    socketService.joinRoom(roomId);
  },

  leaveRoom: (roomId) => {
    socketService.leaveRoom(roomId);
  },

  sendMessage: (content, type = 'text', fileData = null) => {
    const { currentRoom } = get();
    if (!currentRoom) return;

    socketService.sendMessage(currentRoom.id, content, type, fileData);
  },

  startTyping: () => {
    const { currentRoom } = get();
    if (!currentRoom) return;

    socketService.startTyping(currentRoom.id);
  },

  stopTyping: () => {
    const { currentRoom } = get();
    if (!currentRoom) return;

    socketService.stopTyping(currentRoom.id);
  },

  editMessage: (messageId, newContent) => {
    socketService.editMessage(messageId, newContent);
  },

  deleteMessage: (messageId) => {
    socketService.deleteMessage(messageId);
  },

  markMessageAsRead: (messageId) => {
    const { currentRoom } = get();
    if (!currentRoom) return;

    socketService.markMessageAsRead(messageId, currentRoom.id);
  },

  createRoom: (name, isPrivate = false, members = []) => {
    socketService.createRoom(name, isPrivate, members);
  },

  sendPrivateMessage: (recipientId, content, type = 'text', fileData = null) => {
    socketService.sendPrivateMessage(recipientId, content, type, fileData);
  },

  shareFile: (file) => {
    const { currentRoom } = get();
    if (!currentRoom) return;

    const reader = new FileReader();
    reader.onload = () => {
      const fileData = reader.result.split(',')[1]; // Remove data URL prefix
      socketService.shareFile(
        currentRoom.id,
        fileData,
        file.name,
        file.type,
        file.size
      );
    };
    reader.readAsDataURL(file);
  },

  updateUserStatus: (status) => {
    socketService.updateUserStatus(status);
  },

  searchRooms: (query) => {
    socketService.searchRooms(query);
  },

  searchMessages: (query) => {
    const { currentRoom } = get();
    if (!currentRoom) return;

    socketService.searchMessages(currentRoom.id, query);
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  // Getters
  getMessagesForRoom: (roomId) => {
    const { messages } = get();
    return messages.get(roomId) || [];
  },

  getTypingUsersForRoom: (roomId) => {
    const { typingUsers } = get();
    return typingUsers.get(roomId) || [];
  },

  getUnreadCountForRoom: (roomId) => {
    const { unreadCounts } = get();
    return unreadCounts.get(roomId) || 0;
  },

  getTotalUnreadCount: () => {
    const { unreadCounts } = get();
    return Array.from(unreadCounts.values()).reduce((total, count) => total + count, 0);
  },
}));

export default useChatStore; 