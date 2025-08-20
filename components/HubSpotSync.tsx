import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RefreshCw, ExternalLink, Users, Briefcase, Zap } from 'lucide-react-native';
import Constants from 'expo-constants';
import { theme } from '@/constants/theme';

import { useAuth } from '@/hooks/auth-store';

// Get HubSpot token from Expo Constants
function getHubSpotToken() {
  // Try multiple sources for the token - use the updated token from .env
  return Constants.expoConfig?.extra?.EXPO_PUBLIC_HUBSPOT_TOKEN || 
         Constants.manifest?.extra?.EXPO_PUBLIC_HUBSPOT_TOKEN ||
         process.env.EXPO_PUBLIC_HUBSPOT_TOKEN ||
         'pat-na1-93dc437c-5ac3-451f-9601-fceb1789a50f'; // Updated token from .env file
}

// Test HubSpot token validity first
async function testTokenValidity(token: string) {
  try {
    console.log('🔍 Testing token validity with account info...');
    const response = await fetch('https://api.hubapi.com/account-info/v3/details', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      ...(typeof window !== 'undefined' && { mode: 'cors' as RequestMode })
    });
    
    console.log('📡 Account info response status:', response.status);
    
    if (response.ok) {
      const accountData = await response.json();
      console.log('✅ Token is valid! Account:', accountData.portalId);
      return { valid: true, accountData };
    } else {
      const errorText = await response.text();
      console.error('❌ Token validation failed:', errorText);
      return { valid: false, error: errorText, statusCode: response.status };
    }
  } catch (error: any) {
    console.error('❌ Token validation network error:', error);
    return { valid: false, error: error.message, networkError: true };
  }
}

// Direct HubSpot API functions with CORS handling
async function testHubSpotDirectly() {
  const token = getHubSpotToken();
  
  if (!token) {
    console.error('No HubSpot token in environment');
    return { 
      success: false, 
      error: 'HubSpot token not configured',
      message: 'Add EXPO_PUBLIC_HUBSPOT_TOKEN to environment variables'
    };
  }
  
  console.log('Token exists:', !!token);
  console.log('Token starts with:', token.substring(0, 10));
  
  try {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    } as const;
    
    console.log('Authorization header:', headers.Authorization.substring(0, 20) + '...');
    
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      method: 'GET',
      headers
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('HubSpot error response:', errorText);
      
      if (response.status === 401) {
        return {
          success: false,
          error: 'Authentication failed',
          message: 'Token may be invalid or malformed. Check for extra spaces or characters.',
          tokenInfo: {
            hasToken: !!token,
            tokenLength: token.length,
            startsWithPat: token.startsWith('pat-'),
            tokenPreview: token.substring(0, 15) + '...'
          }
        };
      }
      
      return {
        success: false,
        error: `HubSpot API error: ${response.status}`,
        details: errorText
      };
    }
    
    const data = await response.json();
    return { 
      success: true, 
      message: 'Connected to HubSpot successfully!',
      data
    };
    
  } catch (error: any) {
    console.error('Network error:', error);
    return { 
      success: false, 
      error: error.message,
      message: 'Network error connecting to HubSpot'
    };
  }
}

async function getSchemasDirect() {
  const token = getHubSpotToken();
  
  if (!token) return { success: false, error: 'No token configured' };
  
  try {
    console.log('🔍 Fetching HubSpot schemas...');
    
    const response = await fetch('https://api.hubapi.com/crm/v3/schemas', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      ...(typeof window !== 'undefined' && { mode: 'cors' as RequestMode })
    });
    
    console.log('📡 Schemas response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Schemas API error:', errorText);
      return { 
        success: false, 
        error: `API Error: ${response.status}`,
        message: errorText,
        statusCode: response.status
      };
    }
    
    const responseText = await response.text();
    
    // Check if HTML was returned instead of JSON
    if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
      return {
        success: false,
        error: 'Got HTML response instead of JSON',
        message: 'HubSpot API returned HTML, likely due to authentication failure',
        htmlPreview: responseText.substring(0, 200)
      };
    }
    
    try {
      const data = JSON.parse(responseText);
      console.log('✅ Successfully fetched schemas:', data.results?.length || 0);
      return { 
        success: true, 
        schemas: data.results || [],
        totalCount: data.results?.length || 0
      };
    } catch {
      return {
        success: false,
        error: 'Failed to parse schemas response',
        responsePreview: responseText.substring(0, 200)
      };
    }
  } catch (error: any) {
    console.error('❌ Schemas fetch error:', error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return {
        success: false,
        error: 'Network connection failed',
        message: 'Unable to reach HubSpot schemas API due to CORS or network issues'
      };
    }
    
    return { success: false, error: error.message || 'Unknown error' };
  }
}

async function searchContactByEmailDirect(email: string) {
  const token = getHubSpotToken();
  
  if (!token) return { success: false, error: 'No token configured' };
  
  try {
    console.log('🔍 Searching for contact:', email);
    
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: email
          }]
        }],
        properties: ['firstname', 'lastname', 'email', 'company', 'phone']
      }),
      ...(typeof window !== 'undefined' && { mode: 'cors' as RequestMode })
    });
    
    console.log('📡 Contact search response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Contact search error:', errorText);
      return { 
        success: false, 
        error: `API Error: ${response.status}`,
        message: errorText
      };
    }
    
    const data = await response.json();
    console.log('✅ Contact search results:', data.total, 'contacts found');
    
    return { 
      success: true, 
      totalCount: data.total || 0, 
      contacts: data.results || []
    };
  } catch (error: any) {
    console.error('❌ Contact search network error:', error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return {
        success: false,
        error: 'Network connection failed',
        message: 'Unable to search contacts due to CORS or network issues'
      };
    }
    
    return { success: false, error: error.message || 'Unknown error' };
  }
}

async function syncWithHubSpotDirect(userId: string, hubspotContactId: string) {
  const token = getHubSpotToken();
  
  if (!token) throw new Error('No HubSpot token configured');
  
  try {
    const response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${hubspotContactId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const contactData = await response.json();
      return {
        hubspotData: contactData.properties,
        dealCount: 0 // Would need additional API call to get deals
      };
    } else {
      throw new Error(`Failed to sync: ${response.status}`);
    }
  } catch (error: any) {
    throw new Error(`Sync failed: ${error.message}`);
  }
}

async function testWebhookConfigDirect() {
  const token = getHubSpotToken();
  
  return {
    accessTokenPresent: !!token,
    message: 'Webhook configuration requires backend server'
  };
}

async function listWebhooksDirect() {
  const token = getHubSpotToken();
  
  if (!token) return { success: false, error: 'No token configured' };
  
  try {
    const response = await fetch('https://api.hubapi.com/webhooks/v3/subscriptions', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, subscriptions: data.results };
    } else {
      return { success: false, error: `API Error: ${response.status}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export default function HubSpotSync() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncData, setSyncData] = useState<any>(null);

  const handleSync = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    if (!user.hubspotContactId) {
      Alert.alert(
        'HubSpot Not Connected',
        'This user is not connected to a HubSpot contact. Create a new account to automatically sync with HubSpot.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await syncWithHubSpotDirect(user.id, user.hubspotContactId);
      setSyncData(result);
      Alert.alert(
        'Sync Successful',
        `Synced with HubSpot contact. Found ${result.dealCount} associated deals.`
      );
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert(
        'Sync Failed',
        error instanceof Error ? error.message : 'Failed to sync with HubSpot'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    console.log('🔧 Starting HubSpot connection test...');
    console.log('🔍 Environment check:');
    console.log('All EXPO PUBLIC vars:', Object.keys(process.env ?? {}).filter((key) => key.startsWith('EXPO_PUBLIC_')));
    console.log('Token exists?', !!process.env.EXPO_PUBLIC_HUBSPOT_TOKEN);
    console.log('Token length:', process.env.EXPO_PUBLIC_HUBSPOT_TOKEN?.length ?? 0);
    const token = getHubSpotToken();
    console.log('  - HubSpot token exists:', !!token);
    console.log('  - Token preview:', token ? `${token.substring(0, 15)}...` : 'NOT FOUND');
    console.log('  - Full token (for debugging):', token);
    console.log('  - Token length:', token?.length || 0);
    console.log('  - Token format valid:', token?.startsWith('pat-') || false);
    console.log('  - Constants.expoConfig?.extra:', Constants.expoConfig?.extra);
    console.log('  - Constants.manifest?.extra:', Constants.manifest?.extra);
    console.log('  - process.env.EXPO_PUBLIC_HUBSPOT_TOKEN:', !!process.env.EXPO_PUBLIC_HUBSPOT_TOKEN);
    
    try {
      console.log('📡 Making direct API call to HubSpot...');
      const result = await testHubSpotDirectly();
      console.log('✅ HubSpot Connection Test Result:', result as unknown);
      
      if ((result as any).success) {
        const r: any = result as any;
        Alert.alert(
          'Connection Successful! ✅',
          `Connected to HubSpot successfully!\n\n${r.message}`
        );
      } else {
        const r: any = result as any;
        let alertMessage = `❌ ${r.message}\n\nError: ${r.error}`;
        
        if (r.troubleshooting) {
          alertMessage += '\n\n🔧 Troubleshooting:\n' + r.troubleshooting.map((tip: string) => `• ${tip}`).join('\n');
        }
        
        if (r.statusCode) {
          alertMessage += `\n\nStatus Code: ${r.statusCode}`;
        }
        
        Alert.alert(
          'Connection Failed ❌',
          alertMessage
        );
      }
    } catch (error) {
      console.error('❌ HubSpot test error:', error);
      
      Alert.alert(
        'Connection Error', 
        `Failed to connect to HubSpot:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`
      );
    }
  };

  const handleViewHubSpotSchemas = async () => {
    console.log('🔧 Starting HubSpot schemas test...');
    
    try {
      console.log('📡 Making direct API call to HubSpot schemas...');
      const schemas = await getSchemasDirect();
      console.log('✅ HubSpot Schemas Result:', schemas);
      
      if (schemas.success) {
        Alert.alert(
          'Schemas Retrieved! ✅',
          `Found ${schemas.totalCount || 0} custom object schemas\n\n📋 Check console for full schema details`
        );
      } else {
        let errorMessage = `❌ ${schemas.error}`;
        
        if (schemas.message) {
          errorMessage += `\n\n${schemas.message}`;
        }
        
        if (schemas.error === 'Network connection failed') {
          errorMessage += '\n\n🔧 This is likely due to CORS restrictions in web browsers. Try testing from a mobile device or use a backend proxy.';
        }
        
        Alert.alert(
          'Schemas Failed ❌',
          errorMessage
        );
      }
    } catch (error) {
      console.error('❌ HubSpot schemas error:', error);
      
      Alert.alert(
        'Connection Error',
        `Failed to fetch schemas:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`
      );
    }
  };

  const handleSearchChuck = async () => {
    try {
      const result = await searchContactByEmailDirect('chvckstarr@gmail.com');
      console.log('Chuck Search Result:', result);
      
      if (result.success) {
        Alert.alert(
          'Contact Found! ✅',
          `Found ${result.totalCount} contact(s) for chvckstarr@gmail.com\n\n👤 Check console for full contact details`
        );
      } else {
        let errorMessage = `❌ ${result.error}`;
        
        if (result.message) {
          errorMessage += `\n\n${result.message}`;
        }
        
        if (result.error === 'Network connection failed') {
          errorMessage += '\n\n🔧 This is likely due to CORS restrictions. Try testing from a mobile device.';
        }
        
        Alert.alert(
          'Contact Search Failed ❌',
          errorMessage
        );
      }
    } catch (error) {
      console.error('Chuck search error:', error);
      Alert.alert('Error', `Failed to search for Chuck: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestWebhookConfig = async () => {
    try {
      const result = await testWebhookConfigDirect();
      console.log('Webhook Config Test:', result);
      
      Alert.alert(
        'Webhook Configuration',
        `Access Token: ${result.accessTokenPresent ? '✅ Present' : '❌ Missing'}\n\n` +
        `Note: Webhook configuration requires a backend server.\n` +
        `This feature is not available in frontend-only mode.`
      );
    } catch (error) {
      console.error('Webhook config test error:', error);
      Alert.alert('Error', `Failed to test webhook config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleListWebhooks = async () => {
    try {
      const result = await listWebhooksDirect();
      console.log('Webhooks List:', result);
      
      if (result.success) {
        const webhooksList = result.subscriptions?.map((sub: any) => 
          `• ${sub.eventType} → ${sub.webhookUrl}`
        ).join('\n') || 'No webhooks found';
        
        Alert.alert(
          'Existing Webhooks',
          `Found ${result.subscriptions?.length || 0} webhook subscriptions:\n\n${webhooksList}`
        );
      } else {
        Alert.alert(
          'Webhooks List Failed',
          `❌ ${result.error}\n\nCheck your HubSpot token and permissions.`
        );
      }
    } catch (error) {
      console.error('List webhooks error:', error);
      Alert.alert('Error', `Failed to list webhooks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ExternalLink size={24} color={theme.colors.primary} />
        <Text style={styles.title}>HubSpot Integration</Text>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>HubSpot Status:</Text>
          <View style={[
            styles.statusBadge,
            user.hubspotContactId ? styles.statusConnected : styles.statusDisconnected
          ]}>
            <Text style={[
              styles.statusText,
              user.hubspotContactId ? styles.statusTextConnected : styles.statusTextDisconnected
            ]}>
              {user.hubspotContactId ? 'Contact Linked' : 'Not Linked'}
            </Text>
          </View>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Backend Status:</Text>
          <View style={[styles.statusBadge, styles.statusConnected]}>
            <Text style={[styles.statusText, styles.statusTextConnected]}>
              Frontend Direct
            </Text>
          </View>
        </View>

        {user.hubspotContactId && (
          <>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Contact ID:</Text>
              <Text style={styles.statusValue}>{user.hubspotContactId}</Text>
            </View>
            
            {user.hubspotDealIds && user.hubspotDealIds.length > 0 && (
              <View style={styles.statusRow}>
                <Briefcase size={16} color={theme.colors.textSecondary} />
                <Text style={styles.statusLabel}>Associated Deals:</Text>
                <Text style={styles.statusValue}>{user.hubspotDealIds.length}</Text>
              </View>
            )}
          </>
        )}
      </View>

      {syncData && (
        <View style={styles.syncDataContainer}>
          <Text style={styles.syncDataTitle}>Last Sync Data:</Text>
          <View style={styles.syncDataRow}>
            <Text style={styles.syncDataLabel}>Name:</Text>
            <Text style={styles.syncDataValue}>
              {syncData.hubspotData?.firstname} {syncData.hubspotData?.lastname}
            </Text>
          </View>
          {syncData.hubspotData?.company && (
            <View style={styles.syncDataRow}>
              <Text style={styles.syncDataLabel}>Company:</Text>
              <Text style={styles.syncDataValue}>{syncData.hubspotData.company}</Text>
            </View>
          )}
          {syncData.hubspotData?.phone && (
            <View style={styles.syncDataRow}>
              <Text style={styles.syncDataLabel}>Phone:</Text>
              <Text style={styles.syncDataValue}>{syncData.hubspotData.phone}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.syncButton]}
          onPress={handleSync}
          disabled={isLoading}
          testID="sync-button"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <RefreshCw size={20} color="white" />
          )}
          <Text style={styles.buttonText}>
            {isLoading ? 'Syncing...' : 'Sync with HubSpot'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={handleTestConnection}
          testID="test-connection-button"
        >
          <Zap size={20} color={theme.colors.primary} />
          <Text style={styles.schemaButtonText}>Test HubSpot Connection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.schemaButton]}
          onPress={handleViewHubSpotSchemas}
          testID="schemas-button"
        >
          <Users size={20} color={theme.colors.primary} />
          <Text style={styles.schemaButtonText}>View HubSpot Schemas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.searchButton]}
          onPress={handleSearchChuck}
          testID="search-chuck-button"
        >
          <Users size={20} color="#10B981" />
          <Text style={styles.searchButtonText}>Search for Chuck</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.webhookButton]}
          onPress={handleTestWebhookConfig}
          testID="webhook-config-button"
        >
          <Zap size={20} color="#FF9500" />
          <Text style={styles.webhookButtonText}>Test Webhook Config</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.webhookButton]}
          onPress={handleListWebhooks}
          testID="list-webhooks-button"
        >
          <ExternalLink size={20} color="#FF9500" />
          <Text style={styles.webhookButtonText}>List Webhooks</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>About HubSpot Integration</Text>
        <Text style={styles.infoText}>
          • Automatically creates HubSpot contacts when you sign up{'\n'}
          • Syncs your profile data with HubSpot{'\n'}
          • Links to associated deals and opportunities{'\n'}
          • Keeps your contact information up to date
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginLeft: 12,
  },
  statusContainer: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginRight: 8,
    marginLeft: 4,
  },
  statusValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500' as const,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  statusConnected: {
    backgroundColor: '#10B981',
  },
  statusDisconnected: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  statusTextConnected: {
    color: 'white',
  },
  statusTextDisconnected: {
    color: 'white',
  },
  statusWarning: {
    backgroundColor: '#FF9500',
  },
  statusTextWarning: {
    color: 'white',
  },
  syncDataContainer: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  syncDataTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 8,
  },
  syncDataRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  syncDataLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    width: 80,
  },
  syncDataValue: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  syncButton: {
    backgroundColor: theme.colors.primary,
  },
  testButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  schemaButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  schemaButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  searchButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  searchButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  webhookButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  webhookButtonText: {
    color: '#FF9500',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  infoContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});