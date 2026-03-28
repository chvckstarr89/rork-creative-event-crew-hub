import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Coffee, Camera, Truck, Clock } from 'lucide-react-native';
import { TimelineItem as TimelineItemType } from '@/types/event';
import { theme } from '@/constants/theme';

interface TimelineItemProps {
  item: TimelineItemType;
  isLast: boolean;
  isActive?: boolean;
}

export function TimelineItem({ item, isLast, isActive = false }: TimelineItemProps) {
  const getIcon = () => {
    switch (item.type) {
      case 'preparation': return <Truck size={16} color={theme.colors.text} />;
      case 'shooting': return <Camera size={16} color={theme.colors.text} />;
      case 'break': return <Coffee size={16} color={theme.colors.text} />;
      case 'transition': return <Clock size={16} color={theme.colors.text} />;
    }
  };

  const getTypeColor = () => {
    switch (item.type) {
      case 'preparation': return theme.colors.primary;
      case 'shooting': return theme.colors.accent;
      case 'break': return theme.colors.warning;
      case 'transition': return theme.colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.timeContainer}>
        <Text style={[styles.time, isActive && styles.activeTime]}>{item.time}</Text>
      </View>
      
      <View style={styles.lineContainer}>
        <View style={[styles.dot, { backgroundColor: getTypeColor() }, isActive && styles.activeDot]}>
          {getIcon()}
        </View>
        {!isLast && <View style={styles.line} />}
      </View>

      <View style={[styles.content, isActive && styles.activeContent]}>
        <Text style={[styles.title, isActive && styles.activeTitle]}>{item.title}</Text>
        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}
        <View style={[styles.typeTag, { backgroundColor: getTypeColor() + '20' }]}>
          <Text style={[styles.typeText, { color: getTypeColor() }]}>
            {item.type}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingBottom: theme.spacing.lg,
  },
  timeContainer: {
    width: 60,
    paddingTop: 4,
  },
  time: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600' as const,
  },
  activeTime: {
    color: theme.colors.primary,
  },
  lineContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  activeDot: {
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  line: {
    position: 'absolute',
    top: 32,
    bottom: -theme.spacing.lg,
    width: 2,
    backgroundColor: theme.colors.border,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  activeContent: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  activeTitle: {
    color: theme.colors.primary,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
    marginBottom: theme.spacing.sm,
  },
  typeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.xs,
  },
  typeText: {
    fontSize: theme.typography.tiny.fontSize,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
});