import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Event, Note, ShotItem } from '@/types/event';
import { mockEvents } from '@/mocks/events';

export const [EventsProvider, useEvents] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem('events');
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.map((e: Event) => ({
            ...e,
            date: new Date(e.date),
            notes: e.notes?.map((n: Note) => ({
              ...n,
              timestamp: new Date(n.timestamp),
            })) || [],
          }));
        }
        return mockEvents;
      } catch (error) {
        console.error('Error loading events:', error);
        return mockEvents;
      }
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (updatedEvent: Event) => {
      console.log('Mutation: updating event', updatedEvent.id);
      const events = eventsQuery.data || [];
      const index = events.findIndex((e: Event) => e.id === updatedEvent.id);
      let updatedEvents;
      if (index !== -1) {
        updatedEvents = [...events];
        updatedEvents[index] = updatedEvent;
      } else {
        updatedEvents = [...events, updatedEvent];
      }
      await AsyncStorage.setItem('events', JSON.stringify(updatedEvents));
      console.log('Mutation: saved to storage, returning', updatedEvents.length, 'events');
      return updatedEvents;
    },
    onSuccess: (events) => {
      console.log('Mutation success: updating query cache with', events.length, 'events');
      queryClient.setQueryData(['events'], events);
    },
    onError: (error) => {
      console.error('Mutation error:', error);
    },
  });

  const toggleShotComplete = (eventId: string, shotId: string) => {
    console.log('Toggling shot:', { eventId, shotId });
    const event = eventsQuery.data?.find((e: Event) => e.id === eventId);
    if (event) {
      console.log('Found event:', event.title);
      const updatedShots = event.shotList.map((shot: ShotItem) => {
        if (shot.id === shotId) {
          console.log('Toggling shot from', shot.completed, 'to', !shot.completed);
          return { ...shot, completed: !shot.completed };
        }
        return shot;
      });
      const updatedEvent = {
        ...event,
        shotList: updatedShots,
      };
      console.log('Updating event with new shots:', updatedEvent);
      updateEventMutation.mutate(updatedEvent);
    } else {
      console.log('Event not found for ID:', eventId);
    }
  };

  const addNote = (eventId: string, content: string, author: string, authorAvatar?: string) => {
    const event = eventsQuery.data?.find((e: Event) => e.id === eventId);
    if (event) {
      const newNote: Note = {
        id: Date.now().toString(),
        author,
        authorAvatar,
        content,
        timestamp: new Date(),
      };
      updateEventMutation.mutate({
        ...event,
        notes: [...event.notes, newNote],
      });
    }
  };

  const selectedEvent = useMemo(() => {
    return eventsQuery.data?.find((e: Event) => e.id === selectedEventId);
  }, [eventsQuery.data, selectedEventId]);

  const addEvent = (newEvent: Omit<Event, 'id'>) => {
    const eventWithId: Event = {
      ...newEvent,
      id: Date.now().toString(),
    };
    updateEventMutation.mutate(eventWithId);
    return eventWithId.id;
  };

  const contextValue = {
    events: eventsQuery.data || [],
    isLoading: eventsQuery.isLoading,
    selectedEvent,
    selectedEventId,
    setSelectedEventId,
    toggleShotComplete,
    addNote,
    addEvent,
    updateEvent: updateEventMutation.mutate,
  };

  console.log('Events context value:', {
    eventsCount: contextValue.events.length,
    isLoading: contextValue.isLoading,
    selectedEventId: contextValue.selectedEventId,
    hasData: !!eventsQuery.data
  });

  return contextValue;
});

export function useUpcomingEvents() {
  const { events } = useEvents();
  return useMemo(() => 
    events
      .filter((e: Event) => e.status === 'upcoming')
      .sort((a: Event, b: Event) => a.date.getTime() - b.date.getTime()),
    [events]
  );
}

export function useActiveEvents() {
  const { events } = useEvents();
  return useMemo(() => 
    events.filter((e: Event) => e.status === 'active'),
    [events]
  );
}