# Backend Setup Instructions

## Running the Backend

The backend is a Hono server with tRPC that needs to be started separately from the Expo app.

### Option 1: Direct Backend Start
```bash
bun run backend/hono.ts
```

### Option 2: Using the Startup Script
```bash
node backend/start.js
```

## Backend Endpoints

Once running on port 3001:

- **Health Check**: `http://localhost:3001/api`
- **tRPC Endpoint**: `http://localhost:3001/api/trpc`
- **HubSpot Test**: `http://localhost:3001/api/test-hubspot`
- **Webhook Test**: `http://localhost:3001/api/webhooks/hubspot/test`

## Environment Variables

Make sure these are set in your `.env` file:

```env
HUBSPOT_ACCESS_TOKEN=pat-na1-xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
HUBSPOT_CLIENT_SECRET=your_client_secret_here
EXPO_PUBLIC_HUBSPOT_TOKEN=pat-na1-xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
EXPO_PUBLIC_RORK_API_BASE_URL=https://019bvi5wn3qcubne9p8vk.rork.com
```

## Troubleshooting

1. **tRPC Connection Issues**: Make sure the backend is running on port 3001
2. **HubSpot API Errors**: Verify your token has the required scopes
3. **CORS Issues**: The backend includes CORS middleware for all routes

## Development Workflow

1. Start the backend: `bun run backend/hono.ts`
2. In another terminal, start the Expo app: `bun start`
3. The app will connect to the backend via tRPC

The backend will automatically reload when you make changes to the code.