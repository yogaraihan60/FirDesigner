const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Test API
  testAPI: () => ipcRenderer.invoke('test-api'),
  
          // File operations
        openTRFFile: () => ipcRenderer.invoke('dialog:openFile'),
        processDroppedFile: (filePath) => ipcRenderer.invoke('process-dropped-file', filePath),
        processPastedData: (pastedText) => ipcRenderer.invoke('process-pasted-data', pastedText),
  
  // FIR filter operations
  designFIRFilter: (trfData, config) => ipcRenderer.invoke('design-fir-filter', trfData, config),
  exportCoefficients: (coefficients, format) => ipcRenderer.invoke('export-coefficients', coefficients, format),
  
  // Event listeners
  onError: (callback) => {
    ipcRenderer.on('error-channel', (event, data) => callback(data));
  },
  
  onTRFLoaded: (callback) => {
    ipcRenderer.on('trf-loaded', (event, data) => callback(data));
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
}); 