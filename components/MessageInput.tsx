import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Platform,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
import { Send, Paperclip, Camera } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useChat } from '@/hooks/chat-store';

interface MessageInputProps {
  roomId: string;
}

export function MessageInput({ roomId }: MessageInputProps) {
  const [message, setMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { sendMessage, startTyping, stopTyping, isSending } = useChat();

  const handleSend = () => {
    if (message.trim() && !isSending) {
      sendMessage(roomId, message.trim());
      setMessage('');
      stopTyping(roomId);
      setIsTyping(false);
    }
  };

  const handleTextChange = (text: string) => {
    setMessage(text);
    
    if (text.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(roomId);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        stopTyping(roomId);
        setIsTyping(false);
      }
    }, 1000) as ReturnType<typeof setTimeout>;
  };

  const handleAttachment = () => {
    Alert.alert(
      'Add Attachment',
      'Choose attachment type',
      [
        { text: 'Camera', onPress: () => console.log('Camera selected') },
        { text: 'Photo Library', onPress: () => console.log('Photo library selected') },
        { text: 'File', onPress: () => console.log('File selected') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleCamera = () => {
    Alert.alert(
      'Camera',
      'Camera functionality will be available soon',
      [{ text: 'OK' }]
    );
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        stopTyping(roomId);
      }
    };
  }, [roomId, stopTyping, isTyping]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachmentButton}
          onPress={handleAttachment}
          testID="attachment-button"
        >
          <Paperclip size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={message}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          maxLength={1000}
          testID="message-input"
        />
        
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={handleCamera}
          testID="camera-button"
        >
          <Camera size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!message.trim() || isSending) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!message.trim() || isSending}
          testID="send-button"
        >
          <Send 
            size={20} 
            color={message.trim() && !isSending ? '#FFFFFF' : theme.colors.textTertiary} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 56,
  },
  attachmentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    backgroundColor: theme.colors.backgroundSecondary,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  cameraButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
});