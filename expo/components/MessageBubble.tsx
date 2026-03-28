import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '@/types/chat';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-store';

interface MessageBubbleProps {
  message: ChatMessage;
  isConsecutive?: boolean;
}

export function MessageBubble({ message, isConsecutive = false }: MessageBubbleProps) {
  const { user } = useAuth();
  const isOwnMessage = message.senderId === user?.id;
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessage : styles.otherMessage,
      isConsecutive && styles.consecutive
    ]}>
      {!isOwnMessage && !isConsecutive && (
        <Text style={styles.senderName}>{message.senderName}</Text>
      )}
      
      <View style={[
        styles.bubble,
        isOwnMessage ? styles.ownBubble : styles.otherBubble
      ]}>
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {message.content}
        </Text>
      </View>
      
      <Text style={[
        styles.timestamp,
        isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp
      ]}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  consecutive: {
    marginTop: 2,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: theme.typography.tiny.fontSize,
    fontWeight: '600' as const,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  ownBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: theme.spacing.xs,
  },
  otherBubble: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: theme.spacing.xs,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: theme.typography.body.fontSize,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: theme.typography.tiny.fontSize,
    marginTop: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
  },
  ownTimestamp: {
    color: theme.colors.textTertiary,
    textAlign: 'right',
  },
  otherTimestamp: {
    color: theme.colors.textTertiary,
    textAlign: 'left',
  },
});