// Load environment variables first
require('dotenv').config();

// Debug environment loading
console.log('🔧 Backend starting...');
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 Current working directory:', process.cwd());
console.log('🔧 Environment variables loaded:');
console.log('  - HUBSPOT_ACCESS_TOKEN present:', !!process.env.HUBSPOT_ACCESS_TOKEN);
console.log('  - HUBSPOT_CLIENT_SECRET present:', !!process.env.HUBSPOT_CLIENT_SECRET);

import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import crypto from "crypto";

// Debug environment variables on startup
console.log('🔍 Environment Check:');
console.log('- HUBSPOT_ACCESS_TOKEN present:', !!process.env.HUBSPOT_ACCESS_TOKEN);
console.log('- HUBSPOT_CLIENT_SECRET present:', !!process.env.HUBSPOT_CLIENT_SECRET);
if (process.env.HUBSPOT_ACCESS_TOKEN) {
  console.log('- Token preview:', process.env.HUBSPOT_ACCESS_TOKEN.substring(0, 15) + '...');
}

// app will be mounted at /api
const app = new Hono();

// Enable CORS for all routes
app.use("*", cors());

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

// HubSpot webhook signature validation
function validateHubSpotWebhook(signature: string, requestBody: string, clientSecret: string): boolean {
  if (!signature || !clientSecret) {
    console.log('❌ Missing signature or client secret');
    return false;
  }

  try {
    // HubSpot v3 signature validation
    const sourceString = clientSecret + requestBody;
    const hash = crypto
      .createHash('sha256')
      .update(sourceString)
      .digest('hex');
    
    console.log('🔍 Webhook validation:', {
      receivedSignature: signature,
      calculatedHash: hash,
      matches: hash === signature
    });
    
    return hash === signature;
  } catch (error) {
    console.error('❌ Webhook validation error:', error);
    return false;
  }
}

// HubSpot webhook endpoint
app.post("/webhooks/hubspot", async (c) => {
  console.log('📨 Received HubSpot webhook');
  
  try {
    const signature = c.req.header('x-hubspot-signature-v3');
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    
    if (!clientSecret) {
      console.log('❌ HUBSPOT_CLIENT_SECRET not configured');
      return c.json({ error: 'Webhook validation not configured' }, 500);
    }
    
    // Get raw request body
    const requestBody = await c.req.text();
    
    // Validate signature
    if (!validateHubSpotWebhook(signature || '', requestBody, clientSecret)) {
      console.log('❌ Invalid webhook signature');
      return c.json({ error: 'Invalid signature' }, 401);
    }
    
    // Parse the validated webhook data
    const webhookData = JSON.parse(requestBody);
    console.log('✅ Valid webhook received:', {
      subscriptionType: webhookData.subscriptionType,
      objectId: webhookData.objectId,
      propertyName: webhookData.propertyName,
      changeSource: webhookData.changeSource
    });
    
    // Process webhook based on type
    await processHubSpotWebhook(webhookData);
    
    return c.json({ status: 'success', message: 'Webhook processed' });
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return c.json({ error: 'Webhook processing failed', details: error.message }, 500);
  }
});

// Process different types of HubSpot webhooks
async function processHubSpotWebhook(data: any) {
  console.log('🔄 Processing webhook:', data.subscriptionType);
  
  switch (data.subscriptionType) {
    case 'contact.creation':
      console.log('👤 New contact created:', data.objectId);
      // Handle new contact creation
      break;
      
    case 'contact.propertyChange':
      console.log('📝 Contact property changed:', {
        contactId: data.objectId,
        property: data.propertyName,
        newValue: data.propertyValue
      });
      // Handle contact property changes
      break;
      
    case 'deal.creation':
      console.log('💼 New deal created:', data.objectId);
      // Handle new deal creation
      break;
      
    case 'deal.propertyChange':
      console.log('💰 Deal property changed:', {
        dealId: data.objectId,
        property: data.propertyName,
        newValue: data.propertyValue
      });
      // Handle deal property changes
      break;
      
    default:
      console.log('❓ Unknown webhook type:', data.subscriptionType);
  }
}

// Test webhook endpoint (for development)
app.post("/webhooks/hubspot/test", async (c) => {
  console.log('🧪 Test webhook endpoint called');
  
  const body = await c.req.json();
  console.log('📋 Test webhook data:', body);
  
  return c.json({ 
    status: 'success', 
    message: 'Test webhook received',
    receivedData: body,
    timestamp: new Date().toISOString()
  });
});

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running", timestamp: new Date().toISOString() });
});

// Test HubSpot endpoint for debugging
app.get("/test-hubspot", async (c) => {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    return c.json({ error: 'No token configured' }, 500);
  }
  
  try {
    const response = await fetch('https://api.hubapi.com/account-info/v3/details', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return c.json({ 
        success: true, 
        account: {
          portalId: data.portalId,
          accountType: data.accountType,
          timeZone: data.timeZone
        },
        tokenStatus: 'Valid'
      });
    } else {
      const errorText = await response.text();
      return c.json({ 
        success: false, 
        error: errorText, 
        status: response.status,
        tokenStatus: 'Invalid'
      });
    }
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: error.message,
      tokenStatus: 'Network Error'
    });
  }
});

// Start the server
const port = process.env.PORT || 3001;

console.log(`🚀 Starting server on port ${port}`);
console.log(`🔗 Health check: http://localhost:${port}/api`);
console.log(`🔗 tRPC endpoint: http://localhost:${port}/api/trpc`);
console.log(`🔗 HubSpot test: http://localhost:${port}/api/test-hubspot`);

// For Bun runtime
if (typeof (globalThis as any).Bun !== 'undefined') {
  (globalThis as any).Bun.serve({
    port: Number(port),
    fetch: app.fetch,
  });
  console.log(`✅ Hono server running on http://localhost:${port}/api`);
} else {
  // Fallback for Node.js
  console.log('⚠️  Running in Node.js mode - consider using Bun for better performance');
}

export default app;