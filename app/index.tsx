import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/role-select" />;
  }

  // Check if user needs to check in for today's events
  // For now, always show check-in after login - in a real app you'd check if they've already checked in today
  return <Redirect href="/check-in" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});