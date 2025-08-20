// components/HubSpotSync.tsx
// Updated component to use backend proxy instead of direct API calls

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { trpcClient } from '@/lib/trpc';

interface SyncData {
  contacts?: number;
  deals?: number;
  customObjects?: any[];
  lastSync?: string;
}

export default function HubSpotSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [syncData, setSyncData] = useState<SyncData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error' | null>(null);

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const result = await trpcClient.hubspot.testConnection.query();
      
      if (result.success) {
        setConnectionStatus('connected');
        Alert.alert(
          'Connection Successful!',
          `Connected to HubSpot account ${result.accountInfo?.portalId}`,
          [{ text: 'OK' }]
        );
      } else {
        setConnectionStatus('error');
        Alert.alert(
          'Connection Failed',
          result.message || 'Unable to connect to HubSpot',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      setConnectionStatus('error');
      console.error('Connection test error:', error);
      
      if (error.message?.includes('Backend not deployed') || error.message?.includes('404')) {
        Alert.alert(
          'Backend Not Available',
          'The backend server is not running. This is normal for Rork-hosted apps without a deployed backend service.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Connection Error',
          'Failed to test HubSpot connection. Please check your configuration.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      // Test connection first
      const connectionResult = await trpcClient.hubspot.testConnection.query();
      
      if (!connectionResult.success) {
        Alert.alert('Connection Failed', 'Please configure HubSpot connection first');
        return;
      }

      // Fetch data in parallel
      const [contactsResult, dealsResult, schemasResult] = await Promise.allSettled([
        trpcClient.hubspot.getContacts.query({ limit: 5 }),
        trpcClient.hubspot.getDeals.query({ limit: 5 }),
        trpcClient.hubspot.getSchemas.query()
      ]);

      const newSyncData: SyncData = {
        lastSync: new Date().toISOString()
      };

      if (contactsResult.status === 'fulfilled' && contactsResult.value) {
        newSyncData.contacts = contactsResult.value.total || 0;
      }

      if (dealsResult.status === 'fulfilled' && dealsResult.value) {
        newSyncData.deals = dealsResult.value.total || 0;
      }

      if (schemasResult.status === 'fulfilled' && schemasResult.value?.success) {
        newSyncData.customObjects = schemasResult.value.customObjects || [];
      }

      setSyncData(newSyncData);
      setConnectionStatus('connected');

      Alert.alert(
        'Sync Complete',
        `Successfully synced:\n` +
        `• ${newSyncData.contacts || 0} contacts\n` +
        `• ${newSyncData.deals || 0} deals\n` +
        `• ${newSyncData.customObjects?.length || 0} custom object types`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Sync error:', error);
      
      if (error.message?.includes('Backend not deployed') || error.message?.includes('404')) {
        Alert.alert(
          'Backend Not Available',
          'The backend server is not running. This is normal for Rork-hosted apps without a deployed backend service.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Sync Failed',
          'Failed to sync with HubSpot. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle size={20} color={theme.colors.success} />;
      case 'error':
        return <XCircle size={20} color={theme.colors.error} />;
      case 'disconnected':
      default:
        return <AlertCircle size={20} color={theme.colors.warning} />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Connection Error';
      case 'disconnected':
      default:
        return 'Not Connected';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>HubSpot Integration</Text>
        <View style={styles.statusContainer}>
          {getStatusIcon()}
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={handleTestConnection}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <CheckCircle size={20} color="#fff" />
              <Text style={styles.buttonText}>Test Connection</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.syncButton]}
          onPress={handleSync}
          disabled={isLoading || connectionStatus !== 'connected'}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <RefreshCw size={20} color="#fff" />
              <Text style={styles.buttonText}>Sync Data</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {syncData && (
        <View style={styles.syncInfo}>
          <Text style={styles.syncInfoTitle}>Last Sync Results:</Text>
          <View style={styles.syncStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{syncData.contacts || 0}</Text>
              <Text style={styles.statLabel}>Contacts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{syncData.deals || 0}</Text>
              <Text style={styles.statLabel}>Deals</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{syncData.customObjects?.length || 0}</Text>
              <Text style={styles.statLabel}>Custom Objects</Text>
            </View>
          </View>
          
          {syncData.customObjects && syncData.customObjects.length > 0 && (
            <View style={styles.customObjectsList}>
              <Text style={styles.customObjectsTitle}>Available Custom Objects:</Text>
              {syncData.customObjects.map((obj: any) => (
                <View key={obj.id} style={styles.customObjectItem}>
                  <Text style={styles.customObjectName}>{obj.name}</Text>
                  <Text style={styles.customObjectId}>ID: {obj.id}</Text>
                </View>
              ))}
            </View>
          )}
          
          {syncData.lastSync && (
            <Text style={styles.lastSyncText}>
              Last synced: {new Date(syncData.lastSync).toLocaleString()}
            </Text>
          )}
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Connection Info</Text>
        <Text style={styles.infoText}>
          This integration uses your backend server to securely connect to HubSpot.
          {'\n\n'}
          All API calls are proxied through your server to avoid CORS issues and keep your API token secure.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  testButton: {
    backgroundColor: theme.colors.primary,
  },
  syncButton: {
    backgroundColor: theme.colors.accent,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  syncInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  syncInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  syncStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  customObjectsList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  customObjectsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  customObjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  customObjectName: {
    fontSize: 14,
    color: '#333',
  },
  customObjectId: {
    fontSize: 12,
    color: '#999',
  },
  lastSyncText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
