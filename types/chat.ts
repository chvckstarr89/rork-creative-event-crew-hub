export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  eventId?: string;
  isRead: boolean;
  replyTo?: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
}

export interface ChatRoom {
  id: string;
  name: string;
  eventId?: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface ChatState {
  rooms: ChatRoom[];
  messages: { [roomId: string]: ChatMessage[] };
  activeRoom: string | null;
  typingUsers: { [roomId: string]: TypingIndicator[] };
  isLoading: boolean;
}