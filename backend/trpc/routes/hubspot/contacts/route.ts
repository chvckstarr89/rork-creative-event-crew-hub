import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { Client } from '@hubspot/api-client';

// Validate environment variables
if (!process.env.HUBSPOT_ACCESS_TOKEN) {
  console.error('❌ ERROR: HUBSPOT_ACCESS_TOKEN not found in environment variables');
}

const hubspotClient = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

// Your HubSpot Custom Object Configuration
const HUBSPOT_CONFIG = {
  SERVICES_OBJECT_TYPE: '0-162',
  ARTISTS_OBJECT_TYPE: '2-47887496',
  API_BASE_URL: 'https://api.hubapi.com'
};

// Enhanced connection test with detailed debugging
export const testConnectionProcedure = publicProcedure
  .query(async () => {
    console.log('🔍 Starting HubSpot connection test...');
    console.log('🔑 Access Token Present:', !!process.env.HUBSPOT_ACCESS_TOKEN);
    console.log('🔑 Access Token (first 10 chars):', process.env.HUBSPOT_ACCESS_TOKEN?.substring(0, 10) + '...');
    
    // Early validation
    if (!process.env.HUBSPOT_ACCESS_TOKEN) {
      console.error('❌ ERROR: HubSpot token not found in environment variables');
      return {
        success: false,
        message: 'HubSpot token not configured',
        error: 'HUBSPOT_ACCESS_TOKEN environment variable is missing',
        accessToken: 'Missing',
        statusCode: 'Configuration Error'
      };
    }
    
    try {
      // Test 1: Account Info (should work with any valid token)
      console.log('📡 Testing account info endpoint...');
      const accountResponse = await fetch('https://api.hubapi.com/account-info/v3/details', {
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Account API Response Status:', accountResponse.status);
      
      if (accountResponse.ok) {
        const accountInfo = await accountResponse.json();
        console.log('✅ Account info retrieved successfully:', accountInfo.portalId);
        
        // Test 2: Try to get available object types to see what we can access
        console.log('📡 Testing object types endpoint...');
        try {
          const objectTypesResponse = await fetch('https://api.hubapi.com/crm/v3/objects', {
            headers: {
              'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('📊 Object Types Response Status:', objectTypesResponse.status);
          
          if (objectTypesResponse.ok) {
            const objectTypes = await objectTypesResponse.json();
            console.log('✅ Available object types:', objectTypes);
          } else {
            const errorText = await objectTypesResponse.text();
            console.log('❌ Object types error:', errorText);
          }
        } catch (objError) {
          console.log('❌ Object types request failed:', objError);
        }
        
        return {
          success: true,
          message: 'Successfully connected to HubSpot',
          accountInfo: accountInfo,
          accessToken: 'Present and Valid',
          debug: {
            portalId: accountInfo.portalId,
            accountType: accountInfo.accountType,
            timeZone: accountInfo.timeZone
          }
        };
      } else {
        const errorData = await accountResponse.text();
        console.log('❌ Account API Error:', errorData);
        return {
          success: false,
          message: 'Failed to connect to HubSpot - Invalid token or permissions',
          error: errorData,
          statusCode: accountResponse.status,
          accessToken: process.env.HUBSPOT_ACCESS_TOKEN ? 'Present but Invalid' : 'Missing',
          debug: {
            tokenLength: process.env.HUBSPOT_ACCESS_TOKEN?.length || 0,
            tokenPrefix: process.env.HUBSPOT_ACCESS_TOKEN?.substring(0, 10) || 'N/A'
          }
        };
      }
    } catch (error: any) {
      console.error('❌ HubSpot connection test failed:', error);
      return {
        success: false,
        message: 'Network error connecting to HubSpot',
        error: error.message || 'Unknown error',
        statusCode: 'Network Error',
        accessToken: process.env.HUBSPOT_ACCESS_TOKEN ? 'Present' : 'Missing'
      };
    }
  });

// Enhanced schema testing with multiple approaches
export const getCustomSchemasProcedure = publicProcedure
  .query(async () => {
    console.log('🔍 Starting custom schemas test...');
    
    // Early validation
    if (!process.env.HUBSPOT_ACCESS_TOKEN) {
      console.error('❌ ERROR: HubSpot token not found in environment variables');
      return {
        schemas: [],
        totalCount: 0,
        success: false,
        error: 'HUBSPOT_ACCESS_TOKEN environment variable is missing',
        message: 'HubSpot token not configured'
      };
    }
    
    console.log('🔑 Token validation:', {
      present: !!process.env.HUBSPOT_ACCESS_TOKEN,
      length: process.env.HUBSPOT_ACCESS_TOKEN?.length,
      prefix: process.env.HUBSPOT_ACCESS_TOKEN?.substring(0, 15),
      format: process.env.HUBSPOT_ACCESS_TOKEN?.startsWith('pat-') ? 'Valid PAT format' : 'Invalid format'
    });
    
    try {
      // First, test basic connectivity with account info
      console.log('📡 Testing basic connectivity...');
      const testResponse = await fetch('https://api.hubapi.com/account-info/v3/details', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Custom-Integration/1.0'
        }
      });
      
      console.log('📊 Basic connectivity test:', {
        status: testResponse.status,
        statusText: testResponse.statusText,
        headers: Object.fromEntries(testResponse.headers.entries())
      });
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.log('❌ Basic connectivity failed:', errorText);
        
        return {
          schemas: [],
          totalCount: 0,
          success: false,
          error: `Authentication failed: ${testResponse.status} ${testResponse.statusText}`,
          statusCode: testResponse.status,
          message: 'Invalid HubSpot access token or insufficient permissions',
          suggestion: 'Verify your access token is correct and has the required scopes',
          debug: {
            tokenFormat: process.env.HUBSPOT_ACCESS_TOKEN?.startsWith('pat-') ? 'Valid PAT format' : 'Invalid format',
            tokenLength: process.env.HUBSPOT_ACCESS_TOKEN?.length,
            errorResponse: errorText.substring(0, 200)
          }
        };
      }
      
      // Now try schemas API
      console.log('📡 Testing schemas API...');
      const schemasResponse = await fetch('https://api.hubapi.com/crm/v3/schemas', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Custom-Integration/1.0'
        }
      });
      
      console.log('📊 Schemas API Response Status:', schemasResponse.status);
      
      if (schemasResponse.ok) {
        const contentType = schemasResponse.headers.get('content-type');
        console.log('📊 Response Content-Type:', contentType);
        
        // Check if response is HTML instead of JSON
        if (contentType && contentType.includes('text/html')) {
          const htmlText = await schemasResponse.text();
          console.log('❌ Received HTML instead of JSON:', htmlText.substring(0, 200));
          return {
            schemas: [],
            totalCount: 0,
            success: false,
            error: 'Got HTML response instead of JSON - likely authentication error',
            htmlPreview: htmlText.substring(0, 200),
            message: 'HubSpot returned HTML error page. Check access token and required scopes.',
            suggestion: 'Verify token has crm.schemas.custom.read scope'
          };
        }
        
        const responseText = await schemasResponse.text();
        console.log('📊 Raw response (first 200 chars):', responseText.substring(0, 200));
        
        try {
          const schemasData = JSON.parse(responseText);
          console.log('✅ Schemas data retrieved successfully');
          
          // Filter for custom schemas (exclude standard HubSpot objects)
          const customSchemas = schemasData.results?.filter((schema: any) => {
            const standardObjects = ['contacts', 'companies', 'deals', 'tickets', 'calls', 'emails', 'meetings', 'notes', 'tasks', 'products', 'line_items', 'quotes'];
            return schema.objectTypeId && !standardObjects.includes(schema.objectTypeId);
          }) || [];
          
          console.log('📋 Custom schemas found:', customSchemas.length);
          
          return {
            schemas: customSchemas,
            totalCount: customSchemas.length,
            success: true,
            allSchemas: schemasData.results,
            debug: {
              totalSchemas: schemasData.results?.length || 0,
              customCount: customSchemas.length,
              standardCount: (schemasData.results?.length || 0) - customSchemas.length
            }
          };
        } catch (parseError: any) {
          console.error('❌ JSON Parse Error:', parseError.message);
          console.log('📊 Response was not valid JSON. First 500 chars:', responseText.substring(0, 500));
          
          return {
            schemas: [],
            totalCount: 0,
            success: false,
            error: `JSON Parse Error: ${parseError.message}`,
            rawResponse: responseText.substring(0, 500),
            message: 'API returned non-JSON response (likely HTML error page)'
          };
        }
      } else {
        const errorText = await schemasResponse.text();
        console.log('❌ Schemas API Error:', errorText);
        
        // Try using the HubSpot client as fallback
        console.log('📡 Trying HubSpot client approach...');
        try {
          const clientResponse = await hubspotClient.crm.schemas.coreApi.getAll();
          console.log('✅ Client response received successfully');
          
          const customSchemas = clientResponse.results?.filter(schema => {
            const standardObjects = ['contacts', 'companies', 'deals', 'tickets', 'calls', 'emails', 'meetings', 'notes', 'tasks', 'products', 'line_items', 'quotes'];
            return schema.objectTypeId && !standardObjects.includes(schema.objectTypeId);
          }) || [];
          
          return {
            schemas: customSchemas,
            totalCount: customSchemas.length,
            success: true,
            method: 'hubspot-client',
            message: 'Retrieved schemas using HubSpot client (fallback method)'
          };
        } catch (clientError: any) {
          console.log('❌ Client approach also failed:', clientError);
          
          return {
            schemas: [],
            totalCount: 0,
            success: false,
            error: `Both methods failed - Direct API: ${schemasResponse.status}, Client: ${clientError.message}`,
            statusCode: schemasResponse.status,
            message: 'Unable to fetch schemas using either method',
            suggestion: 'Check if you have the required scopes: crm.schemas.custom.read, crm.objects.custom.read',
            debug: {
              directApiStatus: schemasResponse.status,
              clientError: clientError.message,
              directApiError: errorText.substring(0, 200)
            }
          };
        }
      }
    } catch (error: any) {
      console.error('❌ Complete schemas test failed:', error);
      
      return {
        schemas: [],
        totalCount: 0,
        success: false,
        error: error.message || 'Unknown error',
        statusCode: 'Network Error',
        message: 'Network error while fetching schemas',
        suggestion: 'Check your internet connection and HubSpot API status'
      };
    }
  });

// Get custom objects by object type
export const getCustomObjectsProcedure = publicProcedure
  .input(z.object({
    objectType: z.string(),
    limit: z.number().optional().default(10),
    after: z.string().optional(),
  }))
  .query(async ({ input }: { input: { objectType: string; limit?: number; after?: string } }) => {
    try {
      const response = await hubspotClient.crm.objects.basicApi.getPage(
        input.objectType,
        input.limit,
        input.after
      );
      
      return {
        objects: response.results,
        paging: response.paging,
      };
    } catch (error) {
      console.error('HubSpot custom objects error:', error);
      throw new Error(`Failed to fetch custom objects of type ${input.objectType} from HubSpot`);
    }
  });

// Get single custom object
export const getCustomObjectProcedure = publicProcedure
  .input(z.object({
    objectType: z.string(),
    objectId: z.string(),
  }))
  .query(async ({ input }: { input: { objectType: string; objectId: string } }) => {
    try {
      const response = await hubspotClient.crm.objects.basicApi.getById(
        input.objectType,
        input.objectId
      );
      
      return response;
    } catch (error) {
      console.error('HubSpot custom object error:', error);
      throw new Error(`Failed to fetch custom object ${input.objectId} of type ${input.objectType} from HubSpot`);
    }
  });

// Search for a specific contact by email
export const searchContactByEmailProcedure = publicProcedure
  .input(z.object({
    email: z.string().email(),
  }))
  .query(async ({ input }: { input: { email: string } }) => {
    console.log('🔍 Searching for contact with email:', input.email);
    
    try {
      // Try to search for the contact using the search API
      const searchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filterGroups: [{
            filters: [{
              propertyName: 'email',
              operator: 'EQ',
              value: input.email
            }]
          }],
          properties: ['firstname', 'lastname', 'email', 'company', 'phone'],
          limit: 10
        })
      });
      
      console.log('📊 Contact Search Response Status:', searchResponse.status);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('✅ Contact search results:', searchData);
        
        return {
          success: true,
          contacts: searchData.results,
          totalCount: searchData.total,
          message: `Found ${searchData.total} contact(s) with email ${input.email}`
        };
      } else {
        const errorText = await searchResponse.text();
        console.log('❌ Contact search error:', errorText);
        
        return {
          success: false,
          contacts: [],
          totalCount: 0,
          error: errorText,
          statusCode: searchResponse.status,
          message: 'Failed to search for contact'
        };
      }
    } catch (error: any) {
      console.error('❌ Contact search failed:', error);
      
      return {
        success: false,
        contacts: [],
        totalCount: 0,
        error: error.message,
        message: 'Network error while searching for contact'
      };
    }
  });

// Get Services (Custom Object Type: 0-162)
export const getServicesProcedure = publicProcedure
  .input(z.object({
    limit: z.number().optional().default(10),
    after: z.string().optional(),
  }))
  .query(async ({ input }: { input: { limit?: number; after?: string } }) => {
    console.log('🔍 Fetching services from HubSpot...');
    
    try {
      const url = `${HUBSPOT_CONFIG.API_BASE_URL}/crm/v3/objects/${HUBSPOT_CONFIG.SERVICES_OBJECT_TYPE}?limit=${input.limit}${input.after ? `&after=${input.after}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Services Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Services retrieved:', data.results?.length || 0);
        
        return {
          success: true,
          services: data.results || [],
          paging: data.paging,
          totalCount: data.results?.length || 0,
          message: `Found ${data.results?.length || 0} services`
        };
      } else {
        const errorText = await response.text();
        console.log('❌ Services error:', errorText);
        
        return {
          success: false,
          services: [],
          error: errorText,
          statusCode: response.status,
          message: 'Failed to fetch services from HubSpot'
        };
      }
    } catch (error: any) {
      console.error('❌ Services fetch failed:', error);
      
      return {
        success: false,
        services: [],
        error: error.message,
        message: 'Network error while fetching services'
      };
    }
  });

// Get Artists (Custom Object Type: 2-47887496)
export const getArtistsProcedure = publicProcedure
  .input(z.object({
    limit: z.number().optional().default(10),
    after: z.string().optional(),
  }))
  .query(async ({ input }: { input: { limit?: number; after?: string } }) => {
    console.log('🔍 Fetching artists from HubSpot...');
    
    try {
      const url = `${HUBSPOT_CONFIG.API_BASE_URL}/crm/v3/objects/${HUBSPOT_CONFIG.ARTISTS_OBJECT_TYPE}?limit=${input.limit}${input.after ? `&after=${input.after}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Artists Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Artists retrieved:', data.results?.length || 0);
        
        return {
          success: true,
          artists: data.results || [],
          paging: data.paging,
          totalCount: data.results?.length || 0,
          message: `Found ${data.results?.length || 0} artists`
        };
      } else {
        const errorText = await response.text();
        console.log('❌ Artists error:', errorText);
        
        return {
          success: false,
          artists: [],
          error: errorText,
          statusCode: response.status,
          message: 'Failed to fetch artists from HubSpot'
        };
      }
    } catch (error: any) {
      console.error('❌ Artists fetch failed:', error);
      
      return {
        success: false,
        artists: [],
        error: error.message,
        message: 'Network error while fetching artists'
      };
    }
  });

// Get Services for a specific contact
export const getContactServicesProcedure = publicProcedure
  .input(z.object({
    contactId: z.string(),
  }))
  .query(async ({ input }: { input: { contactId: string } }) => {
    console.log('🔍 Fetching services for contact:', input.contactId);
    
    try {
      // Get associations between contact and services
      const url = `${HUBSPOT_CONFIG.API_BASE_URL}/crm/v4/objects/contacts/${input.contactId}/associations/${HUBSPOT_CONFIG.SERVICES_OBJECT_TYPE}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Contact Services Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Contact services retrieved:', data.results?.length || 0);
        
        // Now get the actual service details
        const serviceIds = data.results?.map((assoc: any) => assoc.toObjectId) || [];
        const services = [];
        
        for (const serviceId of serviceIds) {
          try {
            const serviceResponse = await fetch(`${HUBSPOT_CONFIG.API_BASE_URL}/crm/v3/objects/${HUBSPOT_CONFIG.SERVICES_OBJECT_TYPE}/${serviceId}`, {
              headers: {
                'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (serviceResponse.ok) {
              const serviceData = await serviceResponse.json();
              services.push(serviceData);
            }
          } catch (serviceError) {
            console.log('❌ Error fetching service details:', serviceError);
          }
        }
        
        return {
          success: true,
          services: services,
          totalCount: services.length,
          message: `Found ${services.length} services for contact`
        };
      } else {
        const errorText = await response.text();
        console.log('❌ Contact services error:', errorText);
        
        return {
          success: false,
          services: [],
          error: errorText,
          statusCode: response.status,
          message: 'Failed to fetch services for contact'
        };
      }
    } catch (error: any) {
      console.error('❌ Contact services fetch failed:', error);
      
      return {
        success: false,
        services: [],
        error: error.message,
        message: 'Network error while fetching contact services'
      };
    }
  });

// Comprehensive diagnostic procedure
export const diagnosticProcedure = publicProcedure
  .query(async () => {
    console.log('🔍 Starting comprehensive HubSpot diagnostic...');
    
    const results: any = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        tokenPresent: !!process.env.HUBSPOT_ACCESS_TOKEN,
        tokenLength: process.env.HUBSPOT_ACCESS_TOKEN?.length || 0,
        tokenFormat: process.env.HUBSPOT_ACCESS_TOKEN?.startsWith('pat-') ? 'Valid PAT format' : 'Invalid format',
        tokenPrefix: process.env.HUBSPOT_ACCESS_TOKEN?.substring(0, 15) || 'N/A'
      },
      tests: []
    };
    
    // Test 1: Basic connectivity
    try {
      console.log('📡 Test 1: Basic connectivity...');
      const response = await fetch('https://api.hubapi.com/account-info/v3/details', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      const testResult: any = {
        name: 'Basic Connectivity',
        status: response.status,
        success: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      };
      
      if (response.ok) {
        const data = await response.json();
        testResult.data = {
          portalId: data.portalId,
          accountType: data.accountType,
          timeZone: data.timeZone
        };
      } else {
        const errorText = await response.text();
        testResult.error = errorText.substring(0, 200);
      }
      
      results.tests.push(testResult);
    } catch (error: any) {
      results.tests.push({
        name: 'Basic Connectivity',
        success: false,
        error: error.message
      });
    }
    
    // Test 2: Contacts API
    try {
      console.log('📡 Test 2: Contacts API...');
      const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      const testResult: any = {
        name: 'Contacts API',
        status: response.status,
        success: response.ok
      };
      
      if (response.ok) {
        const data = await response.json();
        testResult.data = {
          totalContacts: data.total || 0,
          hasResults: !!data.results?.length
        };
      } else {
        const errorText = await response.text();
        testResult.error = errorText.substring(0, 200);
      }
      
      results.tests.push(testResult);
    } catch (error: any) {
      results.tests.push({
        name: 'Contacts API',
        success: false,
        error: error.message
      });
    }
    
    // Test 3: Custom Objects (Services)
    try {
      console.log('📡 Test 3: Services Custom Object...');
      const response = await fetch(`https://api.hubapi.com/crm/v3/objects/${HUBSPOT_CONFIG.SERVICES_OBJECT_TYPE}?limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      const testResult: any = {
        name: 'Services Custom Object (0-162)',
        status: response.status,
        success: response.ok
      };
      
      if (response.ok) {
        const data = await response.json();
        testResult.data = {
          totalServices: data.total || 0,
          hasResults: !!data.results?.length,
          sampleRecord: data.results?.[0]?.id || 'None'
        };
      } else {
        const errorText = await response.text();
        testResult.error = errorText.substring(0, 200);
      }
      
      results.tests.push(testResult);
    } catch (error: any) {
      results.tests.push({
        name: 'Services Custom Object (0-162)',
        success: false,
        error: error.message
      });
    }
    
    // Test 4: Custom Objects (Artists)
    try {
      console.log('📡 Test 4: Artists Custom Object...');
      const response = await fetch(`https://api.hubapi.com/crm/v3/objects/${HUBSPOT_CONFIG.ARTISTS_OBJECT_TYPE}?limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      const testResult: any = {
        name: 'Artists Custom Object (2-47887496)',
        status: response.status,
        success: response.ok
      };
      
      if (response.ok) {
        const data = await response.json();
        testResult.data = {
          totalArtists: data.total || 0,
          hasResults: !!data.results?.length,
          sampleRecord: data.results?.[0]?.id || 'None'
        };
      } else {
        const errorText = await response.text();
        testResult.error = errorText.substring(0, 200);
      }
      
      results.tests.push(testResult);
    } catch (error: any) {
      results.tests.push({
        name: 'Artists Custom Object (2-47887496)',
        success: false,
        error: error.message
      });
    }
    
    // Test 5: Schemas API
    try {
      console.log('📡 Test 5: Schemas API...');
      const response = await fetch('https://api.hubapi.com/crm/v3/schemas', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      const testResult: any = {
        name: 'Schemas API',
        status: response.status,
        success: response.ok
      };
      
      if (response.ok) {
        const responseText = await response.text();
        try {
          const data = JSON.parse(responseText);
          testResult.data = {
            totalSchemas: data.results?.length || 0,
            customSchemas: data.results?.filter((s: any) => 
              !['contacts', 'companies', 'deals', 'tickets', 'calls', 'emails', 'meetings', 'notes', 'tasks'].includes(s.objectTypeId)
            ).length || 0
          };
        } catch (_parseError) {
          testResult.error = 'JSON Parse Error: ' + responseText.substring(0, 100);
          testResult.success = false;
        }
      } else {
        const errorText = await response.text();
        testResult.error = errorText.substring(0, 200);
      }
      
      results.tests.push(testResult);
    } catch (error: any) {
      results.tests.push({
        name: 'Schemas API',
        success: false,
        error: error.message
      });
    }
    
    // Summary
    const successfulTests = results.tests.filter((t: any) => t.success).length;
    const totalTests = results.tests.length;
    
    results.summary = {
      overallSuccess: successfulTests === totalTests,
      successfulTests,
      totalTests,
      successRate: `${successfulTests}/${totalTests}`,
      recommendation: successfulTests === 0 
        ? 'Check your HubSpot access token - it appears to be invalid or expired'
        : successfulTests < totalTests
        ? 'Partial success - check specific failed tests and required scopes'
        : 'All tests passed - HubSpot integration is working correctly'
    };
    
    console.log('✅ Diagnostic complete:', results.summary);
    return results;
  });

// Test webhook configuration
export const testWebhookConfigProcedure = publicProcedure
  .query(async () => {
    console.log('🔍 Testing webhook configuration...');
    
    const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    
    return {
      accessTokenPresent: !!accessToken,
      clientSecretPresent: !!clientSecret,
      accessTokenPreview: accessToken ? accessToken.substring(0, 10) + '...' : 'Not set',
      clientSecretPreview: clientSecret ? clientSecret.substring(0, 10) + '...' : 'Not set',
      webhookEndpoint: '/api/webhooks/hubspot',
      testEndpoint: '/api/webhooks/hubspot/test',
      requiredScopes: [
        'crm.objects.contacts.read',
        'crm.objects.deals.read',
        'crm.schemas.custom.read',
        'webhooks'
      ],
      instructions: {
        step1: 'Go to HubSpot Settings > Integrations > Private Apps',
        step2: 'Select your private app (ID: 18237714)',
        step3: 'Go to the Auth tab and copy the Client Secret',
        step4: 'Add HUBSPOT_CLIENT_SECRET to your .env file',
        step5: 'Go to Webhooks tab and add webhook URL: {your_domain}/api/webhooks/hubspot',
        step6: 'Subscribe to events: contact.creation, contact.propertyChange, deal.creation, deal.propertyChange'
      }
    };
  });

// Create or update webhook subscription
export const manageWebhookProcedure = publicProcedure
  .input(z.object({
    action: z.enum(['create', 'list', 'delete']),
    webhookUrl: z.string().optional(),
    subscriptionType: z.string().optional(),
    subscriptionId: z.string().optional()
  }))
  .mutation(async ({ input }) => {
    console.log('🔧 Managing webhook:', input.action);
    
    try {
      const baseUrl = 'https://api.hubapi.com/webhooks/v3/subscriptions';
      
      switch (input.action) {
        case 'list':
          const listResponse = await fetch(baseUrl, {
            headers: {
              'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (listResponse.ok) {
            const data = await listResponse.json();
            return {
              success: true,
              subscriptions: data.results,
              message: `Found ${data.results?.length || 0} webhook subscriptions`
            };
          } else {
            const errorText = await listResponse.text();
            return {
              success: false,
              error: errorText,
              message: 'Failed to list webhooks'
            };
          }
          
        case 'create':
          if (!input.webhookUrl || !input.subscriptionType) {
            return {
              success: false,
              message: 'webhookUrl and subscriptionType are required for creation'
            };
          }
          
          const createResponse = await fetch(baseUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              eventType: input.subscriptionType,
              webhookUrl: input.webhookUrl,
              active: true
            })
          });
          
          if (createResponse.ok) {
            const data = await createResponse.json();
            return {
              success: true,
              subscription: data,
              message: 'Webhook subscription created successfully'
            };
          } else {
            const errorText = await createResponse.text();
            return {
              success: false,
              error: errorText,
              message: 'Failed to create webhook subscription'
            };
          }
          
        case 'delete':
          if (!input.subscriptionId) {
            return {
              success: false,
              message: 'subscriptionId is required for deletion'
            };
          }
          
          const deleteResponse = await fetch(`${baseUrl}/${input.subscriptionId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (deleteResponse.ok) {
            return {
              success: true,
              message: 'Webhook subscription deleted successfully'
            };
          } else {
            const errorText = await deleteResponse.text();
            return {
              success: false,
              error: errorText,
              message: 'Failed to delete webhook subscription'
            };
          }
          
        default:
          return {
            success: false,
            message: 'Invalid action specified'
          };
      }
    } catch (error: any) {
      console.error('❌ Webhook management error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Network error while managing webhook'
      };
    }
  });