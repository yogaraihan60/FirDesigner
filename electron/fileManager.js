const fs = require('fs/promises');
const path = require('path');
const { parseTRF, analyzeTRFData, isBinaryTRF, apply22kHzCutoff, detectOptimalSampleRate } = require('./trfParser.js');
const EventEmitter = require('events');

class FileManager extends EventEmitter {
  constructor() {
    super();
  }

  async processTRFFile(filePath) {
    try {
      // Read file buffer
      const buffer = await fs.readFile(filePath);
      
      // Detect file format
      const isBinary = isBinaryTRF(buffer);
      console.log(`Processing ${isBinary ? 'binary' : 'text'} TRF file: ${path.basename(filePath)}`);
      
      // Parse TRF data (already applies 22kHz cutoff)
      const dataPoints = parseTRF(buffer);
      
      if (dataPoints.length === 0) {
        throw new Error('No valid data points found in TRF file');
      }
      
      // Apply additional 22kHz cutoff as safety measure
      const filteredPoints = apply22kHzCutoff(dataPoints);
      
      if (filteredPoints.length === 0) {
        throw new Error('No valid data points found after 22kHz cutoff');
      }
      
      // Analyze the data
      const analysis = analyzeTRFData(filteredPoints);
      
      // Detect optimal sample rate with 22kHz consideration
      const sampleRate = detectOptimalSampleRate(filteredPoints);
      
      // Quality assessment
      const qualityAssessment = this.assessDataQuality(filteredPoints, analysis);
      
      console.log(`✅ Processed ${filteredPoints.length} points (max freq: ${Math.max(...filteredPoints.map(p => p.frequency))} Hz, sample rate: ${sampleRate} Hz)`);
      
      return {
        fileName: path.basename(filePath),
        filePath,
        dataPoints: filteredPoints,
        sampleRate,
        pointCount: filteredPoints.length,
        frequencyRange: analysis.frequencyRange,
        magnitudeRange: analysis.magnitudeRange,
        phaseRange: analysis.phaseRange,
        hasCoherence: analysis.hasCoherence,
        coherenceStats: analysis.coherenceStats,
        qualityAssessment,
        fileFormat: isBinary ? 'binary' : 'text',
        analysis
      };
    } catch (err) {
      this.emit('error', 'TRF_PROCESS_ERROR', err);
      throw err;
    }
  }

  detectSampleRate(points) {
    return detectOptimalSampleRate(points);
  }

  assessDataQuality(points, analysis) {
    const assessment = {
      overall: 'good',
      issues: [],
      warnings: [],
      recommendations: []
    };
    
    // Check for extreme magnitude values
    const extremeLowMag = points.filter(p => p.magnitude < -100).length;
    const extremeHighMag = points.filter(p => p.magnitude > 20).length;
    
    if (extremeLowMag > 0) {
      assessment.warnings.push(`${extremeLowMag} points with very low magnitude (< -100 dB)`);
    }
    
    if (extremeHighMag > 0) {
      assessment.warnings.push(`${extremeHighMag} points with very high magnitude (> 20 dB)`);
    }
    
    // Check coherence quality
    if (analysis.hasCoherence && analysis.coherenceStats) {
      const avgCoherence = analysis.coherenceStats.average;
      if (avgCoherence < 0.1) {
        assessment.warnings.push('Low average coherence (< 0.1) - measurement may be noisy');
        assessment.recommendations.push('Consider averaging multiple measurements');
      } else if (avgCoherence < 0.5) {
        assessment.warnings.push('Moderate coherence - some measurement noise detected');
      }
    }
    
    // Check frequency distribution
    const freqBands = {
      low: points.filter(p => p.frequency >= 20 && p.frequency < 200).length,
      mid: points.filter(p => p.frequency >= 200 && p.frequency < 2000).length,
      high: points.filter(p => p.frequency >= 2000 && p.frequency < 20000).length,
      veryHigh: points.filter(p => p.frequency >= 20000 && p.frequency <= 22000).length
    };
    
    const totalPoints = points.length;
    const lowFreqRatio = freqBands.low / totalPoints;
    const highFreqRatio = freqBands.high / totalPoints;
    
    if (lowFreqRatio < 0.1) {
      assessment.warnings.push('Limited low frequency data (< 200 Hz)');
    }
    
    if (highFreqRatio < 0.1) {
      assessment.warnings.push('Limited high frequency data (2k-20k Hz)');
    }
    
    // Check if data was automatically cut at 22kHz
    const maxFreq = Math.max(...points.map(p => p.frequency));
    if (maxFreq === 22000) {
      assessment.warnings.push('Data automatically cut at 22kHz (human hearing limit)');
      assessment.recommendations.push('Original data may have extended beyond 22kHz');
    }
    
    // Determine overall quality
    if (assessment.warnings.length > 3) {
      assessment.overall = 'poor';
    } else if (assessment.warnings.length > 1) {
      assessment.overall = 'fair';
    } else {
      assessment.overall = 'good';
    }
    
    // Add general recommendations
    if (points.length < 100) {
      assessment.recommendations.push('Consider using more frequency points for better resolution');
    }
    
    if (analysis.frequencyRange.span < 1000) {
      assessment.recommendations.push('Limited frequency span - consider wider measurement range');
    }
    
    return assessment;
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

  async getTRFInfo(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const isBinary = isBinaryTRF(buffer);
      
      return {
        fileName: path.basename(filePath),
        fileSize: buffer.length,
        format: isBinary ? 'binary' : 'text',
        canParse: true
      };
    } catch (err) {
      return {
        fileName: path.basename(filePath),
        canParse: false,
        error: err.message
      };
    }
  }
}

module.exports = new FileManager(); 