export function parseTRF(buffer) {
  // First try to detect if this is a binary TRF file
  if (isBinaryTRF(buffer)) {
    return parseBinaryTRF(buffer);
  } else {
    return parseTextTRF(buffer);
  }
}

function isBinaryTRF(buffer) {
  // Check for JACKREF magic identifier
  const text = buffer.toString('utf-8');
  if (text.includes('JACKREF')) {
    // For binary TRF files, we need to check if there's substantial binary data
    // Look for the presence of null bytes and non-printable characters
    let nullBytes = 0;
    let nonPrintable = 0;
    
    for (let i = 0; i < Math.min(buffer.length, 10000); i++) {
      if (buffer[i] === 0) nullBytes++;
      if (buffer[i] < 32 || buffer[i] > 126) nonPrintable++;
    }
    
    const nullRatio = nullBytes / Math.min(buffer.length, 10000);
    const nonPrintableRatio = nonPrintable / Math.min(buffer.length, 10000);
    
    // If more than 50% of the first 10k bytes are non-printable, it's binary
    return nonPrintableRatio > 0.5;
  }
  return false;
}

function parseBinaryTRF(buffer) {
  const dataPoints = [];
  
  // Find the data section - look for the binary data start
  const dataStart = findBinaryDataStart(buffer);
  
  if (dataStart === -1) {
    throw new Error('Could not locate binary data section in TRF file');
  }
  
  // Parse binary data - each record is 16 bytes (4 floats)
  const dataEnd = buffer.length;
  
  for (let i = dataStart; i < dataEnd - 16; i += 16) {
    try {
      const frequency = buffer.readFloatLE(i);
      const magnitude = buffer.readFloatLE(i + 4);
      const phase = buffer.readFloatLE(i + 8);
      const coherence = buffer.readFloatLE(i + 12);
      
      // Validate the data and apply 22kHz cutoff
      if (frequency >= 0 && frequency <= 22000 && // Apply 22kHz cutoff
          magnitude > -200 && magnitude < 200 && // reasonable magnitude
          phase > -180 && phase < 180) { // reasonable phase
        const point = {
          frequency,
          magnitude,
          phase
        };
        
        // Add coherence if it's valid (between 0 and 1)
        if (coherence >= 0 && coherence <= 1) {
          point.coherence = coherence;
        }
        
        dataPoints.push(point);
      }
    } catch (e) {
      // Skip invalid reads
      break;
    }
  }
  
  return dataPoints;
}

function findBinaryDataStart(buffer) {
  // Look for the end of the header section
  const text = buffer.toString('utf-8');
  const lines = text.split(/\r?\n/);
  
  // Find where the header ends and binary data begins
  let headerEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for patterns that indicate data start
    if (line.match(/^\d+\.?\d*\s+-?\d+\.?\d*\s+-?\d+\.?\d*/)) {
      headerEnd = i;
      break;
    }
  }
  
  if (headerEnd > 0) {
    // Calculate the byte offset for the data start
    let byteOffset = 0;
    for (let i = 0; i < headerEnd; i++) {
      byteOffset += lines[i].length + 1; // +1 for newline
    }
    return byteOffset;
  }
  
  // If we can't find a clear boundary, look for binary data patterns
  // Based on our analysis, the data often starts around offset 435057
  const potentialStarts = [435057, 1000, 2000, 5000, 10000];
  
  for (const start of potentialStarts) {
    if (start < buffer.length - 16) {
      try {
        // Try to read a few float values to see if they make sense
        const f1 = buffer.readFloatLE(start);
        const f2 = buffer.readFloatLE(start + 4);
        const f3 = buffer.readFloatLE(start + 8);
        
        if (f1 >= 0 && f1 <= 22000 && // Apply 22kHz cutoff
            f2 > -200 && f2 < 200 && // reasonable magnitude
            f3 > -180 && f3 < 180) { // reasonable phase
          return start;
        }
      } catch (e) {
        // Skip invalid reads
        continue;
      }
    }
  }
  
  return -1;
}

function parseTextTRF(buffer) {
  const text = buffer.toString('utf-8');
  const lines = text.split(/\r?\n/);
  const points = [];
  
  let dataStarted = false;
  let headerFound = false;
  let hasCoherence = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue;
    
    // Skip title lines (like "TTA DM3 10-9")
    if (line.includes('TTA') || line.includes('DM3')) {
      continue;
    }
    
    // Detect header row with various formats
    if (!headerFound && (
      line.toLowerCase().includes('frequency (hz)') ||
      line.toLowerCase().includes('frequency') ||
      line.toLowerCase().includes('freq')
    )) {
      headerFound = true;
      dataStarted = true;
      hasCoherence = line.toLowerCase().includes('coherence');
      continue;
    }
    
    // Detect data start even without header
    if (!dataStarted && isNumericLine(line)) {
      dataStarted = true;
    }
    
    if (dataStarted) {
      const values = line.split(/\s+/).filter(v => v !== '');
      
      // Handle different column formats
      if (values.length >= 3) {
        const frequency = parseFloat(values[0]);
        const magnitude = parseFloat(values[1]);
        const phase = parseFloat(values[2]);
        
        // Apply 22kHz cutoff and validate data
        if (!isNaN(frequency) && !isNaN(magnitude) && !isNaN(phase) && 
            frequency >= 0 && frequency <= 22000) { // Apply 22kHz cutoff
          const point = { frequency, magnitude, phase };
          
          // Add coherence if present
          if (hasCoherence && values.length >= 4) {
            const coherence = parseFloat(values[3]);
            if (!isNaN(coherence) && coherence >= 0 && coherence <= 1) {
              point.coherence = coherence;
            }
          }
          
          points.push(point);
        }
      }
    }
  }
  
  return points;
}

function isNumericLine(line) {
  const firstCol = line.split(/\s+/)[0];
  return !isNaN(parseFloat(firstCol)) && isFinite(firstCol);
}

export function validateTRFData(points) {
  if (points.length === 0) {
    throw new Error('No valid data points found');
  }
  
  // Check for reasonable frequency range (with 22kHz cutoff)
  const frequencies = points.map(p => p.frequency);
  const minFreq = Math.min(...frequencies);
  const maxFreq = Math.max(...frequencies);
  
  if (minFreq < 0 || maxFreq > 22000) {
    throw new Error('Frequency values out of reasonable range (0-22kHz)');
  }
  
  // Check for reasonable magnitude range
  const magnitudes = points.map(p => p.magnitude);
  const minMag = Math.min(...magnitudes);
  const maxMag = Math.max(...magnitudes);
  
  if (minMag < -200 || maxMag > 200) {
    throw new Error('Magnitude values out of reasonable range (-200 to 200 dB)');
  }
  
  return true;
}

export function analyzeTRFData(points) {
  if (points.length === 0) {
    return null;
  }
  
  const frequencies = points.map(p => p.frequency);
  const magnitudes = points.map(p => p.magnitude);
  const phases = points.map(p => p.phase);
  const coherences = points.filter(p => p.coherence !== undefined).map(p => p.coherence);
  
  return {
    pointCount: points.length,
    frequencyRange: {
      min: Math.min(...frequencies),
      max: Math.max(...frequencies),
      span: Math.max(...frequencies) - Math.min(...frequencies)
    },
    magnitudeRange: {
      min: Math.min(...magnitudes),
      max: Math.max(...magnitudes),
      average: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length
    },
    phaseRange: {
      min: Math.min(...phases),
      max: Math.max(...phases),
      average: phases.reduce((a, b) => a + b, 0) / phases.length
    },
    hasCoherence: coherences.length > 0,
    coherenceStats: coherences.length > 0 ? {
      count: coherences.length,
      average: coherences.reduce((a, b) => a + b, 0) / coherences.length,
      min: Math.min(...coherences),
      max: Math.max(...coherences)
    } : null
  };
}

export function assessDataQuality(points, analysis) {
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

// New function to automatically apply 22kHz cutoff to existing data
export function apply22kHzCutoff(points) {
  if (!Array.isArray(points)) return [];
  
  return points.filter(point => {
    if (!point || typeof point.frequency !== 'number') return false;
    return point.frequency >= 0 && point.frequency <= 22000;
  });
}

// New function to detect optimal sample rate with 22kHz consideration
export function detectOptimalSampleRate(points) {
  if (!Array.isArray(points) || points.length === 0) return 48000;
  
  const maxFreq = Math.max(...points.map(p => p.frequency || 0));
  
  // Since we're cutting at 22kHz, we can use a lower sample rate
  // 44.1kHz is sufficient for 22kHz content (Nyquist theorem)
  // But we'll use 48kHz for better compatibility and headroom
  if (maxFreq <= 22000) {
    return 48000;
  }
  
  // If somehow we have higher frequencies, calculate based on Nyquist
  return Math.ceil(maxFreq * 2 * 1.1);
} 