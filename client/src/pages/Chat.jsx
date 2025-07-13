import { useEffect, useState, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import Sidebar from '../components/Sidebar';
import MessageArea from '../components/MessageArea';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import { LogOut, MessageCircle, Users, Settings, ChevronDown, User } from 'lucide-react';

const Chat = () => {
  const { user, logout } = useAuthStore();
  const { 
    isConnected, 
    currentRoom, 
    setCurrentRoom, 
    rooms, 
    onlineUsers,
    getTotalUnreadCount 
  } = useChatStore();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  // Handle clicking outside the user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
  };
  }, [userMenuOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col`}>
        <Sidebar 
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          currentRoom={currentRoom}
          onRoomSelect={setCurrentRoom}
          rooms={rooms}
          onlineUsers={onlineUsers}
          unreadCount={getTotalUnreadCount()}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="md:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
            
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {currentRoom ? currentRoom.name : 'Select a room'}
              </h1>
              {currentRoom && (
                <p className="text-sm text-gray-500">
                  {currentRoom.memberCount} members
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-500">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {user?.username}
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <div className="font-medium">{user?.username}</div>
                      <div className="text-gray-500">Online</div>
              </div>
                    <button
                onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex">
          {currentRoom ? (
            <MessageArea 
              room={currentRoom}
              isConnected={isConnected}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Welcome to Chat
                </h3>
                <p className="text-gray-500 mb-4">
                  Select a room from the sidebar to start chatting
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{onlineUsers.length} online</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{rooms.length} rooms</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat; 