import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  SafeAreaView,
  Platform
} from 'react-native';
import { Stack } from 'expo-router';
import { MessageCircle, ArrowLeft } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useChat } from '@/hooks/chat-store';
import { useAuth } from '@/hooks/auth-store';
import { ChatRoomItem } from '@/components/ChatRoomItem';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageInput } from '@/components/MessageInput';
import { TypingIndicatorComponent } from '@/components/TypingIndicator';
import { ChatMessage } from '@/types/chat';

export default function ChatScreen() {
  const { user } = useAuth();
  const { 
    rooms, 
    activeRoom, 
    setActiveRoom, 
    getRoomMessages, 
    typingUsers,
    getUnreadCount,
    isLoading 
  } = useChat();
  
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const currentRoom = rooms.find(room => room.id === selectedRoom);
  const messages = selectedRoom ? getRoomMessages(selectedRoom) : [];
  const roomTypingUsers = selectedRoom ? (typingUsers[selectedRoom] || []) : [];
  const totalUnreadCount = getUnreadCount();

  useEffect(() => {
    if (selectedRoom) {
      setActiveRoom(selectedRoom);
    }
  }, [selectedRoom, setActiveRoom]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoom(roomId);
  };

  const handleBackToRooms = () => {
    setSelectedRoom(null);
    setActiveRoom(null);
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const isConsecutive = !!(previousMessage && 
      previousMessage.senderId === item.senderId &&
      (item.timestamp.getTime() - previousMessage.timestamp.getTime()) < 60000); // Within 1 minute

    return (
      <MessageBubble 
        message={item} 
        isConsecutive={isConsecutive}
      />
    );
  };

  const renderRoomItem = ({ item }: { item: typeof rooms[0] }) => (
    <ChatRoomItem
      room={item}
      onPress={() => handleRoomSelect(item.id)}
      isActive={item.id === selectedRoom}
    />
  );

  if (!user) {
    return (
      <>
        <Stack.Screen 
          options={{ 
            title: "Team Chat",
            headerLargeTitle: true,
            headerStyle: {
              backgroundColor: theme.colors.background,
            },
            headerTintColor: theme.colors.text,
            headerLargeTitleStyle: {
              color: theme.colors.text,
              fontWeight: '700' as const,
            },
            headerShadowVisible: false,
          }} 
        />
        
        <View style={styles.container}>
          <View style={styles.emptyState}>
            <MessageCircle size={48} color={theme.colors.textTertiary} />
            <Text style={styles.emptyTitle}>Please log in to access chat</Text>
            <Text style={styles.emptyText}>You need to be logged in to participate in team conversations</Text>
          </View>
        </View>
      </>
    );
  }

  if (selectedRoom && currentRoom) {
    // Chat room view
    return (
      <>
        <Stack.Screen 
          options={{ 
            title: currentRoom.name,
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.text,
            headerShadowVisible: true,
            headerLeft: () => (
              <TouchableOpacity
                onPress={handleBackToRooms}
                style={styles.backButton}
                testID="back-to-rooms"
              >
                <ArrowLeft size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            ),
          }} 
        />
        
        <SafeAreaView style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />
          
          <TypingIndicatorComponent typingUsers={roomTypingUsers} />
          
          <MessageInput roomId={selectedRoom} />
        </SafeAreaView>
      </>
    );
  }

  // Rooms list view
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Team Chat",
          headerLargeTitle: true,
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
          headerLargeTitleStyle: {
            color: theme.colors.text,
            fontWeight: '700' as const,
          },
          headerShadowVisible: false,
          headerRight: () => totalUnreadCount > 0 ? (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </Text>
            </View>
          ) : null,
        }} 
      />
      
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.emptyState}>
            <MessageCircle size={48} color={theme.colors.textTertiary} />
            <Text style={styles.emptyTitle}>Loading chats...</Text>
          </View>
        ) : rooms.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageCircle size={48} color={theme.colors.textTertiary} />
            <Text style={styles.emptyTitle}>No chat rooms available</Text>
            <Text style={styles.emptyText}>Chat rooms will appear here when you join events</Text>
          </View>
        ) : (
          <FlatList
            data={rooms}
            renderItem={renderRoomItem}
            keyExtractor={(item) => item.id}
            style={styles.roomsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
    textAlign: 'center',
    lineHeight: 22,
  },
  roomsList: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: theme.spacing.sm,
  },
  backButton: {
    marginLeft: Platform.OS === 'ios' ? 0 : theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  headerBadge: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  headerBadgeText: {
    fontSize: theme.typography.tiny.fontSize,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});