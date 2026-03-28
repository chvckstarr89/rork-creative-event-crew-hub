// backend/trpc/routes/hubspot/proxy.ts
// Complete HubSpot proxy routes to handle CORS issues

import { z } from 'zod';
import { publicProcedure } from '../../create-context';

// Ensure environment variables are loaded
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const HUBSPOT_BASE_URL = 'https://api.hubapi.com';

console.log('🔍 Environment check in proxy:');
console.log('- HUBSPOT_ACCESS_TOKEN present:', !!process.env.HUBSPOT_ACCESS_TOKEN);
console.log('- Token preview:', process.env.HUBSPOT_ACCESS_TOKEN?.substring(0, 15) + '...');

if (!HUBSPOT_TOKEN) {
  console.error('❌ CRITICAL: HUBSPOT_ACCESS_TOKEN not found in environment');
}

// Generic HubSpot API proxy
const makeHubSpotRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
) => {
  if (!HUBSPOT_TOKEN) {
    throw new Error('HubSpot token not configured');
  }

  const url = `${HUBSPOT_BASE_URL}${endpoint}`;
  console.log(`🚀 HubSpot ${method} request to: ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...(body && { body: JSON.stringify(body) })
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`❌ HubSpot API error (${response.status}):`, responseText);
      throw new Error(`HubSpot API error: ${response.status} - ${responseText.substring(0, 200)}`);
    }

    // Try to parse as JSON, fallback to text
    try {
      return JSON.parse(responseText);
    } catch {
      return responseText;
    }
  } catch (error: any) {
    console.error('❌ HubSpot request failed:', error);
    throw error;
  }
};

// Test connection with detailed diagnostics
export const testConnectionProcedure = publicProcedure
  .query(async () => {
    console.log('🔍 Testing HubSpot connection...');
    
    if (!HUBSPOT_TOKEN) {
      return {
        success: false,
        error: 'HubSpot token not configured',
        message: 'Please add HUBSPOT_ACCESS_TOKEN to your .env file'
      };
    }

    try {
      // Test with account info endpoint
      const accountInfo = await makeHubSpotRequest('/account-info/v3/details');
      
      // Also test CRM access
      const contacts = await makeHubSpotRequest('/crm/v3/objects/contacts?limit=1');
      
      return {
        success: true,
        message: 'Successfully connected to HubSpot',
        accountInfo: {
          portalId: accountInfo.portalId,
          accountType: accountInfo.accountType,
          timeZone: accountInfo.timeZone
        },
        contactsAccess: {
          total: contacts.total,
          hasAccess: true
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to connect to HubSpot'
      };
    }
  });

// Get contacts with search
export const getContactsProcedure = publicProcedure
  .input(z.object({
    limit: z.number().optional().default(10),
    query: z.string().optional(),
    after: z.string().optional()
  }))
  .query(async ({ input }) => {
    const params = new URLSearchParams({
      limit: input.limit.toString(),
      ...(input.after && { after: input.after }),
      ...(input.query && { q: input.query })
    });

    return await makeHubSpotRequest(`/crm/v3/objects/contacts?${params}`);
  });

// Get deals
export const getDealsProcedure = publicProcedure
  .input(z.object({
    limit: z.number().optional().default(10),
    properties: z.array(z.string()).optional(),
    after: z.string().optional()
  }))
  .query(async ({ input }) => {
    const params = new URLSearchParams({
      limit: input.limit.toString(),
      ...(input.after && { after: input.after }),
      ...(input.properties && { properties: input.properties.join(',') })
    });

    return await makeHubSpotRequest(`/crm/v3/objects/deals?${params}`);
  });

// Get custom objects (Services, Artists, etc.)
export const getCustomObjectsProcedure = publicProcedure
  .input(z.object({
    objectType: z.string(),
    limit: z.number().optional().default(10),
    properties: z.array(z.string()).optional(),
    after: z.string().optional()
  }))
  .query(async ({ input }) => {
    const params = new URLSearchParams({
      limit: input.limit.toString(),
      ...(input.after && { after: input.after }),
      ...(input.properties && { properties: input.properties.join(',') })
    });

    try {
      return await makeHubSpotRequest(`/crm/v3/objects/${input.objectType}?${params}`);
    } catch (error: any) {
      // If custom object fails, return helpful error
      return {
        success: false,
        error: error.message,
        suggestion: 'This custom object may not exist or you may not have permissions to access it',
        objectType: input.objectType
      };
    }
  });

// Get schemas (to discover available custom objects)
export const getSchemasProcedure = publicProcedure
  .query(async () => {
    try {
      const schemas = await makeHubSpotRequest('/crm/v3/schemas');
      
      // Separate standard and custom objects
      const standardObjects = ['contacts', 'companies', 'deals', 'tickets', 'products', 'line_items'];
      const customObjects = schemas.results?.filter(
        (schema: any) => !standardObjects.includes(schema.objectTypeId)
      ) || [];
      
      return {
        success: true,
        totalSchemas: schemas.results?.length || 0,
        customObjects: customObjects.map((schema: any) => ({
          id: schema.objectTypeId,
          name: schema.name,
          labels: schema.labels,
          properties: schema.properties?.length || 0
        })),
        standardObjects: schemas.results?.filter(
          (schema: any) => standardObjects.includes(schema.objectTypeId)
        ).map((schema: any) => ({
          id: schema.objectTypeId,
          name: schema.name
        }))
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch schemas - you may need additional permissions'
      };
    }
  });

// Create contact
export const createContactProcedure = publicProcedure
  .input(z.object({
    email: z.string().email(),
    firstname: z.string().optional(),
    lastname: z.string().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    properties: z.record(z.string(), z.any()).optional()
  }))
  .mutation(async ({ input }) => {
    const properties = {
      email: input.email,
      ...(input.firstname && { firstname: input.firstname }),
      ...(input.lastname && { lastname: input.lastname }),
      ...(input.phone && { phone: input.phone }),
      ...(input.company && { company: input.company }),
      ...input.properties
    };

    return await makeHubSpotRequest('/crm/v3/objects/contacts', 'POST', { properties });
  });

// Update contact
export const updateContactProcedure = publicProcedure
  .input(z.object({
    contactId: z.string(),
    properties: z.record(z.string(), z.any())
  }))
  .mutation(async ({ input }) => {
    return await makeHubSpotRequest(
      `/crm/v3/objects/contacts/${input.contactId}`,
      'PUT',
      { properties: input.properties }
    );
  });

// Search contacts
export const searchContactsProcedure = publicProcedure
  .input(z.object({
    query: z.string(),
    limit: z.number().optional().default(10)
  }))
  .query(async ({ input }) => {
    const searchBody = {
      filterGroups: [{
        filters: [
          {
            propertyName: 'email',
            operator: 'CONTAINS_TOKEN',
            value: input.query
          }
        ]
      }],
      limit: input.limit,
      sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }]
    };

    return await makeHubSpotRequest('/crm/v3/objects/contacts/search', 'POST', searchBody);
  });

// Get pipelines and stages
export const getPipelinesProcedure = publicProcedure
  .input(z.object({
    objectType: z.enum(['deals', 'tickets']).optional().default('deals')
  }))
  .query(async ({ input }) => {
    return await makeHubSpotRequest(`/crm/v3/pipelines/${input.objectType}`);
  });

// Export all procedures for use in app-router.ts
export const hubspotProxyRouter = {
  testConnection: testConnectionProcedure,
  getContacts: getContactsProcedure,
  getDeals: getDealsProcedure,
  getCustomObjects: getCustomObjectsProcedure,
  getSchemas: getSchemasProcedure,
  createContact: createContactProcedure,
  updateContact: updateContactProcedure,
  searchContacts: searchContactsProcedure,
  getPipelines: getPipelinesProcedure
};
