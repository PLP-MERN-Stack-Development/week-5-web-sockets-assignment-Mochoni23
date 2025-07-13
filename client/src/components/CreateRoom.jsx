import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { X, Users, Lock, Globe } from 'lucide-react';
import useChatStore from '../store/chatStore';

const CreateRoom = ({ onClose, onRoomCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    isPrivate: false,
    members: []
  });
  const [errors, setErrors] = useState({});
  
  const { createRoom, onlineUsers } = useChatStore();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Room name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Room name must be at least 3 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      createRoom(formData.name, formData.isPrivate, formData.members);
      onRoomCreated && onRoomCreated({
        id: `room_${Date.now()}`,
        name: formData.name,
        isPrivate: formData.isPrivate,
        memberCount: formData.members.length + 1
      });
      onClose();
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const toggleMember = (userId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Create New Room</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            Create a new chat room for your conversations
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Room Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter room name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isPrivate"
                  checked={formData.isPrivate}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Private Room
                </span>
                {formData.isPrivate ? (
                  <Lock className="w-4 h-4 text-gray-500" />
                ) : (
                  <Globe className="w-4 h-4 text-gray-500" />
                )}
              </label>
              <p className="text-xs text-gray-500">
                Private rooms are only visible to invited members
              </p>
            </div>
            
            {formData.isPrivate && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Invite Members
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {onlineUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.members.includes(user.id)}
                        onChange={() => toggleMember(user.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {user.username}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {formData.members.length} member(s) selected
                </p>
              </div>
            )}
            
            <div className="flex space-x-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
              >
                Create Room
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateRoom; 