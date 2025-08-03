const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const FileManager = require('./fileManager');
const FIRProcessor = require('./firProcessor');

// Helper function to detect sample rate from data points
const detectSampleRate = (points) => {
  if (points.length < 2) return 48000;
  
  const maxFreq = Math.max(...points.map(p => p.frequency));
  // Nyquist frequency * safety margin (1.1)
  return Math.ceil(maxFreq * 2 * 1.1);
};

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false
    },
    title: 'FIR Designer',
    icon: path.join(__dirname, '../assets/icon.png')
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    // Try to find the correct Vite port
    const ports = [3000, 3001, 3002, 3003, 3004, 3005];
    let loaded = false;
    
    for (const port of ports) {
      try {
        const url = `http://localhost:${port}`;
        await mainWindow.loadURL(url);
        console.log(`✅ Loaded app from ${url}`);
        loaded = true;
        break;
      } catch (error) {
        console.log(`Port ${port} not available: ${error.message}`);
      }
    }
    
    if (!loaded) {
      console.error('❌ Could not load app from any available port');
      // Show error in window
      await mainWindow.loadURL('data:text/html,<html><body><h1>Error: Could not connect to Vite dev server</h1><p>Please ensure the development server is running with <code>npm run dev</code></p></body></html>');
    }
    
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Test API handler
ipcMain.handle('test-api', () => {
  return { message: 'Electron API is working!' };
});

// IPC Handlers for TRF File Operations
ipcMain.handle('dialog:openFile', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'TRF Files', extensions: ['trf'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return await FileManager.processTRFFile(result.filePaths[0]);
    }
    return null;
  } catch (error) {
    console.error('File open error:', error);
    throw error;
  }
});

ipcMain.handle('process-dropped-file', async (event, filePath) => {
  try {
    return await FileManager.processTRFFile(filePath);
  } catch (error) {
    console.error('Dropped file processing error:', error);
    throw error;
  }
});

ipcMain.handle('process-pasted-data', async (event, pastedText) => {
  try {
    // Convert pasted text to buffer for the parser
    const buffer = Buffer.from(pastedText, 'utf-8');
    
    // Parse the TRF data using the existing parser
    const { parseTRF } = require('./trfParser.js');
    const dataPoints = parseTRF(buffer);
    
    if (dataPoints.length === 0) {
      throw new Error('No valid data points found in pasted content');
    }
    
    // Create data structure similar to file import
    const processedData = {
      fileName: 'Pasted TRF Data',
      filePath: null,
      dataPoints,
      sampleRate: detectSampleRate(dataPoints),
      pointCount: dataPoints.length,
      frequencyRange: {
        min: Math.min(...dataPoints.map(p => p.frequency)),
        max: Math.max(...dataPoints.map(p => p.frequency))
      }
    };
    
    return processedData;
  } catch (error) {
    console.error('Pasted data processing error:', error);
    throw error;
  }
});

// IPC Handlers for FIR Filter Processing
ipcMain.handle('design-fir-filter', async (event, trfData, config) => {
  try {
    return await FIRProcessor.designFilter(trfData, config);
  } catch (error) {
    console.error('FIR filter design error:', error);
    throw error;
  }
});

ipcMain.handle('export-coefficients', async (event, coefficients, format) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled) {
      return await FIRProcessor.exportCoefficients(coefficients, format, result.filePath);
    }
    return null;
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
});

// Error handling
FileManager.on('error', (type, error) => {
  if (mainWindow) {
    mainWindow.webContents.send('error-channel', { type, error: error.message });
  }
});

FIRProcessor.on('error', (type, error) => {
  if (mainWindow) {
    mainWindow.webContents.send('error-channel', { type, error: error.message });
  }
}); 