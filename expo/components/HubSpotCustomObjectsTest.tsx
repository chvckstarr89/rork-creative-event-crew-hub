import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { trpcClient } from '@/lib/trpc';

export default function HubSpotCustomObjectsTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Starting HubSpot connection test...');
      const result = await trpcClient.hubspot.testConnection.query();
      setResults(result);
      console.log('✅ HubSpot Connection Test Result:', result);
      
      if (result.success) {
        Alert.alert('Success! ✅', 'HubSpot connection is working!');
      } else {
        Alert.alert('Connection Failed ❌', result.message || 'Unknown error');
      }
    } catch (error: any) {
      console.error('❌ HubSpot test error:', error);
      const errorMessage = error?.message || 'Failed to test HubSpot connection';
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Backend not deployed')) {
        Alert.alert('Backend Not Available ⚠️', 'This component requires a deployed backend server. Use the HubSpot Sync component for frontend-only testing.');
        setResults({ 
          error: 'Backend not available', 
          message: 'This component requires a deployed backend server for full testing. Use the HubSpot Sync component for frontend-only API testing.',
          suggestion: 'Deploy the backend or use direct API components'
        });
      } else {
        Alert.alert('Error ❌', errorMessage);
        setResults({ error: errorMessage, details: error });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testServices = async () => {
    setIsLoading(true);
    try {
      const result = await trpcClient.hubspot.services.getAll.query({ limit: 5 });
      setResults(result);
      console.log('✅ HubSpot Services Result:', result);
    } catch (error) {
      console.error('❌ HubSpot services error:', error);
      Alert.alert('Error', 'Failed to fetch HubSpot services');
    } finally {
      setIsLoading(false);
    }
  };

  const testArtists = async () => {
    setIsLoading(true);
    try {
      const result = await trpcClient.hubspot.artists.getAll.query({ limit: 5 });
      setResults(result);
      console.log('✅ HubSpot Artists Result:', result);
    } catch (error) {
      console.error('❌ HubSpot artists error:', error);
      Alert.alert('Error', 'Failed to fetch HubSpot artists');
    } finally {
      setIsLoading(false);
    }
  };

  const searchContact = async () => {
    setIsLoading(true);
    try {
      const result = await trpcClient.hubspot.searchContactByEmail.query({ email: 'chvckstarr@gmail.com' });
      setResults(result);
      console.log('✅ HubSpot Contact Search Result:', result);
      
      // If we found a contact, try to get their services
      if (result.success && result.contacts && result.contacts.length > 0) {
        const contactId = result.contacts[0].id;
        console.log('🔍 Fetching services for contact:', contactId);
        
        try {
          const servicesResult = await trpcClient.hubspot.services.getForContact.query({ contactId });
          console.log('✅ Contact Services Result:', servicesResult);
          
          // Combine results
          setResults({
            contact: result,
            services: servicesResult
          });
        } catch (servicesError) {
          console.error('❌ Error fetching contact services:', servicesError);
        }
      }
    } catch (error) {
      console.error('❌ HubSpot contact search error:', error);
      Alert.alert('Error', 'Failed to search for contact');
    } finally {
      setIsLoading(false);
    }
  };

  const testSchemas = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Starting HubSpot schemas test...');
      const result = await trpcClient.hubspot.customObjects.getSchemas.query();
      setResults(result);
      console.log('✅ HubSpot Schemas Result:', result);
      
      if (result.success) {
        Alert.alert('Success! ✅', `Found ${result.totalCount} custom schemas`);
      } else {
        Alert.alert('Schemas Test Failed ❌', result.message || 'Unknown error');
      }
    } catch (error: any) {
      console.error('❌ HubSpot schemas error:', error);
      const errorMessage = error?.message || 'Failed to fetch HubSpot schemas';
      
      // Check if it's a JSON parse error
      if (errorMessage.includes('JSON Parse error') || errorMessage.includes('Unexpected character')) {
        Alert.alert('JSON Parse Error ❌', 'HubSpot API returned HTML instead of JSON. This usually means authentication failed.');
        setResults({ 
          error: 'JSON Parse Error - API returned HTML', 
          details: errorMessage,
          suggestion: 'Check your HubSpot access token and permissions'
        });
      } else {
        Alert.alert('Error ❌', errorMessage);
        setResults({ error: errorMessage, details: error });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Starting comprehensive HubSpot diagnostic...');
      
      // First test basic server connectivity
      console.log('📡 Testing server connectivity...');
      try {
        const serverTest = await fetch('/api/');
        const serverResponse = await serverTest.text();
        console.log('✅ Server connectivity test passed:', serverResponse);
      } catch (serverError) {
        console.error('❌ Server connectivity failed:', serverError);
        throw new Error(`Server not reachable: ${serverError}`);
      }
      
      const result = await trpcClient.hubspot.diagnostic.query();
      setResults(result);
      console.log('✅ HubSpot Diagnostic Result:', result);
      
      if (result.summary?.overallSuccess) {
        Alert.alert('All Tests Passed! ✅', result.summary.recommendation);
      } else {
        Alert.alert('Some Tests Failed ⚠️', result.summary?.recommendation || 'Check individual test results');
      }
    } catch (error: any) {
      console.error('❌ HubSpot diagnostic error:', error);
      
      let errorMessage = 'Failed to run diagnostic';
      let suggestion = '';
      
      if (error?.message?.includes('Failed to fetch')) {
        errorMessage = 'Network connection failed';
        suggestion = 'Check if the server is running and accessible';
      } else if (error?.message?.includes('Server not reachable')) {
        errorMessage = 'Backend server is not running';
        suggestion = 'Start the development server and try again';
      } else {
        errorMessage = error?.message || 'Unknown error occurred';
      }
      
      Alert.alert('Diagnostic Error ❌', `${errorMessage}\n\n${suggestion}`);
      setResults({ 
        error: errorMessage, 
        suggestion,
        details: error,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const debugEnvironment = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Starting environment debug...');
      
      const debugResults: any = {
        timestamp: new Date().toISOString(),
        tests: []
      };
      
      // Test 1: Basic server connectivity
      console.log('📡 Test 1: Basic server connectivity...');
      try {
        const serverTest = await fetch('/api/');
        const serverResponse = await serverTest.text();
        console.log('✅ Server response:', serverResponse);
        debugResults.tests.push({
          name: 'Server Connectivity',
          success: true,
          status: serverTest.status,
          response: serverResponse
        });
      } catch (serverError: any) {
        console.error('❌ Server connectivity failed:', serverError);
        debugResults.tests.push({
          name: 'Server Connectivity',
          success: false,
          error: serverError.message
        });
      }
      
      // Test 2: Direct HubSpot test endpoint
      console.log('📡 Test 2: Direct HubSpot test endpoint...');
      try {
        const hubspotTest = await fetch('/api/test-hubspot');
        const hubspotResponse = await hubspotTest.json();
        console.log('✅ HubSpot direct test:', hubspotResponse);
        debugResults.tests.push({
          name: 'Direct HubSpot Test',
          success: hubspotResponse.success || false,
          status: hubspotTest.status,
          response: hubspotResponse
        });
      } catch (hubspotError: any) {
        console.error('❌ HubSpot direct test failed:', hubspotError);
        debugResults.tests.push({
          name: 'Direct HubSpot Test',
          success: false,
          error: hubspotError.message
        });
      }
      
      // Test 3: tRPC connectivity
      console.log('📡 Test 3: tRPC connectivity...');
      try {
        const trpcTest = await trpcClient.example.hi.mutate({ name: 'test' });
        console.log('✅ tRPC test:', trpcTest);
        debugResults.tests.push({
          name: 'tRPC Connectivity',
          success: true,
          response: trpcTest
        });
      } catch (trpcError: any) {
        console.error('❌ tRPC test failed:', trpcError);
        debugResults.tests.push({
          name: 'tRPC Connectivity',
          success: false,
          error: trpcError.message
        });
      }
      
      // Test 4: Environment variables (client-side check)
      console.log('📡 Test 4: Environment check...');
      debugResults.tests.push({
        name: 'Environment Variables',
        success: true,
        info: {
          isDev: __DEV__,
          platform: Platform.OS,
          baseUrl: typeof window !== 'undefined' ? window.location.origin : 'N/A (mobile)'
        }
      });
      
      setResults(debugResults);
      
      const successfulTests = debugResults.tests.filter((t: any) => t.success).length;
      const totalTests = debugResults.tests.length;
      
      if (successfulTests === totalTests) {
        Alert.alert('All Tests Passed! ✅', `${successfulTests}/${totalTests} tests successful`);
      } else {
        Alert.alert('Some Tests Failed ⚠️', `${successfulTests}/${totalTests} tests successful. Check results below.`);
      }
    } catch (error: any) {
      console.error('❌ Debug error:', error);
      const errorMessage = error?.message || 'Debug failed';
      Alert.alert('Debug Error ❌', errorMessage);
      setResults({ debugError: errorMessage, details: error });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>HubSpot Custom Objects Test</Text>
      <Text style={styles.subtitle}>Testing Services (0-162) & Artists (2-47887496)</Text>
      
      <TouchableOpacity 
        style={[styles.button, styles.diagnosticButton, isLoading && styles.buttonDisabled]} 
        onPress={runDiagnostic}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Running...' : '🔬 Full Diagnostic'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.debugButton, isLoading && styles.buttonDisabled]} 
        onPress={debugEnvironment}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Debugging...' : '🔧 Debug Environment'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testConnection}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : '🔗 Test Connection'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.servicesButton, isLoading && styles.buttonDisabled]} 
        onPress={testServices}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Loading...' : '🛠️ Get Services (0-162)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.artistsButton, isLoading && styles.buttonDisabled]} 
        onPress={testArtists}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Loading...' : '🎨 Get Artists (2-47887496)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.contactButton, isLoading && styles.buttonDisabled]} 
        onPress={searchContact}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Searching...' : '👤 Search Chuck + Services'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.schemasButton, isLoading && styles.buttonDisabled]} 
        onPress={testSchemas}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Loading...' : '📋 Test Schemas (Debug)'}
        </Text>
      </TouchableOpacity>

      {results && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Results:</Text>
          <ScrollView style={styles.resultsScroll} nestedScrollEnabled>
            <Text style={styles.resultsText}>{JSON.stringify(results, null, 2)}</Text>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  servicesButton: {
    backgroundColor: '#34C759',
  },
  artistsButton: {
    backgroundColor: '#FF9500',
  },
  contactButton: {
    backgroundColor: '#AF52DE',
  },
  schemasButton: {
    backgroundColor: '#FF3B30',
  },
  diagnosticButton: {
    backgroundColor: '#FF2D92',
  },
  debugButton: {
    backgroundColor: '#5856D6',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 400,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultsScroll: {
    maxHeight: 300,
  },
  resultsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    lineHeight: 16,
  },
});