import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, MapPin, Users } from 'lucide-react-native';
import { Event } from '@/types/event';
import { theme } from '@/constants/theme';
import { BlurView } from 'expo-blur';

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

export function EventCard({ event, onPress }: EventCardProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = () => {
    switch (event.status) {
      case 'active': return theme.colors.success;
      case 'upcoming': return theme.colors.primary;
      case 'completed': return theme.colors.textSecondary;
      default: return theme.colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.9}
      testID={`event-card-${event.id}`}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: event.coverImage }} style={styles.image} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />
        <View style={styles.statusBadge}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} style={styles.blurBadge}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={styles.statusText}>{event.status}</Text>
            </BlurView>
          ) : (
            <View style={[styles.androidBadge, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={styles.statusText}>{event.status}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.type}>{event.type.toUpperCase()}</Text>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.client}>{event.client}</Text>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Calendar size={14} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{formatDate(event.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={14} color={theme.colors.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>{event.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Users size={14} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{event.team.length} crew</Text>
          </View>
        </View>

        <View style={styles.teamContainer}>
          {event.team.slice(0, 3).map((member, index) => (
            <View key={member.id} style={[styles.avatar, { marginLeft: index > 0 ? -12 : 0 }]}>
              {member.avatar ? (
                <Image source={{ uri: member.avatar }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: event.color }]}>
                  <Text style={styles.avatarText}>{member.name[0]}</Text>
                </View>
              )}
              {member.isOnline && <View style={styles.onlineIndicator} />}
            </View>
          ))}
          {event.team.length > 3 && (
            <View style={[styles.avatar, styles.moreAvatar, { marginLeft: -12 }]}>
              <Text style={styles.moreText}>+{event.team.length - 3}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  imageContainer: {
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  statusBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
  },
  blurBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  androidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    color: theme.colors.text,
    fontSize: theme.typography.tiny.fontSize,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  content: {
    padding: theme.spacing.lg,
  },
  type: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.tiny.fontSize,
    fontWeight: '600' as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    marginBottom: 4,
  },
  client: {
    color: theme.colors.textTertiary,
    fontSize: theme.typography.caption.fontSize,
    marginBottom: theme.spacing.md,
  },
  details: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
    marginLeft: 8,
    flex: 1,
  },
  teamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  moreAvatar: {
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
});