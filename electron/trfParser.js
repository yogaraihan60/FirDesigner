function parseTRF(buffer) {
  const text = buffer.toString('utf-8');
  const lines = text.split(/\r?\n/);
  const points = [];
  
  let dataStarted = false;
  let headerFound = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue;
    
    // Detect header row
    if (!headerFound && line.toLowerCase().includes('frequency (hz)')) {
      headerFound = true;
      dataStarted = true;
      continue;
    }
    
    // Detect data start even without header
    if (!dataStarted && isNumericLine(line)) {
      dataStarted = true;
    }
    
    if (dataStarted) {
      const values = line.split(/\s+/).filter(v => v !== '');
      
      if (values.length >= 3) {
        const frequency = parseFloat(values[0]);
        const magnitude = parseFloat(values[1]);
        const phase = parseFloat(values[2]);
        
        if (!isNaN(frequency) && !isNaN(magnitude) && !isNaN(phase)) {
          points.push({ frequency, magnitude, phase });
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

function validateTRFData(points) {
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

module.exports = { parseTRF, validateTRFData }; 