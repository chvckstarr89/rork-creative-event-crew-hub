import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';

// Direct HubSpot API functions
async function testHubSpotDirectly() {
  const token = process.env.EXPO_PUBLIC_HUBSPOT_TOKEN;
  
  if (!token) {
    return { 
      success: false, 
      error: 'HubSpot token not configured',
      message: 'Add EXPO_PUBLIC_HUBSPOT_TOKEN to environment variables'
    };
  }
  
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { 
        success: true, 
        message: 'Connected to HubSpot successfully',
        data: data 
      };
    } else {
      return { 
        success: false, 
        error: 'HubSpot returned error',
        statusCode: response.status,
        message: 'Check token validity and permissions'
      };
    }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message,
      message: 'Network error connecting to HubSpot'
    };
  }
}

async function getSchemasDirect() {
  const token = process.env.EXPO_PUBLIC_HUBSPOT_TOKEN;
  
  if (!token) return { success: false, error: 'No token configured' };
  
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/schemas', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, schemas: data.results };
    } else {
      return { success: false, error: `API Error: ${response.status}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function getObjectsDirect(objectType: string) {
  const token = process.env.EXPO_PUBLIC_HUBSPOT_TOKEN;
  
  if (!token) return { success: false, error: 'No token configured' };
  
  try {
    const response = await fetch(`https://api.hubapi.com/crm/v3/objects/${objectType}?limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, objects: data.results };
    } else {
      return { success: false, error: `API Error: ${response.status}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function getServicesDirect() {
  const token = process.env.EXPO_PUBLIC_HUBSPOT_TOKEN;
  
  if (!token) return { success: false, error: 'No token configured' };
  
  // Use the actual Services custom object type ID
  const SERVICES_OBJECT_TYPE = '0-162';
  
  try {
    const response = await fetch(`https://api.hubapi.com/crm/v3/objects/${SERVICES_OBJECT_TYPE}?limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, services: data.results };
    } else {
      return { success: false, error: `API Error: ${response.status}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

interface HubSpotObject {
  id: string;
  properties: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface Schema {
  id: string;
  name?: string;
  objectTypeId?: string;
  properties?: {
    name: string;
    label: string;
    type: string;
  }[];
}

export default function HubSpotExample() {
  const [selectedObjectType, setSelectedObjectType] = useState<string | null>(null);
  const [connectionTest, setConnectionTest] = useState<any>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  
  const [schemasData, setSchemasData] = useState<any>(null);
  const [schemasLoading, setSchemasLoading] = useState(true);
  const [schemasError, setSchemasError] = useState<any>(null);
  const [objectsData, setObjectsData] = useState<any>(null);
  const [objectsLoading, setObjectsLoading] = useState(false);
  const [objectsError, setObjectsError] = useState<any>(null);
  const [servicesData, setServicesData] = useState<any>(null);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<any>(null);

  // Load schemas on mount
  React.useEffect(() => {
    loadSchemas();
    loadServices();
  }, []);

  // Load objects when object type is selected
  React.useEffect(() => {
    if (selectedObjectType) {
      loadObjects(selectedObjectType);
    }
  }, [selectedObjectType]);

  const loadSchemas = async () => {
    try {
      setSchemasLoading(true);
      const result = await getSchemasDirect();
      setSchemasData(result);
      setSchemasError(null);
    } catch (error) {
      setSchemasError(error);
    } finally {
      setSchemasLoading(false);
    }
  };

  const loadObjects = async (objectType: string) => {
    try {
      setObjectsLoading(true);
      const result = await getObjectsDirect(objectType);
      setObjectsData(result);
      setObjectsError(null);
    } catch (error) {
      setObjectsError(error);
    } finally {
      setObjectsLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      setServicesLoading(true);
      const result = await getServicesDirect();
      setServicesData(result);
      setServicesError(null);
    } catch (error) {
      setServicesError(error);
    } finally {
      setServicesLoading(false);
    }
  };
  
  const testDirectConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await testHubSpotDirectly();
      setConnectionTest(result);
    } catch (error: any) {
      setConnectionTest({ error: 'Connection failed', message: error.message });
    } finally {
      setTestingConnection(false);
    }
  };

  // Show connection status first
  if (schemasError?.message?.includes('Backend not deployed') || schemasError?.message?.includes('No token configured')) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Backend Connection Status</Text>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>⚠️ Backend Not Deployed</Text>
          <Text style={styles.statusText}>
            The tRPC backend is not running. This is normal for Rork-hosted apps.
          </Text>
          <Text style={styles.statusText}>
            To use HubSpot integration, you need to:
          </Text>
          <Text style={styles.bulletPoint}>• Deploy the backend to a server</Text>
          <Text style={styles.bulletPoint}>• Set up environment variables</Text>
          <Text style={styles.bulletPoint}>• Configure the API endpoints</Text>
          
          <TouchableOpacity 
            style={styles.testButton}
            onPress={testDirectConnection}
            disabled={testingConnection}
          >
            <Text style={styles.testButtonText}>
              {testingConnection ? 'Testing...' : 'Test Direct Connection'}
            </Text>
          </TouchableOpacity>
          
          {connectionTest && (
            <View style={styles.testResult}>
              <Text style={styles.testResultTitle}>Connection Test Result:</Text>
              <Text style={styles.testResultText}>
                {JSON.stringify(connectionTest, null, 2)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }
  
  if (schemasLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading HubSpot schemas...</Text>
      </View>
    );
  }

  if (schemasError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          HubSpot test error: {schemasError.message}
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadSchemas}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Handle the case where the query succeeded but returned an error in the data
  if (schemasData && !schemasData.success) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>HubSpot Connection Status</Text>
        <Text style={styles.errorText}>
          {schemasData.message || schemasData.error}
        </Text>
        {schemasData.suggestion && (
          <Text style={styles.suggestionText}>
            Suggestion: {schemasData.suggestion}
          </Text>
        )}
        {schemasData.error && (
          <Text style={styles.debugText}>
            Error: {schemasData.error} (Status: {schemasData.statusCode})
          </Text>
        )}
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadSchemas}
        >
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderSchema = ({ item }: { item: Schema }) => (
    <TouchableOpacity 
      style={[styles.schemaCard, selectedObjectType === item.objectTypeId && styles.selectedCard]}
      onPress={() => item.objectTypeId && setSelectedObjectType(item.objectTypeId)}
    >
      <Text style={styles.schemaName}>{item.name || 'Unknown'}</Text>
      <Text style={styles.schemaId}>ID: {item.objectTypeId || 'N/A'}</Text>
      <Text style={styles.propertyCount}>{item.properties?.length || 0} properties</Text>
    </TouchableOpacity>
  );

  const renderObject = ({ item }: { item: HubSpotObject }) => (
    <View style={styles.objectCard}>
      <Text style={styles.objectId}>ID: {item.id}</Text>
      {Object.entries(item.properties).map(([key, value]) => (
        <Text key={key} style={styles.objectProperty}>
          {key}: {String(value)}
        </Text>
      ))}
      <Text style={styles.objectDate}>Created: {item.createdAt.toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HubSpot Data</Text>
      
      <Text style={styles.sectionTitle}>Available Custom Schemas ({schemasData?.schemas?.length || 0}):</Text>
      {schemasData?.schemas && schemasData.schemas.length > 0 ? (
        <FlatList
          data={schemasData.schemas}
          renderItem={renderSchema}
          keyExtractor={(item) => item.id}
          style={styles.schemaList}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.noDataText}>
          No custom schemas found. Create custom objects in HubSpot to see them here.
        </Text>
      )}
      
      {selectedObjectType && (
        <>
          <Text style={styles.sectionTitle}>Objects ({selectedObjectType}):</Text>
          {objectsLoading ? (
            <ActivityIndicator size="small" />
          ) : objectsError ? (
            <Text style={styles.errorText}>Error: {objectsError.message}</Text>
          ) : (
            <FlatList
              data={objectsData?.objects || []}
              renderItem={renderObject}
              keyExtractor={(item) => item.id}
              style={styles.objectList}
            />
          )}
        </>
      )}
      
      <Text style={styles.sectionTitle}>Services:</Text>
      {servicesLoading ? (
        <ActivityIndicator size="small" />
      ) : servicesError ? (
        <Text style={styles.errorText}>Services Error: {servicesError.message}</Text>
      ) : (
        <FlatList
          data={servicesData?.services || []}
          renderItem={renderObject}
          keyExtractor={(item) => item.id}
          style={styles.servicesList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  schemaList: {
    maxHeight: 120,
    marginBottom: 16,
  },
  objectList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  servicesList: {
    maxHeight: 200,
  },
  schemaCard: {
    backgroundColor: 'white',
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedCard: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 2,
  },
  objectCard: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  schemaName: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  schemaId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  propertyCount: {
    fontSize: 12,
    color: '#888',
  },
  objectId: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  objectProperty: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  objectDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  loadingText: {
    textAlign: 'center' as const,
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center' as const,
    color: 'red',
    fontSize: 14,
    marginVertical: 8,
  },
  suggestionText: {
    textAlign: 'center' as const,
    color: '#ff9800',
    fontSize: 12,
    marginVertical: 4,
    fontStyle: 'italic' as const,
  },
  debugText: {
    textAlign: 'center' as const,
    color: '#666',
    fontSize: 10,
    marginVertical: 4,
  },
  noDataText: {
    textAlign: 'center' as const,
    color: '#666',
    fontSize: 14,
    marginVertical: 16,
    fontStyle: 'italic' as const,
  },
  retryButton: {
    backgroundColor: '#2196f3',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignSelf: 'center' as const,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold' as const,
  },
  statusCard: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    borderColor: '#ffeaa7',
    borderWidth: 1,
    marginVertical: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#856404',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 8,
    lineHeight: 20,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 16,
    marginBottom: 4,
  },
  testButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
    marginTop: 16,
    alignItems: 'center' as const,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold' as const,
  },
  testResult: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
    borderColor: '#dee2e6',
    borderWidth: 1,
  },
  testResultTitle: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    marginBottom: 8,
    color: '#495057',
  },
  testResultText: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
});