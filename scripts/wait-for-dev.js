import { spawn } from 'child_process';
import http from 'http';

const ports = [3000, 3001, 3002, 3003, 3004, 3005];

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function findDevServer() {
  for (const port of ports) {
    const isAvailable = await checkPort(port);
    if (isAvailable) {
      console.log(`✅ Found Vite dev server on port ${port}`);
      return port;
    }
  }
  throw new Error('No Vite dev server found on any expected port');
}

async function main() {
  try {
    const port = await findDevServer();
    
    // Start Electron
    const electron = spawn('electron', ['.'], {
      stdio: 'inherit',
      env: { ...process.env, VITE_PORT: port.toString() }
    });
    
    electron.on('close', (code) => {
      process.exit(code);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main(); 