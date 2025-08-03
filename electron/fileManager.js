const fs = require('fs/promises');
const path = require('path');
const { parseTRF } = require('./trfParser.js');
const EventEmitter = require('events');

class FileManager extends EventEmitter {
  constructor() {
    super();
  }

  async processTRFFile(filePath) {
    try {
      // Read file buffer
      const buffer = await fs.readFile(filePath);
      
      // Parse TRF data
      const dataPoints = parseTRF(buffer);
      
      if (dataPoints.length === 0) {
        throw new Error('No valid data points found in TRF file');
      }
      
      // Detect sample rate from data
      const sampleRate = this.detectSampleRate(dataPoints);
      
      return {
        fileName: path.basename(filePath),
        filePath,
        dataPoints,
        sampleRate,
        pointCount: dataPoints.length,
        frequencyRange: {
          min: Math.min(...dataPoints.map(p => p.frequency)),
          max: Math.max(...dataPoints.map(p => p.frequency))
        }
      };
    } catch (err) {
      this.emit('error', 'TRF_PROCESS_ERROR', err);
      throw err;
    }
  }

  detectSampleRate(points) {
    if (points.length < 2) return 48000;
    
    const maxFreq = Math.max(...points.map(p => p.frequency));
    // Nyquist frequency * safety margin (1.1)
    return Math.ceil(maxFreq * 2 * 1.1);
  }

  async validateTRFFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        throw new Error('File is empty');
      }
      
      if (stats.size > 100 * 1024 * 1024) { // 100MB limit
        throw new Error('File too large (max 100MB)');
      }
      
      return true;
    } catch (err) {
      this.emit('error', 'FILE_VALIDATION_ERROR', err);
      throw err;
    }
  }
}

module.exports = new FileManager(); 