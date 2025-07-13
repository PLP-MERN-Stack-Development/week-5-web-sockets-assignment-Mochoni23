import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Edit2, Trash2, Download, Eye } from 'lucide-react';

const Message = ({ message, isOwnMessage, currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(message.content);
  };

  const handleSave = () => {
    // TODO: Implement message editing
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleDelete = () => {
    // TODO: Implement message deletion
  };

  const handleFileDownload = () => {
    if (message.fileData) {
      const link = document.createElement('a');
      link.href = `data:${message.fileData.type};base64,${message.fileData.data}`;
      link.download = message.content;
      link.click();
    }
  };

  const renderMessageContent = () => {
    if (message.type === 'file') {
      return (
        <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border">
          <Download className="w-4 h-4 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{message.content}</p>
            <p className="text-xs text-gray-500">
              {message.fileData?.size ? `${(message.fileData.size / 1024).toFixed(1)} KB` : ''}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFileDownload}
            className="text-blue-600 hover:text-blue-700"
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      );
    }

    if (message.type === 'image') {
      return (
        <div className="space-y-2">
          <img
            src={`data:${message.fileData?.type};base64,${message.fileData?.data}`}
            alt={message.content}
            className="max-w-xs rounded-lg"
          />
          {message.content && (
            <p className="text-sm text-gray-700">{message.content}</p>
          )}
        </div>
      );
    }

    return (
      <p className="text-sm text-gray-900 whitespace-pre-wrap">{message.content}</p>
    );
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {!isOwnMessage && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={message.senderAvatar} alt={message.senderName} />
            <AvatarFallback>
              {message.senderName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {!isOwnMessage && (
            <p className="text-xs text-gray-500 mb-1">{message.senderName}</p>
          )}
          
          <Card className={`p-3 ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-white'}`}>
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 text-sm border rounded resize-none"
                  rows={3}
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleSave}>Save</Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {renderMessageContent()}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs opacity-70">
                      {formatTime(message.timestamp)}
                    </span>
                    {message.edited && (
                      <span className="text-xs opacity-70">(edited)</span>
                    )}
                  </div>
                  
                  {isOwnMessage && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEdit}
                        className="p-1 h-6 w-6"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="p-1 h-6 w-6 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Message; 