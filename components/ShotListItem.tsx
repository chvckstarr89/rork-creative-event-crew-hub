import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Check, Clock, MapPin, Camera, Video, Users } from 'lucide-react-native';
import { ShotItem } from '@/types/event';
import { theme } from '@/constants/theme';

interface ShotListItemProps {
  shot: ShotItem;
  onToggle: () => void;
  teamMembers?: { id: string; name: string }[];
}

export function ShotListItem({ shot, onToggle, teamMembers = [] }: ShotListItemProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onToggle();
  };

  const getPriorityColor = () => {
    switch (shot.priority) {
      case 'high': return theme.colors.accent;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.textSecondary;
    }
  };

  const getTypeIcon = () => {
    switch (shot.type) {
      case 'photo': return <Camera size={16} color={theme.colors.primary} />;
      case 'video': return <Video size={16} color={theme.colors.primary} />;
      case 'both': return (
        <View style={styles.bothIcons}>
          <Camera size={14} color={theme.colors.primary} />
          <Video size={14} color={theme.colors.primary} />
        </View>
      );
    }
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity 
        style={[styles.content, shot.completed && styles.completedContent]}
        onPress={handlePress}
        activeOpacity={0.8}
        testID={`shot-item-${shot.id}`}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <TouchableOpacity 
              style={[styles.checkbox, shot.completed && styles.checkboxCompleted]}
              onPress={handlePress}
            >
              {shot.completed && <Check size={16} color={theme.colors.background} />}
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, shot.completed && styles.completedText]}>
                {shot.title}
              </Text>
              {shot.description && (
                <Text style={[styles.description, shot.completed && styles.completedText]}>
                  {shot.description}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.typeContainer}>
            {getTypeIcon()}
          </View>
        </View>

        <View style={styles.metadata}>
          {shot.time && (
            <View style={styles.metaItem}>
              <Clock size={12} color={theme.colors.textTertiary} />
              <Text style={styles.metaText}>{shot.time}</Text>
            </View>
          )}
          {shot.location && (
            <View style={styles.metaItem}>
              <MapPin size={12} color={theme.colors.textTertiary} />
              <Text style={styles.metaText}>{shot.location}</Text>
            </View>
          )}
          {shot.assignedTo && shot.assignedTo.length > 0 && (
            <View style={styles.metaItem}>
              <Users size={12} color={theme.colors.textTertiary} />
              <Text style={styles.metaText}>
                {shot.assignedTo.map(id => 
                  teamMembers.find(m => m.id === id)?.name || id
                ).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {shot.equipment && shot.equipment.length > 0 && (
          <View style={styles.equipment}>
            {shot.equipment.map((item, index) => (
              <View key={index} style={styles.equipmentTag}>
                <Text style={styles.equipmentText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor() }]} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
  },
  content: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  completedContent: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  checkboxCompleted: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
    lineHeight: 18,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: theme.colors.textTertiary,
  },
  typeContainer: {
    marginLeft: theme.spacing.sm,
  },
  bothIcons: {
    flexDirection: 'row',
    gap: 2,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: theme.colors.textTertiary,
    fontSize: theme.typography.tiny.fontSize,
  },
  equipment: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  equipmentTag: {
    backgroundColor: theme.colors.glass,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  equipmentText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.tiny.fontSize,
  },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
});