import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, MapPin, CheckCircle, Calendar, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import { useUpcomingEvents } from '@/hooks/events-store';
import { theme } from '@/constants/theme';
import { CheckInData } from '@/types/user';
import { Event } from '@/types/event';

const { width } = Dimensions.get('window');

export default function CheckInScreen() {
  const { user } = useAuth();

  const upcomingEvents = useUpcomingEvents();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [locationUri, setLocationUri] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [step, setStep] = useState<'select' | 'selfie' | 'location' | 'confirm'>('select');
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (upcomingEvents.length === 1) {
      setSelectedEvent(upcomingEvents[0]);
      setStep('selfie');
    }
  }, [upcomingEvents]);

  const takePicture = async (isLocationShot = false) => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        if (isLocationShot) {
          setLocationUri(photo.uri);
          setShowCamera(false);
          setStep('confirm');
        } else {
          setSelfieUri(photo.uri);
          setShowCamera(false);
          setStep('location');
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const handleCameraPermission = async () => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required for check-in.');
        return;
      }
    }
    setShowCamera(true);
  };

  const handleSubmitCheckIn = async () => {
    if (!selectedEvent || !selfieUri || !user) {
      Alert.alert('Error', 'Please complete all required steps.');
      return;
    }

    setIsSubmitting(true);
    try {
      const checkInData: CheckInData = {
        eventId: selectedEvent.id,
        selfieUri,
        locationUri: locationUri || undefined,
        timestamp: new Date(),
      };

      console.log('Check-in data:', checkInData);
      
      // In a real app, you would send this to your backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Check-in Successful!',
        `You've successfully checked in for ${selectedEvent.title}. Have a great shoot!`,
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)/(home)/dashboard')
          }
        ]
      );
    } catch (error) {
      console.error('Check-in error:', error);
      Alert.alert('Error', 'Failed to submit check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderEventSelection = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <CheckCircle size={32} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>Event Check-in</Text>
        <Text style={styles.subtitle}>
          Select the event you&apos;re checking in for today
        </Text>
      </View>

      <View style={styles.eventsContainer}>
        {upcomingEvents.length === 0 ? (
          <View style={styles.noEventsContainer}>
            <Calendar size={48} color={theme.colors.textSecondary} />
            <Text style={styles.noEventsText}>No upcoming events found</Text>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => router.replace('/(tabs)/(home)/dashboard')}
            >
              <Text style={styles.skipButtonText}>Continue to Dashboard</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcomingEvents.map((event: Event) => (
            <TouchableOpacity
              key={event.id}
              style={[
                styles.eventCard,
                selectedEvent?.id === event.id && styles.eventCardSelected
              ]}
              onPress={() => {
                setSelectedEvent(event);
                setStep('selfie');
              }}
            >
              <Image source={{ uri: event.coverImage }} style={styles.eventImage} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={styles.eventDetails}>
                  <MapPin size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.eventLocation}>{event.location}</Text>
                </View>
                <View style={styles.eventDetails}>
                  <Clock size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.eventDate}>
                    {event.date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderSelfieStep = () => (
    <View style={styles.container}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Take a Selfie</Text>
        <Text style={styles.stepSubtitle}>
          Show that you&apos;re ready and in proper attire
        </Text>
      </View>

      {selfieUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: selfieUri }} style={styles.preview} />
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => {
                setSelfieUri(null);
                handleCameraPermission();
              }}
            >
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => setStep('location')}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleCameraPermission}
          >
            <Camera size={48} color="white" />
            <Text style={styles.cameraButtonText}>Take Selfie</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderLocationStep = () => (
    <View style={styles.container}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Location Photo (Optional)</Text>
        <Text style={styles.stepSubtitle}>
          Take a photo of your current location or setup
        </Text>
      </View>

      {locationUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: locationUri }} style={styles.preview} />
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => {
                setLocationUri(null);
                setFacing('back');
                handleCameraPermission();
              }}
            >
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => setStep('confirm')}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => {
              setFacing('back');
              handleCameraPermission();
            }}
          >
            <MapPin size={48} color="white" />
            <Text style={styles.cameraButtonText}>Take Location Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipLocationButton}
            onPress={() => setStep('confirm')}
          >
            <Text style={styles.skipLocationButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderConfirmStep = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Confirm Check-in</Text>
        <Text style={styles.stepSubtitle}>
          Review your check-in details before submitting
        </Text>
      </View>

      {selectedEvent && (
        <View style={styles.confirmCard}>
          <Text style={styles.confirmLabel}>Event</Text>
          <Text style={styles.confirmValue}>{selectedEvent.title}</Text>
          
          <Text style={styles.confirmLabel}>Location</Text>
          <Text style={styles.confirmValue}>{selectedEvent.location}</Text>
          
          <Text style={styles.confirmLabel}>Date</Text>
          <Text style={styles.confirmValue}>
            {selectedEvent.date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        </View>
      )}

      <View style={styles.photosContainer}>
        {selfieUri && (
          <View style={styles.photoPreview}>
            <Text style={styles.photoLabel}>Your Selfie</Text>
            <Image source={{ uri: selfieUri }} style={styles.smallPreview} />
          </View>
        )}
        
        {locationUri && (
          <View style={styles.photoPreview}>
            <Text style={styles.photoLabel}>Location Photo</Text>
            <Image source={{ uri: locationUri }} style={styles.smallPreview} />
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmitCheckIn}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? 'Checking In...' : 'Complete Check-in'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderCamera = () => {
    if (!permission?.granted) {
      return (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera permission required</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraFullscreen}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              
              {step === 'selfie' && (
                <TouchableOpacity
                  style={styles.flipButton}
                  onPress={() => setFacing((current: CameraType) => current === 'back' ? 'front' : 'back')}
                >
                  <Text style={styles.flipButtonText}>Flip</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.cameraFooter}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={() => takePicture(step === 'location')}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  };

  if (showCamera) {
    return renderCamera();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        {step === 'select' && renderEventSelection()}
        {step === 'selfie' && renderSelfieStep()}
        {step === 'location' && renderLocationStep()}
        {step === 'confirm' && renderConfirmStep()}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  eventsContainer: {
    flex: 1,
  },
  noEventsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
    marginBottom: 24,
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  eventCardSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  eventImage: {
    width: '100%',
    height: 120,
  },
  eventInfo: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 8,
  },
  eventDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 6,
  },
  eventDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 6,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  cameraContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 16,
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 8,
  },
  skipLocationButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipLocationButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500' as const,
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 16,
    marginBottom: 24,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 16,
  },
  retakeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  retakeButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500' as const,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  confirmCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    marginTop: 12,
  },
  confirmValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500' as const,
  },
  photosContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  photoPreview: {
    flex: 1,
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  smallPreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  cameraFullscreen: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  flipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  flipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500' as const,
  },
  cameraFooter: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 60,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});