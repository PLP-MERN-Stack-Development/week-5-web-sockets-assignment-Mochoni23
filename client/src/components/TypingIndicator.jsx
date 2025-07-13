import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const TypingIndicator = ({ users }) => {
  if (!users || users.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user, index) => (
          <Avatar key={user.id} className="w-6 h-6 border-2 border-white">
            <AvatarImage src={user.avatar} alt={user.username} />
            <AvatarFallback className="text-xs">
              {user.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      
      <div className="flex items-center space-x-1">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-sm text-gray-500">
          {users.length === 1 
            ? `${users[0].username} is typing...`
            : `${users.length} people are typing...`
          }
        </span>
      </div>
    </div>
  );
};

export default TypingIndicator; 