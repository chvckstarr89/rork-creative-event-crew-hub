import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { useAuth } from '@/hooks/auth-store';
import { UserRole, ServiceType } from '@/types/user';
import { theme } from '@/constants/theme';
import { trpcClient } from '@/lib/trpc';

export default function UserCreationTest() {
  const [formData, setFormData] = useState({
    name: 'Chuck Christensen',
    email: 'chvckstarr@gmail.com',
    password: 'password123',
    role: 'photographer' as UserRole,
    serviceType: 'photography' as ServiceType,
    company: 'Chuck Photography',
    phone: '+1234567890'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<string>('');
  const { signup, signupError, isSignupLoading } = useAuth();

  const createUserDirect = async () => {
    setIsCreating(true);
    setResult('');
    try {
      console.log('Creating user with data:', formData);
      const user = await trpcClient.users.create.mutate(formData);
      console.log('User created successfully:', user);
      setResult(`User created successfully! ID: ${user.id}, HubSpot ID: ${user.hubspotContactId || 'None'}`);
    } catch (error) {
      console.error('Direct creation error:', error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const createUserViaAuth = () => {
    console.log('Creating user via auth store:', formData);
    signup(formData);
  };

  const testHubSpotConnection = async () => {
    try {
      console.log('Testing HubSpot connection...');
      const schemas = await trpcClient.hubspot.customObjects.getSchemas.query();
      console.log('HubSpot schemas:', schemas);
      setResult(`HubSpot connected! Found ${schemas.schemas?.length || 0} custom object schemas`);
    } catch (error) {
      console.error('HubSpot test error:', error);
      if (error instanceof Error && (error.message.includes('Failed to fetch') || error.message.includes('Backend not deployed'))) {
        setResult('Backend not available: This component requires a deployed backend server to test user creation and HubSpot integration. Use the HubSpot Sync component for frontend-only testing.');
      } else {
        setResult(`HubSpot Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const createChuckUser = async () => {
    setIsCreating(true);
    setResult('');
    try {
      const chuckData = {
        name: 'Chuck Christensen',
        email: 'chvckstarr@gmail.com',
        password: 'password123',
        role: 'photographer' as UserRole,
        serviceType: 'photography' as ServiceType,
        company: 'Chuck Photography',
        phone: '+1234567890'
      };
      
      console.log('Creating Chuck Christensen user:', chuckData);
      const user = await trpcClient.users.create.mutate(chuckData);
      console.log('Chuck user created successfully:', user);
      setResult(`Chuck Christensen user created successfully!\nID: ${user.id}\nEmail: ${user.email}\nHubSpot Contact ID: ${user.hubspotContactId || 'None'}`);
    } catch (error) {
      console.error('Chuck user creation error:', error);
      setResult(`Error creating Chuck user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const clearAllUsers = async () => {
    setIsCreating(true);
    setResult('');
    try {
      console.log('Clearing all users...');
      const result = await trpcClient.users.clear.mutate();
      console.log('Users cleared:', result);
      setResult(`All users cleared successfully! You can now create Chuck again.`);
    } catch (error) {
      console.error('Clear users error:', error);
      setResult(`Error clearing users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const getAllUsers = async () => {
    try {
      console.log('Getting all users...');
      const result = await trpcClient.users.getAll.query();
      console.log('All users:', result);
      setResult(`Found ${result.users.length} users:\n${result.users.map(u => `- ${u.name} (${u.email})`).join('\n')}`);
    } catch (error) {
      console.error('Get users error:', error);
      setResult(`Error getting users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>User Creation Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Details</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={formData.name}
          onChangeText={(value) => updateFormData('name', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={formData.email}
          onChangeText={(value) => updateFormData('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={formData.password}
          onChangeText={(value) => updateFormData('password', value)}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder="Company"
          value={formData.company}
          onChangeText={(value) => updateFormData('company', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Phone"
          value={formData.phone}
          onChangeText={(value) => updateFormData('phone', value)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={createUserDirect}
          disabled={isCreating}
        >
          <Text style={styles.buttonText}>
            {isCreating ? 'Creating...' : 'Create User (Direct tRPC)'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={createUserViaAuth}
          disabled={isSignupLoading}
        >
          <Text style={styles.buttonText}>
            {isSignupLoading ? 'Creating...' : 'Create User (Auth Store)'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testHubSpotConnection}
        >
          <Text style={styles.buttonText}>Test HubSpot Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#10b981' }]}
          onPress={createChuckUser}
          disabled={isCreating}
        >
          <Text style={styles.buttonText}>
            {isCreating ? 'Creating...' : 'Create Chuck Christensen User'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#ef4444' }]}
          onPress={clearAllUsers}
          disabled={isCreating}
        >
          <Text style={styles.buttonText}>
            {isCreating ? 'Clearing...' : 'Clear All Users'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#8b5cf6' }]}
          onPress={getAllUsers}
        >
          <Text style={styles.buttonText}>Show All Users</Text>
        </TouchableOpacity>
      </View>

      {(result || signupError) && (
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>Result:</Text>
          <Text style={[styles.resultText, (signupError ? styles.errorText : styles.successText)]}>
            {result || signupError}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.accent,
  },
  testButton: {
    backgroundColor: '#6366f1',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  resultSection: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
  },
  successText: {
    color: theme.colors.success,
  },
  errorText: {
    color: theme.colors.error,
  },
});