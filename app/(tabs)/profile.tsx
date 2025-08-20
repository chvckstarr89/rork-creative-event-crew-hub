import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Camera, Award, Settings, LogOut, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import HubSpotSync from '@/components/HubSpotSync';
import UserCreationTest from '@/components/UserCreationTest';
import HubSpotCustomObjectsTest from '@/components/HubSpotCustomObjectsTest';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  
  const stats = [
    { label: 'Events', value: '127' },
    { label: 'Shots', value: '3.2k' },
    { label: 'Hours', value: '892' },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  const menuItems = [
    { icon: Camera, label: 'Equipment', color: theme.colors.primary, onPress: () => {} },
    { icon: Award, label: 'Achievements', color: theme.colors.warning, onPress: () => {} },
    { icon: Settings, label: 'Settings', color: theme.colors.textSecondary, onPress: () => {} },
    { icon: LogOut, label: 'Sign Out', color: theme.colors.accent, onPress: handleLogout },
  ];

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Profile",
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
        }} 
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[theme.colors.primary + '20', 'transparent']}
          style={styles.gradient}
        />
        
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?img=10' }} 
              style={styles.avatar}
            />
            <View style={styles.onlineIndicator} />
          </View>
          
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.role}>{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}</Text>
          {user?.company && (
            <Text style={styles.company}>{user.company}</Text>
          )}
          
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.contentSection}>
          <HubSpotSync />
          
          <View style={{ marginTop: 20 }}>
            <UserCreationTest />
          </View>
          
          <View style={{ marginTop: 20 }}>
            <HubSpotCustomObjectsTest />
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                  <item.icon size={20} color={item.color} />
                </View>
                <Text style={styles.menuItemText}>{item.label}</Text>
              </View>
              <ChevronRight size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.success,
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    marginBottom: 4,
  },
  role: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
    marginBottom: 4,
  },
  company: {
    color: theme.colors.textTertiary,
    fontSize: theme.typography.caption.fontSize,
    marginBottom: theme.spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
  },
  contentSection: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  menuSection: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  menuItemText: {
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '500' as const,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  footerText: {
    color: theme.colors.textTertiary,
    fontSize: theme.typography.caption.fontSize,
  },
});