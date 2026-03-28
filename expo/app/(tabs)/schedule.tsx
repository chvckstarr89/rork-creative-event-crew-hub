import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, ChevronRight, Plus } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useEvents } from '@/hooks/events-store';
import { Event } from '@/types/event';
import { Stack, router } from 'expo-router';

export default function ScheduleScreen() {
  const { events, isLoading } = useEvents();

  console.log('Schedule screen - events:', events?.length, 'isLoading:', isLoading);

  const groupEventsByDate = () => {
    if (!events || events.length === 0) return {};
    
    const grouped: { [key: string]: Event[] } = {};
    events.forEach((event: Event) => {
      const dateKey = event.date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  };

  const groupedEvents = groupEventsByDate();
  const sortedDates = Object.keys(groupedEvents).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Schedule",
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
          headerRight: () => (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/create-event')}
            >
              <Plus size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Loading events...</Text>
            </View>
          ) : sortedDates.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color={theme.colors.textTertiary} />
              <Text style={styles.emptyTitle}>No scheduled events</Text>
              <Text style={styles.emptyText}>Your upcoming events will appear here</Text>
              <TouchableOpacity 
                style={styles.createFirstButton}
                onPress={() => router.push('/create-event')}
              >
                <Plus size={20} color={theme.colors.background} />
                <Text style={styles.createFirstButtonText}>Create Your First Event</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sortedDates.map(date => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{date}</Text>
                {groupedEvents[date].map((event: Event) => (
                  <TouchableOpacity 
                    key={event.id} 
                    style={styles.eventItem}
                    onPress={() => router.push(`/(tabs)/(home)/${event.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.eventIndicator, { backgroundColor: event.color }]} />
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTime}>
                        {event.date.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </Text>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventLocation}>{event.location}</Text>
                      <View style={styles.eventMeta}>
                        <View style={[styles.eventBadge, { backgroundColor: event.color + '20' }]}>
                          <Text style={[styles.eventBadgeText, { color: event.color }]}>
                            {event.type}
                          </Text>
                        </View>
                        <Text style={styles.eventTeam}>{event.team.length} crew members</Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color={theme.colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </>
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
  },
  dateGroup: {
    marginBottom: theme.spacing.xl,
  },
  dateHeader: {
    color: theme.colors.text,
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    marginBottom: theme.spacing.md,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  eventIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: theme.spacing.md,
  },
  addButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  createFirstButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600' as const,
  },
  eventContent: {
    flex: 1,
  },
  eventTime: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  eventTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  eventLocation: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
    marginBottom: theme.spacing.sm,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  eventBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  eventBadgeText: {
    fontSize: theme.typography.tiny.fontSize,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  eventTeam: {
    color: theme.colors.textTertiary,
    fontSize: theme.typography.tiny.fontSize,
  },
});