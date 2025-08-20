import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { Client } from '@hubspot/api-client';

const hubspotClient = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

// In-memory user storage (replace with database in production)
const users: any[] = [];

export const createUserProcedure = publicProcedure
  .input(z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    role: z.enum(['photographer', 'videographer', 'client', 'assistant', 'director']),
    serviceType: z.enum(['photography', 'videography', 'hybrid']),
    company: z.string().optional(),
    phone: z.string().optional(),
    hubspotContactId: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      // Check if user already exists
      const existingUser = users.find(u => u.email === input.email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      const userId = Date.now().toString();
      const now = new Date();
      
      let hubspotContactId = input.hubspotContactId;
      
      // Create or update HubSpot contact if not provided
      if (!hubspotContactId && process.env.HUBSPOT_ACCESS_TOKEN) {
        try {
          const [firstName, ...lastNameParts] = input.name.split(' ');
          const lastName = lastNameParts.join(' ') || '';
          
          const contactData = {
            properties: {
              email: input.email,
              firstname: firstName,
              lastname: lastName,
              company: input.company || '',
              phone: input.phone || '',
              jobtitle: input.role,
              hs_lead_status: 'NEW',
              lifecyclestage: 'lead'
            }
          };
          
          const hubspotResponse = await hubspotClient.crm.contacts.basicApi.create(contactData);
          hubspotContactId = hubspotResponse.id;
          console.log('Created HubSpot contact:', hubspotContactId);
        } catch (hubspotError) {
          console.warn('Failed to create HubSpot contact:', hubspotError);
          // Continue without HubSpot integration
        }
      }
      
      const newUser = {
        id: userId,
        email: input.email,
        password: input.password, // In production, hash this!
        name: input.name,
        role: input.role,
        serviceType: input.serviceType,
        company: input.company,
        isOnline: true,
        lastSeen: now,
        preferences: {
          notifications: true,
          darkMode: false,
          language: 'en'
        },
        hubspotContactId,
        hubspotDealIds: [],
        createdAt: now,
        updatedAt: now
      };
      
      users.push(newUser);
      
      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    } catch (error) {
      console.error('User creation error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create user');
    }
  });

export const loginUserProcedure = publicProcedure
  .input(z.object({
    email: z.string().email(),
    password: z.string(),
  }))
  .mutation(async ({ input }) => {
    try {
      const user = users.find(u => u.email === input.email && u.password === input.password);
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Update last seen
      user.lastSeen = new Date();
      user.isOnline = true;
      user.updatedAt = new Date();
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  });

export const getUserProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      const user = users.find(u => u.id === input.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Get user error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get user');
    }
  });

export const syncUserWithHubSpotProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .mutation(async ({ input }) => {
    try {
      const user = users.find(u => u.id === input.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!user.hubspotContactId) {
        throw new Error('User is not linked to a HubSpot contact');
      }
      
      // Fetch latest data from HubSpot
      const hubspotContact = await hubspotClient.crm.contacts.basicApi.getById(
        user.hubspotContactId,
        ['email', 'firstname', 'lastname', 'company', 'phone', 'jobtitle', 'city', 'state', 'country']
      );
      
      // Fetch associated deals
      let dealIds: string[] = [];
      try {
        const dealsResponse = await hubspotClient.crm.associations.v4.basicApi.getPage(
          'contacts',
          user.hubspotContactId,
          'deals'
        );
        dealIds = dealsResponse.results?.map((deal: any) => deal.toObjectId) || [];
      } catch (dealError) {
        console.warn('Failed to fetch associated deals:', dealError);
      }
      
      // Update user with HubSpot data
      const hubspotData = hubspotContact.properties;
      user.name = `${hubspotData.firstname || ''} ${hubspotData.lastname || ''}`.trim() || user.name;
      user.company = hubspotData.company || user.company;
      user.hubspotDealIds = dealIds;
      user.updatedAt = new Date();
      
      console.log('Synced user with HubSpot:', user.id, 'Deals:', dealIds.length);
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        hubspotData: hubspotData,
        dealCount: dealIds.length
      };
    } catch (error) {
      console.error('HubSpot sync error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to sync with HubSpot');
    }
  });

// Clear all users (for development/testing)
export const clearUsersProcedure = publicProcedure
  .mutation(async () => {
    try {
      users.length = 0; // Clear the array
      console.log('Cleared all users from storage');
      return { message: 'All users cleared successfully' };
    } catch (error) {
      console.error('Clear users error:', error);
      throw new Error('Failed to clear users');
    }
  });

// Get all users (for development/testing)
export const getAllUsersProcedure = publicProcedure
  .query(async () => {
    try {
      // Return users without passwords
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      return { users: usersWithoutPasswords };
    } catch (error) {
      console.error('Get all users error:', error);
      throw new Error('Failed to get users');
    }
  });

// Update existing user
export const updateUserProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    email: z.string().email().optional(),
    name: z.string().min(1).optional(),
    role: z.enum(['photographer', 'videographer', 'client', 'assistant', 'director']).optional(),
    serviceType: z.enum(['photography', 'videography', 'hybrid']).optional(),
    company: z.string().optional(),
    phone: z.string().optional(),
    hubspotContactId: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      const userIndex = users.findIndex(u => u.id === input.userId);
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      // Update user fields
      const user = users[userIndex];
      if (input.email) user.email = input.email;
      if (input.name) user.name = input.name;
      if (input.role) user.role = input.role;
      if (input.serviceType) user.serviceType = input.serviceType;
      if (input.company !== undefined) user.company = input.company;
      if (input.phone !== undefined) user.phone = input.phone;
      if (input.hubspotContactId !== undefined) user.hubspotContactId = input.hubspotContactId;
      user.updatedAt = new Date();
      
      console.log('Updated user:', user.id);
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Update user error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update user');
    }
  });

// Export users array for other routes to access
export { users };