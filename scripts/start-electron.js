import { spawn } from 'child_process';

console.log('🚀 Starting Electron...');

const electron = spawn('electron', ['.'], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    NODE_ENV: 'development',
    VITE_PORT: '3000'
  }
});

electron.on('close', (code) => {
  console.log(`Electron exited with code ${code}`);
  process.exit(code);
});

electron.on('error', (error) => {
  console.error('Failed to start Electron:', error);
  process.exit(1);
}); 