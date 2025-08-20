// backend/trpc/app-router.ts
// THIS IS YOUR COMPLETE UPDATED FILE - REPLACE THE ENTIRE CONTENTS

import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";

// Import all your existing HubSpot procedures
import { 
  testConnectionProcedure, 
  getCustomSchemasProcedure, 
  getCustomObjectsProcedure, 
  getCustomObjectProcedure, 
  searchContactByEmailProcedure, 
  getServicesProcedure as getServicesFromContactsProcedure, 
  getArtistsProcedure, 
  getContactServicesProcedure, 
  testWebhookConfigProcedure, 
  manageWebhookProcedure, 
  diagnosticProcedure 
} from "./routes/hubspot/contacts/route";

import { 
  getServiceSchemasProcedure, 
  getServicesProcedure, 
  getServiceProcedure 
} from "./routes/hubspot/deals/route";

// Import user procedures
import { 
  createUserProcedure, 
  loginUserProcedure, 
  getUserProcedure, 
  syncUserWithHubSpotProcedure, 
  clearUsersProcedure, 
  getAllUsersProcedure, 
  updateUserProcedure 
} from "./routes/users/create/route";

// ⭐ IMPORT THE NEW PROXY ROUTER - THIS IS THE NEW LINE
import { hubspotProxyRouter } from "./routes/hubspot/proxy";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  
  users: createTRPCRouter({
    create: createUserProcedure,
    login: loginUserProcedure,
    getById: getUserProcedure,
    syncWithHubSpot: syncUserWithHubSpotProcedure,
    clear: clearUsersProcedure,
    getAll: getAllUsersProcedure,
    update: updateUserProcedure,
  }),
  
  // ⭐ THIS IS THE UPDATED HUBSPOT SECTION - NOW INCLUDES BOTH OLD AND NEW ROUTES
  hubspot: createTRPCRouter({
    // Existing routes (keep these for backward compatibility)
    testConnection: testConnectionProcedure,
    diagnostic: diagnosticProcedure,
    searchContactByEmail: searchContactByEmailProcedure,
    
    // ⭐ ADD ALL THE NEW PROXY ROUTES HERE
    // These are from the proxy.ts file you created in Step 2
    getContacts: hubspotProxyRouter.getContacts,
    getDeals: hubspotProxyRouter.getDeals,
    getCustomObjects: hubspotProxyRouter.getCustomObjects,
    getSchemas: hubspotProxyRouter.getSchemas,
    createContact: hubspotProxyRouter.createContact,
    updateContact: hubspotProxyRouter.updateContact,
    searchContacts: hubspotProxyRouter.searchContacts,
    getPipelines: hubspotProxyRouter.getPipelines,
    
    // Existing nested routers (keep these)
    customObjects: createTRPCRouter({
      getSchemas: getCustomSchemasProcedure,
      getAll: getCustomObjectsProcedure,
      getById: getCustomObjectProcedure,
    }),
    
    services: createTRPCRouter({
      getSchemas: getServiceSchemasProcedure,
      getAll: getServicesFromContactsProcedure,
      getById: getServiceProcedure,
      getForContact: getContactServicesProcedure,
    }),
    
    artists: createTRPCRouter({
      getAll: getArtistsProcedure,
    }),
    
    webhooks: createTRPCRouter({
      testConfig: testWebhookConfigProcedure,
      manage: manageWebhookProcedure,
    }),
  }),
});

export type AppRouter = typeof appRouter;
