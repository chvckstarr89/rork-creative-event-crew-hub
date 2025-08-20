import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Check for explicit environment variable first
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // For web environment - use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // For Rork-hosted apps, the backend should be available at the same origin
  // but we need to check if we're in development or production
  if (__DEV__) {
    // In development, try to connect to local backend if available
    return 'http://localhost:3000';
  }
  
  // In production on Rork, use the current origin
  return 'https://rork.com';
};

// Debug the base URL
const baseUrl = getBaseUrl();
console.log('🔗 tRPC Base URL:', baseUrl);
console.log('🔗 Full tRPC URL:', `${baseUrl}/api/trpc`);
console.log('🔗 Environment:', __DEV__ ? 'Development' : 'Production');
console.log('🔗 Platform:', typeof window !== 'undefined' ? 'Web' : 'Mobile');

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${baseUrl}/api/trpc`,
      transformer: superjson,
      // Add error handling for better debugging
      fetch: async (url, options) => {
        console.log('📡 tRPC Request:', {
          url,
          method: options?.method || 'GET',
          headers: options?.headers
        });
        
        try {
          const response = await fetch(url, options);
          console.log('📡 tRPC Response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          });
          
          if (!response.ok) {
            const contentType = response.headers.get('content-type');
            let errorText: string;
            
            if (contentType?.includes('application/json')) {
              try {
                const errorData = await response.json();
                errorText = JSON.stringify(errorData);
              } catch {
                errorText = await response.text();
              }
            } else {
              errorText = await response.text();
            }
            
            console.error('❌ tRPC Error Response:', {
              status: response.status,
              statusText: response.statusText,
              contentType,
              error: errorText.substring(0, 500)
            });
            
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
          
          return response;
        } catch (error: any) {
          console.error('❌ tRPC Fetch Error:', {
            message: error.message,
            name: error.name,
            stack: error.stack?.substring(0, 500)
          });
          
          // Provide more helpful error messages
          if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
            console.warn('🚨 Backend not available - this is expected in Rork-hosted apps without deployed backend');
            throw new Error('Backend not deployed: The tRPC backend is not running. This is normal for Rork-hosted apps without a deployed backend service.');
          }
          
          throw error;
        }
      },
    }),
  ],
});

// Create a simple client for direct API calls when tRPC is not available
export const directApiClient = {
  async testConnection() {
    try {
      const response = await fetch(`${baseUrl}/api/test-hubspot`);
      return await response.json();
    } catch (error: any) {
      console.error('Direct API test failed:', error.message);
      return { error: 'Backend not available', message: error.message };
    }
  }
};