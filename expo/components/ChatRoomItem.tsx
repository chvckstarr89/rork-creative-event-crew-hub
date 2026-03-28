import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChatRoom } from '@/types/chat';
import { theme } from '@/constants/theme';
import { MessageCircle, Users } from 'lucide-react-native';

interface ChatRoomItemProps {
  room: ChatRoom;
  onPress: () => void;
  isActive?: boolean;
}

export function ChatRoomItem({ room, onPress, isActive = false }: ChatRoomItemProps) {
  const formatLastMessageTime = (date?: Date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={onPress}
      testID={`chat-room-${room.id}`}
    >
      <View style={styles.iconContainer}>
        {room.eventId ? (
          <MessageCircle size={24} color={theme.colors.primary} />
        ) : (
          <Users size={24} color={theme.colors.textSecondary} />
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.roomName, isActive && styles.activeText]} numberOfLines={1}>
            {room.name}
          </Text>
          {room.lastMessage && (
            <Text style={styles.timestamp}>
              {formatLastMessageTime(room.lastMessage.timestamp)}
            </Text>
          )}
        </View>
        
        <View style={styles.footer}>
          {room.lastMessage ? (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {room.lastMessage.senderName}: {room.lastMessage.content}
            </Text>
          ) : (
            <Text style={styles.noMessages}>No messages yet</Text>
          )}
          
          {room.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {room.unreadCount > 99 ? '99+' : room.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activeContainer: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  roomName: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600' as const,
    color: theme.colors.text,
    flex: 1,
  },
  activeText: {
    color: theme.colors.primary,
  },
  timestamp: {
    fontSize: theme.typography.tiny.fontSize,
    color: theme.colors.textTertiary,
    marginLeft: theme.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  noMessages: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  unreadText: {
    fontSize: theme.typography.tiny.fontSize,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});