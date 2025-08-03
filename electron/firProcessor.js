const fs = require('fs/promises');
const EventEmitter = require('events');

class FIRProcessor extends EventEmitter {
  constructor() {
    super();
  }

  designFilter(trfData, options = {}) {
    const defaults = {
      method: 'least-squares',
      numTaps: 512,
      sampleRate: 48000,
      passbandRipple: 0.1,
      stopbandAttenuation: 80,
      frequencyRange: {
        enabled: false,
        min: 20,
        max: 22000,
        preset: 'human-hearing'
      }
    };
    
    const config = { ...defaults, ...options };
    
    try {
      // Apply frequency range filtering if enabled
      let processedData = trfData;
      if (config.frequencyRange && config.frequencyRange.enabled) {
        processedData = this.applyFrequencyRangeFilter(trfData, config.frequencyRange);
        console.log(`Applied frequency range filter: ${config.frequencyRange.min}-${config.frequencyRange.max} Hz`);
        console.log(`Data points: ${trfData.length} → ${processedData.length}`);
      }
      
      // Convert TRF data to frequency response
      const freqResponse = this.convertTRFToResponse(processedData, config.sampleRate);
      
      // Design filter using simple window method (placeholder for fir-filter-design)
      const coefficients = this.designFIRFilter(freqResponse, config);
      
      // Calculate frequency response of designed filter
      const filterResponse = this.calculateFilterResponse(coefficients, config.sampleRate);
      
      return {
        coefficients,
        frequencyResponse: filterResponse,
        metadata: {
          numTaps: coefficients.length,
          sampleRate: config.sampleRate,
          method: config.method,
          filterType: config.filterType || 'lowpass',
          cutoffFrequency: config.cutoffFrequency || 0.1,
          windowType: config.windowType || 'hamming',
          frequencyRange: config.frequencyRange,
          originalDataPoints: trfData.length,
          filteredDataPoints: processedData.length
        }
      };
    } catch (err) {
      this.emit('error', 'FILTER_DESIGN_ERROR', err);
      throw err;
    }
  }

  applyFrequencyRangeFilter(trfData, frequencyRange) {
    const { min, max } = frequencyRange;
    
    // Filter data points within the specified frequency range
    const filteredData = trfData.filter(point => {
      return point.frequency >= min && point.frequency <= max;
    });
    
    if (filteredData.length === 0) {
      throw new Error(`No data points found in frequency range ${min}-${max} Hz`);
    }
    
    // Sort by frequency for consistent processing
    filteredData.sort((a, b) => a.frequency - b.frequency);
    
    return filteredData;
  }

  convertTRFToResponse(trfData, sampleRate) {
    const nyquist = sampleRate / 2;
    return trfData.map(point => ({
      freq: point.frequency / nyquist,
      amp: Math.pow(10, point.magnitude / 20), // Convert dB to linear
      phase: point.phase * (Math.PI / 180) // Convert degrees to radians
    }));
  }
  
  designFIRFilter(freqResponse, config) {
    // Simple FIR filter design using window method
    // This is a placeholder - in production, use a proper FIR design library
    const numTaps = config.numTaps;
    const coefficients = new Array(numTaps).fill(0);
    
    // Simple low-pass filter design
    const cutoffFreq = 0.1; // Normalized frequency
    const center = Math.floor(numTaps / 2);
    
    for (let i = 0; i < numTaps; i++) {
      const n = i - center;
      if (n === 0) {
        coefficients[i] = 2 * cutoffFreq;
      } else {
        coefficients[i] = Math.sin(2 * Math.PI * cutoffFreq * n) / (Math.PI * n);
      }
    }
    
    // Apply window function (Hamming)
    this.applyWindow(coefficients);
    
    return coefficients;
  }
  
  applyWindow(coefficients) {
    const N = coefficients.length;
    for (let i = 0; i < N; i++) {
      const windowValue = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1));
      coefficients[i] *= windowValue;
    }
  }
  
  calculateFilterResponse(coefficients, sampleRate) {
    const numPoints = 1024;
    const response = [];
    const nyquist = sampleRate / 2;
    
    for (let i = 0; i < numPoints; i++) {
      const freq = (i / numPoints) * nyquist;
      const normalizedFreq = freq / nyquist;
      
      // Calculate frequency response using FFT-like approach
      let real = 0;
      let imag = 0;
      
      for (let j = 0; j < coefficients.length; j++) {
        const phase = -2 * Math.PI * normalizedFreq * j;
        real += coefficients[j] * Math.cos(phase);
        imag += coefficients[j] * Math.sin(phase);
      }
      
      const magnitude = Math.sqrt(real * real + imag * imag);
      const phase = Math.atan2(imag, real);
      
      response.push({
        frequency: freq,
        magnitude: 20 * Math.log10(magnitude), // Convert to dB
        phase: phase * (180 / Math.PI) // Convert to degrees
      });
    }
    
    return response;
  }
  
  async exportCoefficients(coefficients, format, filePath, sampleRate = 48000) {
    try {
      // Ensure coefficients are valid numbers
      const validCoefficients = coefficients.map(c => {
        const value = Number(c);
        return isFinite(value) ? value : 0;
      });
      
      let content = '';
      
      switch (format) {
        case 'text':
          content = validCoefficients.map(c => c.toFixed(6)).join('\n');
          break;
        case 'csv':
          content = validCoefficients.map(c => c.toFixed(6)).join(',');
          break;
        case 'matlab':
          content = `% FIR Filter Coefficients\ncoefficients = [${validCoefficients.map(c => c.toFixed(6)).join(', ')}];`;
          break;
        case 'python':
          content = `# FIR Filter Coefficients\ncoefficients = [${validCoefficients.map(c => c.toFixed(6)).join(', ')}]`;
          break;
        case 'high-res':
          // Format: /* Fs(Hz)=   48.0000K */ /* Coef Line Format= Index & Coef */
          const fsK = (sampleRate / 1000).toFixed(4);
          content = `/* Fs(Hz)=   ${fsK}K */\n/* Coef Line Format= Index & Coef */\n`;
          content += validCoefficients.map((c, index) => {
            // Use a more precise formatting approach
            const formatted = c.toFixed(15);
            // Ensure we get exactly 15 decimal places
            const parts = formatted.split('.');
            if (parts.length === 2 && parts[1].length < 15) {
              const padded = parts[1].padEnd(15, '0');
              return `${index}, ${parts[0]}.${padded}`;
            }
            return `${index}, ${formatted}`;
          }).join('\n');
          break;
        default:
          content = validCoefficients.map(c => c.toFixed(6)).join('\n');
      }
      
      await fs.writeFile(filePath, content, 'utf8');
      return { success: true, filePath };
    } catch (err) {
      this.emit('error', 'EXPORT_ERROR', err);
      throw err;
    }
  }
}

module.exports = new FIRProcessor(); 