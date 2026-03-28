import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, Animated, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import { Clock, MapPin, Users, Camera, MessageCircle, CheckCircle, Send, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { useEvents } from '@/hooks/events-store';
import { Event, ShotItem, TimelineItem as TimelineItemType, Note, TeamMember } from '@/types/event';
import { ShotListItem } from '@/components/ShotListItem';
import { TimelineItem } from '@/components/TimelineItem';
import { NoteItem } from '@/components/NoteItem';

type TabType = 'shots' | 'timeline' | 'notes' | 'team';

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams();
  const { selectedEvent, toggleShotComplete, addNote, setSelectedEventId } = useEvents();
  const [activeTab, setActiveTab] = useState<TabType>('shots');
  const [noteInput, setNoteInput] = useState('');
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    setSelectedEventId(eventId as string);
  }, [eventId]);

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTab === 'shots' ? 0 : activeTab === 'timeline' ? 1 : activeTab === 'notes' ? 2 : 3,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [activeTab]);

  if (!selectedEvent) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  const handleSendNote = () => {
    if (noteInput.trim()) {
      addNote(selectedEvent.id, noteInput.trim(), 'You', 'https://i.pravatar.cc/150?img=10');
      setNoteInput('');
    }
  };

  // Calculate timeline progress based on current time and event timeline
  const getCurrentTimelineProgress = () => {
    if (selectedEvent.timeline.length === 0) return 0;
    
    const now = new Date();
    const eventDate = selectedEvent.date;
    
    // If event hasn't started yet, progress is 0
    if (now < eventDate) return 0;
    
    // Calculate how many timeline items should be completed based on current time
    let completedItems = 0;
    
    for (const item of selectedEvent.timeline) {
      // Parse the timeline item time and combine with event date
      const [timeStr] = item.time.split(' ');
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      const itemDateTime = new Date(eventDate);
      itemDateTime.setHours(hours, minutes, 0, 0);
      
      // If current time has passed this timeline item, mark as completed
      if (now >= itemDateTime) {
        completedItems++;
      } else {
        break; // Stop at first future item
      }
    }
    
    return (completedItems / selectedEvent.timeline.length) * 100;
  };
  
  const timelineProgress = getCurrentTimelineProgress();
  const completedTimelineItems = Math.floor((timelineProgress / 100) * selectedEvent.timeline.length);

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <View style={styles.backgroundContainer}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroContainer}>
              <Image source={{ uri: selectedEvent.coverImage }} style={styles.heroImage} />
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'transparent', theme.colors.background]}
                style={styles.heroGradient}
              />
              
              <SafeAreaView style={styles.headerOverlay}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.teamButton}>
                  <Users size={24} color="white" />
                </TouchableOpacity>
              </SafeAreaView>
              
              <View style={styles.heroContent}>
                <Text style={styles.eventType}>{selectedEvent.type.toUpperCase()}</Text>
                <Text style={styles.eventClient}>{selectedEvent.client}</Text>
                
                <View style={styles.heroDetails}>
                  <View style={styles.heroDetail}>
                    <Clock size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.heroDetailText}>
                      {selectedEvent.date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={styles.heroDetail}>
                    <MapPin size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.heroDetailText}>{selectedEvent.location}</Text>
                  </View>
                </View>
              </View>
            </View>

          {selectedEvent.timeline.length > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Timeline Progress</Text>
                <Text style={styles.progressText}>
                  {completedTimelineItems} of {selectedEvent.timeline.length} items completed
                </Text>
              </View>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill, 
                    { width: `${timelineProgress}%` }
                  ]} 
                />
              </View>
            </View>
          )}

          <View style={styles.tabContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabScroll}
            >
              {(['shots', 'timeline', 'notes', 'team'] as TabType[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.activeTab]}
                  onPress={() => setActiveTab(tab)}
                >
                  {tab === 'shots' && <Camera size={18} color={activeTab === tab ? theme.colors.primary : theme.colors.textSecondary} />}
                  {tab === 'timeline' && <Clock size={18} color={activeTab === tab ? theme.colors.primary : theme.colors.textSecondary} />}
                  {tab === 'notes' && <MessageCircle size={18} color={activeTab === tab ? theme.colors.primary : theme.colors.textSecondary} />}
                  {tab === 'team' && <Users size={18} color={activeTab === tab ? theme.colors.primary : theme.colors.textSecondary} />}
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.contentContainer}>
            {activeTab === 'shots' && (
              <View>
                {selectedEvent.shotList.length === 0 ? (
                  <Text style={styles.emptyText}>No shots added yet</Text>
                ) : (
                  selectedEvent.shotList.map((shot: ShotItem) => (
                    <ShotListItem
                      key={shot.id}
                      shot={shot}
                      onToggle={() => toggleShotComplete(selectedEvent.id, shot.id)}
                      teamMembers={selectedEvent.team}
                    />
                  ))
                )}
              </View>
            )}

            {activeTab === 'timeline' && (
              <View>
                {selectedEvent.timeline.length === 0 ? (
                  <Text style={styles.emptyText}>No timeline items yet</Text>
                ) : (
                  selectedEvent.timeline.map((item: TimelineItemType, index: number) => {
                    // Determine if this timeline item is currently active
                    const now = new Date();
                    const eventDate = selectedEvent.date;
                    
                    const [timeStr] = item.time.split(' ');
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    
                    const itemDateTime = new Date(eventDate);
                    itemDateTime.setHours(hours, minutes, 0, 0);
                    
                    // Item is active if current time is within 30 minutes of its scheduled time
                    const timeDiff = Math.abs(now.getTime() - itemDateTime.getTime());
                    const isActive = timeDiff <= 30 * 60 * 1000 && now >= itemDateTime;
                    
                    return (
                      <TimelineItem
                        key={item.id}
                        item={item}
                        isLast={index === selectedEvent.timeline.length - 1}
                        isActive={isActive}
                      />
                    );
                  })
                )}
              </View>
            )}

            {activeTab === 'notes' && (
              <View>
                {selectedEvent.notes.length === 0 ? (
                  <Text style={styles.emptyText}>No notes yet. Start a conversation!</Text>
                ) : (
                  selectedEvent.notes.map((note: Note) => (
                    <NoteItem
                      key={note.id}
                      note={note}
                      isCurrentUser={note.author === 'You'}
                    />
                  ))
                )}
              </View>
            )}

            {activeTab === 'team' && (
              <View>
                {selectedEvent.team.map((member: TeamMember) => (
                  <View key={member.id} style={styles.teamMember}>
                    <View style={styles.teamMemberInfo}>
                      {member.avatar ? (
                        <Image source={{ uri: member.avatar }} style={styles.teamAvatar} />
                      ) : (
                        <View style={styles.teamAvatarPlaceholder}>
                          <Text style={styles.teamAvatarText}>{member.name[0]}</Text>
                        </View>
                      )}
                      <View style={styles.teamMemberDetails}>
                        <Text style={styles.teamMemberName}>{member.name}</Text>
                        <Text style={styles.teamMemberRole}>{member.role}</Text>
                      </View>
                    </View>
                    {member.isOnline && (
                      <View style={styles.onlineStatus}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>Online</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
          </ScrollView>

          {activeTab === 'notes' && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor={theme.colors.textTertiary}
                value={noteInput}
                onChangeText={setNoteInput}
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.sendButton, !noteInput.trim() && styles.sendButtonDisabled]}
                onPress={handleSendNote}
                disabled={!noteInput.trim()}
              >
                <Send size={20} color={noteInput.trim() ? theme.colors.background : theme.colors.textTertiary} />
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  errorText: {
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
  headerButton: {
    padding: theme.spacing.sm,
  },
  heroContainer: {
    height: 320,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  teamButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
  },
  eventType: {
    color: theme.colors.primary,
    fontSize: theme.typography.tiny.fontSize,
    fontWeight: '600' as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  eventClient: {
    color: 'white',
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    marginBottom: theme.spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroDetails: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  heroDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDetailText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: theme.typography.caption.fontSize,
  },
  progressContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  progressTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600' as const,
  },
  progressText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  tabContainer: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  tabScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.sm,
    gap: 6,
  },
  activeTab: {
    backgroundColor: theme.colors.primary + '20',
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600' as const,
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  teamMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: theme.spacing.md,
  },
  teamAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  teamAvatarText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  teamMemberDetails: {
    flex: 1,
  },
  teamMemberName: {
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600' as const,
  },
  teamMemberRole: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
    textTransform: 'capitalize',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  onlineText: {
    color: theme.colors.success,
    fontSize: theme.typography.caption.fontSize,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    maxHeight: 100,
    marginRight: theme.spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surface,
  },
});