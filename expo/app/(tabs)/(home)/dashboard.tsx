import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { Clock, Camera, Video, MapPin, Users, CheckCircle2, Circle, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { useEvents } from '@/hooks/events-store';
import { Event, TimelineItem, ShotItem } from '@/types/event';

export default function DashboardScreen() {
  const eventsContext = useEvents();
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  if (!eventsContext) {
    return (
      <View style={styles.container}>
        <View style={styles.noEventContainer}>
          <Text style={styles.noEventTitle}>Loading...</Text>
        </View>
      </View>
    );
  }

  const { events, isLoading, toggleShotComplete } = eventsContext;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const activeEvent = useMemo(() => {
    return events.find((e: Event) => e.status === 'active');
  }, [events]);

  const getCurrentTimelineItem = (event: Event): TimelineItem | null => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (let i = 0; i < event.timeline.length; i++) {
      const item = event.timeline[i];
      const [hours, minutes] = item.time.split(':').map(t => parseInt(t.replace(/[^0-9]/g, '')));
      const itemTime = hours * 60 + minutes;
      
      const nextItem = event.timeline[i + 1];
      if (nextItem) {
        const [nextHours, nextMinutes] = nextItem.time.split(':').map(t => parseInt(t.replace(/[^0-9]/g, '')));
        const nextItemTime = nextHours * 60 + nextMinutes;
        
        if (currentTime >= itemTime && currentTime < nextItemTime) {
          return item;
        }
      } else if (currentTime >= itemTime) {
        return item;
      }
    }
    
    return event.timeline[0] || null;
  };

  const getRelevantShots = (event: Event): ShotItem[] => {
    const currentItem = getCurrentTimelineItem(event);
    if (!currentItem) return event.shotList.filter(shot => !shot.completed).slice(0, 3);
    
    const currentTime = currentItem.time;
    return event.shotList.filter(shot => {
      if (shot.completed) return false;
      if (!shot.time) return true;
      
      const shotHour = parseInt(shot.time.split(':')[0]);
      const currentHour = parseInt(currentTime.split(':')[0]);
      
      return Math.abs(shotHour - currentHour) <= 2;
    }).slice(0, 4);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (!activeEvent) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.noEventContainer, { opacity: fadeAnim }]}>
          <Calendar size={64} color={theme.colors.textSecondary} />
          <Text style={styles.noEventTitle}>No Active Event</Text>
          <Text style={styles.noEventText}>
            When you have an active event, this will be your command center
          </Text>
          <TouchableOpacity 
            style={styles.viewEventsButton}
            onPress={() => router.push('/schedule')}
          >
            <Text style={styles.viewEventsButtonText}>View All Events</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  const currentTimelineItem = getCurrentTimelineItem(activeEvent);
  const relevantShots = getRelevantShots(activeEvent);

  return (
    <View style={styles.container}>
      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Event Hero Section */}
        <ImageBackground
          source={{ uri: activeEvent.coverImage }}
          style={styles.heroSection}
          imageStyle={styles.heroImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            style={styles.heroOverlay}
          >
            <View style={styles.heroContent}>
              <Text style={styles.eventTitle}>{activeEvent.title}</Text>
              <View style={styles.eventMeta}>
                <MapPin size={16} color="white" />
                <Text style={styles.eventLocation}>{activeEvent.location}</Text>
              </View>
              <View style={styles.teamContainer}>
                <Users size={16} color="white" />
                <Text style={styles.teamText}>{activeEvent.team.length} team members</Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* Current Timeline Section */}
        {currentTimelineItem && (
          <View style={styles.currentSection}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Current Activity</Text>
            </View>
            <View style={[styles.timelineCard, { borderLeftColor: activeEvent.color }]}>
              <Text style={styles.timelineTime}>{currentTimelineItem.time}</Text>
              <Text style={styles.timelineTitle}>{currentTimelineItem.title}</Text>
              {currentTimelineItem.description && (
                <Text style={styles.timelineDescription}>{currentTimelineItem.description}</Text>
              )}
              <View style={[styles.timelineType, { backgroundColor: activeEvent.color + '20' }]}>
                <Text style={[styles.timelineTypeText, { color: activeEvent.color }]}>
                  {currentTimelineItem.type.charAt(0).toUpperCase() + currentTimelineItem.type.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Relevant Shots Section */}
        {relevantShots.length > 0 && (
          <View style={styles.shotsSection}>
            <View style={styles.sectionHeader}>
              <Camera size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Priority Shots</Text>
            </View>
            {relevantShots.map((shot) => (
              <TouchableOpacity
                key={shot.id}
                style={styles.shotCard}
                onPress={() => toggleShotComplete(activeEvent.id, shot.id)}
                activeOpacity={0.7}
              >
                <View style={styles.shotHeader}>
                  <View style={styles.shotInfo}>
                    {shot.completed ? (
                      <CheckCircle2 size={20} color={theme.colors.success} />
                    ) : (
                      <Circle size={20} color={theme.colors.textSecondary} />
                    )}
                    <Text style={[styles.shotTitle, shot.completed && styles.shotTitleCompleted]}>
                      {shot.title}
                    </Text>
                  </View>
                  <View style={styles.shotMeta}>
                    {shot.type === 'photo' && <Camera size={14} color={theme.colors.textSecondary} />}
                    {shot.type === 'video' && <Video size={14} color={theme.colors.textSecondary} />}
                    {shot.type === 'both' && (
                      <View style={styles.bothIcons}>
                        <Camera size={12} color={theme.colors.textSecondary} />
                        <Video size={12} color={theme.colors.textSecondary} />
                      </View>
                    )}
                  </View>
                </View>
                {shot.time && (
                  <Text style={styles.shotTime}>{shot.time}</Text>
                )}
                {shot.description && (
                  <Text style={styles.shotDescription}>{shot.description}</Text>
                )}
                {shot.priority === 'high' && (
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityText}>High Priority</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push(`/(tabs)/(home)/${activeEvent.id}`)}
          >
            <Text style={styles.actionButtonText}>View Full Event</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // No Event State
  noEventContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  noEventTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  noEventText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  viewEventsButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  viewEventsButtonText: {
    color: 'white',
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600' as const,
  },

  // Hero Section
  heroSection: {
    height: 200,
    marginBottom: theme.spacing.lg,
  },
  heroImage: {
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
  },
  heroContent: {
    padding: theme.spacing.lg,
  },
  eventTitle: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    color: 'white',
    marginBottom: theme.spacing.sm,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  eventLocation: {
    color: 'white',
    fontSize: theme.typography.body.fontSize,
    marginLeft: theme.spacing.xs,
    opacity: 0.9,
  },
  teamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamText: {
    color: 'white',
    fontSize: theme.typography.caption.fontSize,
    marginLeft: theme.spacing.xs,
    opacity: 0.8,
  },

  // Sections
  currentSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  shotsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  actionsSection: {
    paddingHorizontal: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },

  // Timeline Card
  timelineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineTime: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '700' as const,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  timelineTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  timelineDescription: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  timelineType: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  timelineTypeText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600' as const,
  },

  // Shot Cards
  shotCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  shotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  shotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shotTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  shotTitleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.textSecondary,
  },
  shotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bothIcons: {
    flexDirection: 'row',
    gap: 2,
  },
  shotTime: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
    fontWeight: '600' as const,
    marginBottom: theme.spacing.xs,
  },
  shotDescription: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginBottom: theme.spacing.xs,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.error + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  priorityText: {
    fontSize: 10,
    color: theme.colors.error,
    fontWeight: '600' as const,
  },

  // Action Button
  actionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600' as const,
  },
});