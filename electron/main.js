const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const FileManager = require('./fileManager');
const FIRProcessor = require('./firProcessor');

// Helper function to detect sample rate from data points (updated)
const detectSampleRate = (points) => {
  if (points.length < 2) return 48000;
  
  const maxFreq = Math.max(...points.map(p => p.frequency));
  
  // Since we're cutting at 22kHz, we can use a lower sample rate
  // 44.1kHz is sufficient for 22kHz content (Nyquist theorem)
  // But we'll use 48kHz for better compatibility and headroom
  if (maxFreq <= 22000) {
    return 48000;
  }
  
  // If somehow we have higher frequencies, calculate based on Nyquist
  return Math.ceil(maxFreq * 2 * 1.1);
};

// Helper function to serialize TRF data for IPC communication
const serializeTRFData = (trfData) => {
  if (!trfData) return null;
  
  return {
    fileName: String(trfData.fileName || ''),
    filePath: String(trfData.filePath || ''),
    dataPoints: (trfData.dataPoints || []).map(point => {
      // Handle null/undefined points
      if (!point) return null;
      
      return {
        frequency: Number(point.frequency) || 0,
        magnitude: Number(point.magnitude) || 0,
        phase: Number(point.phase) || 0,
        ...(point.coherence !== undefined && { coherence: Number(point.coherence) || 0 })
      };
    }).filter(point => point !== null), // Remove null points
    sampleRate: Number(trfData.sampleRate) || 48000,
    pointCount: Number(trfData.pointCount) || 0,
    frequencyRange: {
      min: Number(trfData.frequencyRange?.min) || 0,
      max: Number(trfData.frequencyRange?.max) || 0
    },
    // Add additional properties if they exist
    ...(trfData.magnitudeRange && {
      magnitudeRange: {
        min: Number(trfData.magnitudeRange.min) || 0,
        max: Number(trfData.magnitudeRange.max) || 0,
        average: Number(trfData.magnitudeRange.average) || 0
      }
    }),
    ...(trfData.phaseRange && {
      phaseRange: {
        min: Number(trfData.phaseRange.min) || 0,
        max: Number(trfData.phaseRange.max) || 0,
        average: Number(trfData.phaseRange.average) || 0
      }
    }),
    ...(trfData.hasCoherence !== undefined && { hasCoherence: Boolean(trfData.hasCoherence) }),
    ...(trfData.coherenceStats && {
      coherenceStats: {
        count: Number(trfData.coherenceStats.count) || 0,
        average: Number(trfData.coherenceStats.average) || 0,
        min: Number(trfData.coherenceStats.min) || 0,
        max: Number(trfData.coherenceStats.max) || 0
      }
    }),
    ...(trfData.qualityAssessment && {
      qualityAssessment: {
        overall: String(trfData.qualityAssessment.overall || 'good'),
        issues: Array.isArray(trfData.qualityAssessment.issues) ? trfData.qualityAssessment.issues.map(String) : [],
        warnings: Array.isArray(trfData.qualityAssessment.warnings) ? trfData.qualityAssessment.warnings.map(String) : [],
        recommendations: Array.isArray(trfData.qualityAssessment.recommendations) ? trfData.qualityAssessment.recommendations.map(String) : []
      }
    }),
    ...(trfData.fileFormat && { fileFormat: String(trfData.fileFormat) }),
    ...(trfData.analysis && {
      analysis: {
        pointCount: Number(trfData.analysis.pointCount) || 0,
        frequencyRange: {
          min: Number(trfData.analysis.frequencyRange?.min) || 0,
          max: Number(trfData.analysis.frequencyRange?.max) || 0,
          span: Number(trfData.analysis.frequencyRange?.span) || 0
        },
        magnitudeRange: {
          min: Number(trfData.analysis.magnitudeRange?.min) || 0,
          max: Number(trfData.analysis.magnitudeRange?.max) || 0,
          average: Number(trfData.analysis.magnitudeRange?.average) || 0
        },
        phaseRange: {
          min: Number(trfData.analysis.phaseRange?.min) || 0,
          max: Number(trfData.analysis.phaseRange?.max) || 0,
          average: Number(trfData.analysis.phaseRange?.average) || 0
        },
        hasCoherence: Boolean(trfData.analysis.hasCoherence),
        ...(trfData.analysis.coherenceStats && {
          coherenceStats: {
            count: Number(trfData.analysis.coherenceStats.count) || 0,
            average: Number(trfData.analysis.coherenceStats.average) || 0,
            min: Number(trfData.analysis.coherenceStats.min) || 0,
            max: Number(trfData.analysis.coherenceStats.max) || 0
          }
        })
      }
    })
  };
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
      const trfData = await FileManager.processTRFFile(result.filePaths[0]);
      return serializeTRFData(trfData);
    }
    return null;
  } catch (error) {
    console.error('File open error:', error);
    throw error;
  }
});

ipcMain.handle('process-dropped-file', async (event, filePath) => {
  try {
    const trfData = await FileManager.processTRFFile(filePath);
    return serializeTRFData(trfData);
  } catch (error) {
    console.error('Dropped file processing error:', error);
    throw error;
  }
});

ipcMain.handle('process-pasted-data', async (event, pastedText) => {
  try {
    // Convert pasted text to buffer for the parser
    const buffer = Buffer.from(pastedText, 'utf-8');
    
    // Parse the TRF data using the existing parser (includes 22kHz cutoff)
    const { parseTRF, apply22kHzCutoff, detectOptimalSampleRate } = require('./trfParser.js');
    const dataPoints = parseTRF(buffer);
    
    if (dataPoints.length === 0) {
      throw new Error('No valid data points found in pasted content');
    }
    
    // Apply additional 22kHz cutoff as safety measure
    const filteredPoints = apply22kHzCutoff(dataPoints);
    
    if (filteredPoints.length === 0) {
      throw new Error('No valid data points found after 22kHz cutoff');
    }
    
    // Create data structure similar to file import
    const processedData = {
      fileName: 'Pasted TRF Data',
      filePath: null,
      dataPoints: filteredPoints,
      sampleRate: detectOptimalSampleRate(filteredPoints),
      pointCount: filteredPoints.length,
      frequencyRange: {
        min: Math.min(...filteredPoints.map(p => p.frequency)),
        max: Math.max(...filteredPoints.map(p => p.frequency))
      }
    };
    
    console.log(`✅ Processed pasted data: ${filteredPoints.length} points (max freq: ${Math.max(...filteredPoints.map(p => p.frequency))} Hz)`);
    
    return serializeTRFData(processedData);
  } catch (error) {
    console.error('Pasted data processing error:', error);
    throw error;
  }
});

// IPC Handlers for FIR Filter Processing
ipcMain.handle('design-fir-filter', async (event, trfData, config) => {
  try {
    const result = await FIRProcessor.designFilter(trfData, config);
    
    // Ensure the result is serializable
    return {
      coefficients: Array.isArray(result.coefficients) ? result.coefficients.map(c => Number(c) || 0) : [],
      frequencyResponse: Array.isArray(result.frequencyResponse) ? result.frequencyResponse.map(point => ({
        frequency: Number(point.frequency) || 0,
        magnitude: Number(point.magnitude) || 0,
        phase: Number(point.phase) || 0
      })) : [],
      metadata: {
        numTaps: Number(result.metadata?.numTaps) || 0,
        sampleRate: Number(result.metadata?.sampleRate) || 48000,
        method: String(result.metadata?.method || ''),
        filterType: String(result.metadata?.filterType || ''),
        cutoffFrequency: Number(result.metadata?.cutoffFrequency) || 0,
        windowType: String(result.metadata?.windowType || ''),
        ...(result.metadata?.frequencyRange && {
          frequencyRange: {
            enabled: Boolean(result.metadata.frequencyRange.enabled),
            min: Number(result.metadata.frequencyRange.min) || 0,
            max: Number(result.metadata.frequencyRange.max) || 0,
            preset: String(result.metadata.frequencyRange.preset || '')
          }
        }),
        originalDataPoints: Number(result.metadata?.originalDataPoints) || 0,
        filteredDataPoints: Number(result.metadata?.filteredDataPoints) || 0
      }
    };
  } catch (error) {
    console.error('FIR filter design error:', error);
    throw error;
  }
});

ipcMain.handle('export-coefficients', async (event, coefficients, format, sampleRate = 48000) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'High Resolution Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled) {
      return await FIRProcessor.exportCoefficients(coefficients, format, result.filePath, sampleRate);
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