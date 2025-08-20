import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Note } from '@/types/event';
import { theme } from '@/constants/theme';

interface NoteItemProps {
  note: Note;
  isCurrentUser?: boolean;
}

export function NoteItem({ note, isCurrentUser = false }: NoteItemProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, isCurrentUser && styles.currentUserContainer]}>
      {!isCurrentUser && (
        <View style={styles.avatarContainer}>
          {note.authorAvatar ? (
            <Image source={{ uri: note.authorAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{note.author[0]}</Text>
            </View>
          )}
        </View>
      )}
      
      <View style={[styles.bubble, isCurrentUser && styles.currentUserBubble]}>
        {!isCurrentUser && (
          <Text style={styles.author}>{note.author}</Text>
        )}
        <Text style={[styles.content, isCurrentUser && styles.currentUserContent]}>
          {note.content}
        </Text>
        <Text style={[styles.time, isCurrentUser && styles.currentUserTime]}>
          {formatTime(note.timestamp)}
        </Text>
      </View>

      {isCurrentUser && (
        <View style={styles.avatarContainer}>
          {note.authorAvatar ? (
            <Image source={{ uri: note.authorAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, styles.currentUserAvatar]}>
              <Text style={styles.avatarText}>Y</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  currentUserContainer: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: theme.spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentUserAvatar: {
    backgroundColor: theme.colors.accent,
  },
  avatarText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  bubble: {
    maxWidth: '75%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderTopLeftRadius: 4,
  },
  currentUserBubble: {
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: 4,
    marginLeft: theme.spacing.sm,
    marginRight: 0,
  },
  author: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  content: {
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    lineHeight: 20,
  },
  currentUserContent: {
    color: theme.colors.background,
  },
  time: {
    color: theme.colors.textTertiary,
    fontSize: theme.typography.tiny.fontSize,
    marginTop: 4,
  },
  currentUserTime: {
    color: theme.colors.background + '80',
  },
});