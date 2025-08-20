import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useEvents } from '@/hooks/events-store';
import { Event } from '@/types/event';

type EventType = 'wedding' | 'corporate' | 'portrait' | 'commercial' | 'documentary';
type EventStatus = 'upcoming' | 'active' | 'completed';

const eventTypes: { value: EventType; label: string; color: string }[] = [
  { value: 'wedding', label: 'Wedding', color: '#FF006E' },
  { value: 'corporate', label: 'Corporate', color: '#00D4FF' },
  { value: 'commercial', label: 'Commercial', color: '#FFB800' },
  { value: 'portrait', label: 'Portrait', color: '#8B5CF6' },
  { value: 'documentary', label: 'Documentary', color: '#10B981' },
];

export default function CreateEventScreen() {
  const { addEvent } = useEvents();
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    date: '',
    time: '',
    location: '',
    type: 'wedding' as EventType,
    status: 'upcoming' as EventStatus,
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title || !formData.client || !formData.date || !formData.time || !formData.location) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Parse date and time
      const eventDateTime = new Date(`${formData.date}T${formData.time}:00`);
      
      const selectedType = eventTypes.find(t => t.value === formData.type);
      
      const newEvent: Omit<Event, 'id'> = {
        title: formData.title,
        client: formData.client,
        date: eventDateTime,
        location: formData.location,
        type: formData.type,
        status: formData.status,
        color: selectedType?.color || '#FF006E',
        coverImage: formData.coverImage,
        team: [],
        shotList: [],
        timeline: [],
        notes: [],
      };

      const eventId = addEvent(newEvent);
      
      Alert.alert(
        'Event Created',
        'Your event has been created successfully!',
        [
          {
            text: 'View Event',
            onPress: () => router.replace(`/(tabs)/(home)/${eventId}`),
          },
          {
            text: 'Create Another',
            style: 'cancel',
            onPress: () => {
              setFormData({
                title: '',
                client: '',
                date: '',
                time: '',
                location: '',
                type: 'wedding',
                status: 'upcoming',
                coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Sarah & James Wedding"
                placeholderTextColor={theme.colors.textTertiary}
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Client Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Sarah Mitchell"
                placeholderTextColor={theme.colors.textTertiary}
                value={formData.client}
                onChangeText={(text) => setFormData(prev => ({ ...prev, client: text }))}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={formData.date}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
                />
              </View>
              
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Time *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={formData.time}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, time: text }))}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Sunset Beach Resort, Malibu"
                placeholderTextColor={theme.colors.textTertiary}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Type</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.typeScroll}
              >
                {eventTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      formData.type === type.value && styles.typeButtonActive,
                      { borderColor: type.color }
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      formData.type === type.value && { color: type.color }
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusContainer}>
                {(['upcoming', 'active', 'completed'] as EventStatus[]).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      formData.status === status && styles.statusButtonActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, status }))}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      formData.status === status && styles.statusButtonTextActive
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.createButton, isSubmitting && styles.createButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Plus size={20} color={theme.colors.background} />
            <Text style={styles.createButtonText}>
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  form: {
    padding: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600' as const,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flex1: {
    flex: 1,
  },
  typeScroll: {
    gap: theme.spacing.sm,
  },
  typeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  typeButtonActive: {
    backgroundColor: 'transparent',
  },
  typeButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600' as const,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statusButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  statusButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600' as const,
  },
  statusButtonTextActive: {
    color: theme.colors.background,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600' as const,
  },
});