export function parseTRF(buffer) {
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
        
        if (!isNaN(frequency) && !isNaN(magnitude) && !isNaN(phase)) {
          const point = { frequency, magnitude, phase };
          
          // Add coherence if present
          if (hasCoherence && values.length >= 4) {
            const coherence = parseFloat(values[3]);
            if (!isNaN(coherence)) {
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
  
  // Check for reasonable frequency range
  const frequencies = points.map(p => p.frequency);
  const minFreq = Math.min(...frequencies);
  const maxFreq = Math.max(...frequencies);
  
  if (minFreq < 0 || maxFreq > 1e9) {
    throw new Error('Frequency values out of reasonable range');
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