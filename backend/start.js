#!/usr/bin/env node

// Simple backend startup script for Rork
const { spawn } = require('child_process');
const path = require('path');

const __dirname = path.dirname(require.main.filename);

console.log('🚀 Starting Hono backend server...');

// Start the backend server
const backend = spawn('bun', ['run', path.join(__dirname, 'backend', 'hono.ts')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: process.env.PORT || '3001'
  }
});

backend.on('error', (error) => {
  console.error('❌ Backend startup error:', error);
});

backend.on('exit', (code) => {
  console.log(`🔄 Backend process exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down backend...');
  backend.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down backend...');
  backend.kill('SIGTERM');
  process.exit(0);
});

console.log('✅ Backend startup script running. Press Ctrl+C to stop.');