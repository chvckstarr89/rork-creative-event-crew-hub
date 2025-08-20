import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '@/constants/theme';
import { TypingIndicator } from '@/types/chat';

interface TypingIndicatorProps {
  typingUsers: TypingIndicator[];
}

export function TypingIndicatorComponent({ typingUsers }: TypingIndicatorProps) {
  const [dotAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (typingUsers.length > 0) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnimation, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [typingUsers.length, dotAnimation]);

  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing`;
    } else {
      return `${typingUsers[0].userName} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>{getTypingText()}</Text>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dotAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 1, 0.3],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dotAnimation.interpolate({
                  inputRange: [0, 0.2, 0.7, 1],
                  outputRange: [0.3, 0.3, 1, 0.3],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dotAnimation.interpolate({
                  inputRange: [0, 0.4, 0.9, 1],
                  outputRange: [0.3, 0.3, 0.3, 1],
                }),
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: theme.spacing.sm,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.textSecondary,
    marginHorizontal: 1,
  },
});