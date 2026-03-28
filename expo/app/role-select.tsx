import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Video, User, Clapperboard, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import { UserRole } from '@/types/user';

const ROLES = [
  {
    id: 'photographer',
    title: 'Photographer',
    subtitle: 'Capture stunning moments',
    icon: Camera,
    gradient: ['#667eea', '#764ba2'],
    emoji: '📸'
  },
  {
    id: 'videographer', 
    title: 'Videographer',
    subtitle: 'Create cinematic stories',
    icon: Video,
    gradient: ['#f093fb', '#f5576c'],
    emoji: '🎥'
  },
  {
    id: 'client',
    title: 'Client',
    subtitle: 'Plan your perfect event',
    icon: User,
    gradient: ['#4facfe', '#00f2fe'],
    emoji: '👤'
  },
  {
    id: 'director',
    title: 'Director',
    subtitle: 'Lead creative vision',
    icon: Clapperboard,
    gradient: ['#43e97b', '#38f9d7'],
    emoji: '🎬'
  },
  {
    id: 'assistant',
    title: 'Assistant',
    subtitle: 'Support the team',
    icon: Users,
    gradient: ['#fa709a', '#fee140'],
    emoji: '🤝'
  }
];

export default function RoleSelectScreen() {
  const router = useRouter();
  const { quickLogin } = useAuth();

  const handleRoleSelect = (roleId: string) => {
    const role = roleId as UserRole;
    
    // Create a demo user for the selected role
    const demoUser = {
      id: Date.now().toString(),
      email: `${role}@demo.com`,
      name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      role,
      serviceType: role === 'photographer' ? 'photography' as const : 
                   role === 'videographer' ? 'videography' as const : 'hybrid' as const,
      company: `${role.charAt(0).toUpperCase() + role.slice(1)} Studio`,
      isOnline: true,
      lastSeen: new Date(),
      preferences: {
        notifications: true,
        darkMode: false,
        language: 'en' as const
      }
    };

    quickLogin(demoUser);
    router.replace('/(tabs)/(home)/dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.background}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Camera size={40} color="white" />
          </View>
          <Text style={styles.title}>CrewSync</Text>
          <Text style={styles.subtitle}>
            Choose your role to get started
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          {ROLES.map((role, index) => {
            const IconComponent = role.icon;
            return (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.roleCard,
                  { 
                    marginTop: index * 10,
                    transform: [{ scale: 1 - index * 0.02 }]
                  }
                ]}
                onPress={() => handleRoleSelect(role.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={role.gradient as [string, string]}
                  style={styles.roleGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.roleContent}>
                    <View style={styles.roleIconContainer}>
                      <Text style={styles.roleEmoji}>{role.emoji}</Text>
                      <IconComponent size={32} color="white" />
                    </View>
                    <View style={styles.roleText}>
                      <Text style={styles.roleTitle}>{role.title}</Text>
                      <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
                    </View>
                    <View style={styles.arrow}>
                      <Text style={styles.arrowText}>→</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Demo mode - No registration required
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 60,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold' as const,
    color: 'white',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  rolesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  roleCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  roleGradient: {
    padding: 24,
  },
  roleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    position: 'relative',
  },
  roleEmoji: {
    position: 'absolute',
    top: -8,
    right: -8,
    fontSize: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  roleText: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: 'white',
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold' as const,
  },
  footer: {
    paddingBottom: 40,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});