import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { testConnectionProcedure, getCustomSchemasProcedure, getCustomObjectsProcedure, getCustomObjectProcedure, searchContactByEmailProcedure, getServicesProcedure as getServicesFromContactsProcedure, getArtistsProcedure, getContactServicesProcedure, testWebhookConfigProcedure, manageWebhookProcedure, diagnosticProcedure } from "./routes/hubspot/contacts/route";
import { getServiceSchemasProcedure, getServicesProcedure, getServiceProcedure } from "./routes/hubspot/deals/route";
import { createUserProcedure, loginUserProcedure, getUserProcedure, syncUserWithHubSpotProcedure, clearUsersProcedure, getAllUsersProcedure, updateUserProcedure } from "./routes/users/create/route";

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
  hubspot: createTRPCRouter({
    testConnection: testConnectionProcedure,
    diagnostic: diagnosticProcedure,
    searchContactByEmail: searchContactByEmailProcedure,
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