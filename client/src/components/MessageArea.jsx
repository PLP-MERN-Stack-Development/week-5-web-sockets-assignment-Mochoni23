import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import FileUpload from './FileUpload';
import useChatStore from '../store/chatStore';
import { Send, Paperclip, Smile } from 'lucide-react';

const MessageArea = ({ room, isConnected }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const {
    messages,
    sendMessage,
    joinRoom,
    leaveRoom,
    getTypingUsersForRoom,
    startTyping,
    stopTyping,
    getMessagesForRoom
  } = useChatStore();

  useEffect(() => {
    if (room && isConnected) {
      joinRoom(room.id);
    }

    return () => {
      if (room) {
        leaveRoom(room.id);
      }
    };
  }, [room, isConnected, joinRoom, leaveRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !room) return;

    try {
      sendMessage(message);
      setMessage('');
      setIsTyping(false);
      stopTyping();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setMessage(value);

    if (!isTyping) {
      setIsTyping(true);
      startTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping();
    }, 1000);
  };

  const handleFileUpload = (file) => {
    // Handle file upload logic here
    console.log('File uploaded:', file);
    setShowFileUpload(false);
  };

  const roomMessages = room ? getMessagesForRoom(room.id) : [];
  const typingUsers = room ? getTypingUsersForRoom(room.id) : [];
  const otherUserTyping = typingUsers.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {roomMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No messages yet
                </h3>
                <p className="text-gray-500">
                  Start the conversation by sending a message
                </p>
              </div>
            ) : (
              roomMessages.map((msg) => (
                <Message key={msg.id} message={msg} />
              ))
            )}
            
            {/* Typing Indicator */}
            {otherUserTyping && <TypingIndicator />}
            
            {/* Scroll to bottom reference */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="pr-10"
              disabled={!isConnected}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowFileUpload(true)}
                className="text-gray-400 hover:text-gray-600"
                disabled={!isConnected}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
                disabled={!isConnected}
              >
                <Smile className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={!message.trim() || !isConnected}
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUpload
          onClose={() => setShowFileUpload(false)}
          onUpload={handleFileUpload}
        />
      )}
    </div>
  );
};

export default MessageArea; 