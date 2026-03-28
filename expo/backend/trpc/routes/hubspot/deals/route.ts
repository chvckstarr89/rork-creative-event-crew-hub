import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { Client } from '@hubspot/api-client';

// Custom object type IDs from HubSpot
const SERVICES_OBJECT_TYPE = '0-162';
const ARTISTS_OBJECT_TYPE = '2-47887496';

// Validate environment variables
if (!process.env.HUBSPOT_ACCESS_TOKEN) {
  console.error('❌ ERROR: HUBSPOT_ACCESS_TOKEN not found in environment variables');
}

const hubspotClient = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

// Get service schemas - using your actual scopes
export const getServiceSchemasProcedure = publicProcedure
  .query(async () => {
    try {
      // Try to get schemas using the core API first
      const response = await hubspotClient.crm.schemas.coreApi.getAll();
      
      // Filter for service-related schemas
      const serviceSchemas = response.results?.filter(schema => 
        schema.name?.toLowerCase().includes('service') || 
        schema.objectTypeId?.toLowerCase().includes('service')
      ) || [];
      
      return {
        schemas: serviceSchemas,
        totalCount: serviceSchemas.length,
      };
    } catch (error) {
      console.error('HubSpot service schemas error:', error);
      // Fallback: return basic connection info
      return {
        schemas: [],
        message: 'Connected to HubSpot, but service schemas not accessible. You may need to create custom service objects first.',
        suggestion: 'Create custom objects in HubSpot with "service" in the name to see them here.'
      };
    }
  });

// Get services (assuming 'services' is a custom object type)
export const getServicesProcedure = publicProcedure
  .input(z.object({
    limit: z.number().optional().default(10),
    after: z.string().optional(),
  }))
  .query(async ({ input }: { input: { limit?: number; after?: string } }) => {
    try {
      // Try to get services as a custom object type
      const response = await hubspotClient.crm.objects.basicApi.getPage(
        SERVICES_OBJECT_TYPE, // Using actual Services custom object type ID
        input.limit,
        input.after
      );
      
      return {
        services: response.results,
        paging: response.paging,
      };
    } catch (error) {
      console.error('HubSpot services error:', error);
      throw new Error('Failed to fetch services from HubSpot');
    }
  });

// Get single service
export const getServiceProcedure = publicProcedure
  .input(z.object({
    serviceId: z.string(),
  }))
  .query(async ({ input }: { input: { serviceId: string } }) => {
    try {
      const response = await hubspotClient.crm.objects.basicApi.getById(
        SERVICES_OBJECT_TYPE, // Using actual Services custom object type ID
        input.serviceId
      );
      
      return response;
    } catch (error) {
      console.error('HubSpot service error:', error);
      throw new Error('Failed to fetch service from HubSpot');
    }
  });