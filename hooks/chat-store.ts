import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChatMessage, ChatRoom, ChatState, TypingIndicator } from '@/types/chat';
import { useAuth } from './auth-store';

const STORAGE_KEY = 'chat_data';

// Mock data for demo
const mockRooms: ChatRoom[] = [
  {
    id: 'general',
    name: 'General Chat',
    participants: ['1', '2', '3'],
    unreadCount: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    updatedAt: new Date(),
  },
  {
    id: 'event-1',
    name: 'Sarah & Mike Wedding',
    eventId: '1',
    participants: ['1', '2', '3'],
    unreadCount: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: 'event-2',
    name: 'Corporate Event',
    eventId: '2',
    participants: ['1', '2'],
    unreadCount: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  }
];

const mockMessages: { [roomId: string]: ChatMessage[] } = {
  'general': [
    {
      id: '1',
      senderId: '2',
      senderName: 'Maria Rodriguez',
      content: 'Hey everyone! Ready for the weekend shoots?',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      isRead: true,
    },
    {
      id: '2',
      senderId: '1',
      senderName: 'Alex Chen',
      content: 'Absolutely! Just finished prepping all my gear.',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      isRead: true,
    },
    {
      id: '3',
      senderId: '3',
      senderName: 'Sarah Johnson',
      content: 'Thanks for all your hard work team! 🙏',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      isRead: false,
    }
  ],
  'event-1': [
    {
      id: '4',
      senderId: '3',
      senderName: 'Sarah Johnson',
      content: 'The venue looks amazing! Can\'t wait to see the photos.',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      isRead: false,
    },
    {
      id: '5',
      senderId: '1',
      senderName: 'Alex Chen',
      content: 'Just arrived at the venue. The lighting is perfect!',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      isRead: false,
    }
  ],
  'event-2': [
    {
      id: '6',
      senderId: '2',
      senderName: 'Maria Rodriguez',
      content: 'Equipment check complete. All cameras are ready to go.',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      isRead: true,
    }
  ]
};

export const [ChatProvider, useChat] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [chatState, setChatState] = useState<ChatState>({
    rooms: [],
    messages: {},
    activeRoom: null,
    typingUsers: {},
    isLoading: true
  });

  const chatQuery = useQuery({
    queryKey: ['chat'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          // Convert date strings back to Date objects
          const rooms = data.rooms.map((room: any) => ({
            ...room,
            createdAt: new Date(room.createdAt),
            updatedAt: new Date(room.updatedAt),
            lastMessage: room.lastMessage ? {
              ...room.lastMessage,
              timestamp: new Date(room.lastMessage.timestamp)
            } : undefined
          }));
          
          const messages: { [roomId: string]: ChatMessage[] } = {};
          Object.keys(data.messages).forEach(roomId => {
            messages[roomId] = data.messages[roomId].map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
          });
          
          return { rooms, messages };
        }
        return { rooms: mockRooms, messages: mockMessages };
      } catch (error) {
        console.error('Error loading chat data:', error);
        return { rooms: mockRooms, messages: mockMessages };
      }
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ roomId, content, type = 'text' }: { roomId: string; content: string; type?: 'text' | 'image' | 'file' }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: user.id,
        senderName: user.name,
        senderAvatar: user.avatar,
        content,
        type,
        timestamp: new Date(),
        isRead: false
      };
      
      return { roomId, message: newMessage };
    },
    onSuccess: ({ roomId, message }) => {
      setChatState(prev => {
        const updatedMessages = {
          ...prev.messages,
          [roomId]: [...(prev.messages[roomId] || []), message]
        };
        
        const updatedRooms = prev.rooms.map(room => 
          room.id === roomId 
            ? { ...room, lastMessage: message, updatedAt: new Date() }
            : room
        );
        
        const newState = {
          ...prev,
          messages: updatedMessages,
          rooms: updatedRooms
        };
        
        // Save to storage
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
          rooms: newState.rooms,
          messages: newState.messages
        }));
        
        return newState;
      });
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (roomId: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      return roomId;
    },
    onSuccess: (roomId) => {
      setChatState(prev => {
        const updatedMessages = {
          ...prev.messages,
          [roomId]: prev.messages[roomId]?.map(msg => ({ ...msg, isRead: true })) || []
        };
        
        const updatedRooms = prev.rooms.map(room => 
          room.id === roomId 
            ? { ...room, unreadCount: 0 }
            : room
        );
        
        return {
          ...prev,
          messages: updatedMessages,
          rooms: updatedRooms
        };
      });
    }
  });

  useEffect(() => {
    if (chatQuery.data) {
      setChatState(prev => ({
        ...prev,
        rooms: chatQuery.data.rooms,
        messages: chatQuery.data.messages,
        isLoading: false
      }));
    }
  }, [chatQuery.data]);

  const sendMessage = useCallback((roomId: string, content: string, type: 'text' | 'image' | 'file' = 'text') => {
    sendMessageMutation.mutate({ roomId, content, type });
  }, [sendMessageMutation.mutate]);

  const setActiveRoom = useCallback((roomId: string | null) => {
    setChatState(prev => ({ ...prev, activeRoom: roomId }));
    if (roomId) {
      markAsReadMutation.mutate(roomId);
    }
  }, [markAsReadMutation.mutate]);

  const getUnreadCount = useCallback(() => {
    return chatState.rooms.reduce((total, room) => total + room.unreadCount, 0);
  }, [chatState.rooms]);

  const getRoomMessages = useCallback((roomId: string) => {
    return chatState.messages[roomId] || [];
  }, [chatState.messages]);

  const startTyping = useCallback((roomId: string) => {
    if (!user) return;
    
    setChatState(prev => {
      const roomTyping = prev.typingUsers[roomId] || [];
      const existingIndex = roomTyping.findIndex(t => t.userId === user.id);
      
      let updatedTyping;
      if (existingIndex >= 0) {
        updatedTyping = roomTyping.map((t, i) => 
          i === existingIndex ? { ...t, timestamp: new Date() } : t
        );
      } else {
        updatedTyping = [...roomTyping, {
          userId: user.id,
          userName: user.name,
          timestamp: new Date()
        }];
      }
      
      return {
        ...prev,
        typingUsers: {
          ...prev.typingUsers,
          [roomId]: updatedTyping
        }
      };
    });
  }, [user]);

  const stopTyping = useCallback((roomId: string) => {
    if (!user) return;
    
    setChatState(prev => ({
      ...prev,
      typingUsers: {
        ...prev.typingUsers,
        [roomId]: (prev.typingUsers[roomId] || []).filter(t => t.userId !== user.id)
      }
    }));
  }, [user]);

  // Clean up old typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      setChatState(prev => {
        const now = new Date();
        const updatedTypingUsers: { [roomId: string]: TypingIndicator[] } = {};
        
        Object.keys(prev.typingUsers).forEach(roomId => {
          updatedTypingUsers[roomId] = prev.typingUsers[roomId].filter(
            t => now.getTime() - t.timestamp.getTime() < 3000 // 3 seconds
          );
        });
        
        return { ...prev, typingUsers: updatedTypingUsers };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => ({
    ...chatState,
    sendMessage,
    setActiveRoom,
    getUnreadCount,
    getRoomMessages,
    startTyping,
    stopTyping,
    isSending: sendMessageMutation.isPending,
    sendError: sendMessageMutation.error?.message
  }), [
    chatState,
    sendMessage,
    setActiveRoom,
    getUnreadCount,
    getRoomMessages,
    startTyping,
    stopTyping,
    sendMessageMutation.isPending,
    sendMessageMutation.error?.message
  ]);
});