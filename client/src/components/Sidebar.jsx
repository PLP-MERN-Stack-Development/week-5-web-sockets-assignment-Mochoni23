import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card } from './ui/card';
import { 
  MessageCircle, 
  Users, 
  Search, 
  Plus, 
  Settings,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Hash,
  LogOut,
  User
} from 'lucide-react';
import CreateRoom from './CreateRoom';
import useAuthStore from '../store/authStore';

const Sidebar = ({ 
  isOpen, 
  onToggle, 
  currentRoom, 
  onRoomSelect, 
  rooms, 
  onlineUsers, 
  unreadCount,
  activeTab,
  onTabChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = onlineUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoomClick = (room) => {
    onRoomSelect(room);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="hidden md:flex"
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search rooms or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => onTabChange('chat')}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'chat'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <MessageCircle className="w-4 h-4" />
            <span>Chats</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => onTabChange('users')}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Users</span>
            <span className="text-xs text-gray-400">
              {onlineUsers.length}
            </span>
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chat' ? (
          <div className="p-4">
            {/* Create Room Button */}
            <Button
              onClick={() => setShowCreateRoom(true)}
              className="w-full mb-4"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>

            {/* Rooms List */}
            <div className="space-y-2">
              {filteredRooms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Hash className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No rooms found</p>
                </div>
              ) : (
                filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => handleRoomClick(room)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      currentRoom?.id === room.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Hash className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {room.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {room.memberCount} members
                          </p>
                        </div>
                      </div>
                      {room.isPrivate && (
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="p-4">
            {/* Online Users */}
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No users found</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback>
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {user.username}
                          </h3>
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                        </div>
                        <p className="text-xs text-gray-500">
                          Last seen {formatTime(user.lastSeen)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.avatar} alt={user?.username} />
            <AvatarFallback>
              {user?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {user?.username}
            </h3>
            <p className="text-xs text-gray-500">Online</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <CreateRoom
          onClose={() => setShowCreateRoom(false)}
          onRoomCreated={(room) => {
            setShowCreateRoom(false);
            handleRoomClick(room);
          }}
        />
      )}
    </div>
  );
};

export default Sidebar; 