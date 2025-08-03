# FIR Designer Visualization Research Documentation

## Overview

This document provides a comprehensive analysis of the visualization logic used in the FIR Designer application, with MATLAB research examples for understanding the underlying algorithms and techniques.

## Core Visualization Concepts

### 1. 22kHz Automatic Cutoff Logic

**Purpose**: Automatically filter TRF data to human hearing range (20Hz - 22kHz)

**Implementation**:
```javascript
// JavaScript (from trfParser.js)
export function apply22kHzCutoff(points) {
  if (!Array.isArray(points)) return [];
  
  return points.filter(point => {
    if (!point || typeof point.frequency !== 'number') return false;
    return point.frequency >= 0 && point.frequency <= 22000;
  });
}
```

**MATLAB Equivalent**:
```matlab
% MATLAB equivalent
function filtered_points = apply22kHzCutoff(points)
    cutoff_mask = points.frequency >= 0 & points.frequency <= 22000;
    filtered_points = points(cutoff_mask, :);
end
```

**Research Benefits**:
- Ensures data is within human hearing range
- Optimizes sample rate requirements (48kHz sufficient for 22kHz content)
- Reduces computational complexity for FIR filter design

### 2. Logarithmic Frequency Scaling

**Purpose**: Display frequency data on a logarithmic scale for better visualization of audio frequency relationships

**Implementation**:
```javascript
// JavaScript (from EnhancedVisualization.vue)
const x = (Math.log10(point.frequency) - Math.log10(20)) / 
          (Math.log10(20000) - Math.log10(20)) * (width - 80) + 40
```

**MATLAB Equivalent**:
```matlab
% MATLAB logarithmic scaling
freq_min = 20;  % Hz
freq_max = 20000;  % Hz
log_freq_min = log10(freq_min);
log_freq_max = log10(freq_max);

% Transform frequency to x-coordinate
x_coords = (log10(freq_data) - log_freq_min) / (log_freq_max - log_freq_min) * plot_width + margin_left;
```

**Research Benefits**:
- Matches human auditory perception (logarithmic frequency response)
- Provides equal visual weight to octave relationships
- Standard in audio engineering and acoustics

### 3. Coordinate Transformation Logic

**Purpose**: Convert data coordinates to screen coordinates for canvas rendering

**Implementation**:
```javascript
// JavaScript coordinate transformation
const x = (Math.log10(point.frequency) - Math.log10(20)) / 
          (Math.log10(20000) - Math.log10(20)) * (width - 80) + 40
const y = ((magnitudeRange.max - point.magnitude) / 
           (magnitudeRange.max - magnitudeRange.min)) * (height - 60) + 20
```

**MATLAB Research Example**:
```matlab
% Canvas dimensions
canvas_width = 800;
canvas_height = 400;
margin_left = 40;
margin_right = 40;
margin_top = 20;
margin_bottom = 40;

% Plot area dimensions
plot_width = canvas_width - margin_left - margin_right;
plot_height = canvas_height - margin_top - margin_bottom;

% Transform frequency to x-coordinate (logarithmic)
x_coords = (log10(freq_data) - log_freq_min) / (log_freq_max - log_freq_min) * plot_width + margin_left;

% Transform magnitude to y-coordinate (linear, inverted)
y_mag_coords = ((mag_max - mag_data) / (mag_max - mag_min)) * plot_height + margin_top;
```

### 4. Interactive Point Selection

**Purpose**: Allow users to select and edit data points interactively

**Implementation**:
```javascript
// JavaScript point selection logic
const startEdit = (event) => {
  const rect = chartCanvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  // Find closest point
  const points = visibleDataPoints.value
  let closestIndex = -1
  let closestDistance = Infinity
  
  points.forEach((point, index) => {
    const pointX = (Math.log10(point.frequency) - Math.log10(20)) / 
                   (Math.log10(20000) - Math.log10(20)) * (chartCanvas.value.width - 80) + 40
    const pointY = ((magnitudeRange.max - point.magnitude) / 
                    (magnitudeRange.max - magnitudeRange.min)) * (chartCanvas.value.height - 60) + 20
    
    const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2)
    if (distance < closestDistance && distance < 20) {
      closestDistance = distance
      closestIndex = index
    }
  })
}
```

**MATLAB Research Example**:
```matlab
% Interactive point selection
function idx = findClosestPoint(click_freq, click_mag, freq_data, mag_data)
    % Calculate distances in normalized coordinates
    distances = sqrt(((freq_data - click_freq) / (max(freq_data) - min(freq_data))).^2 + ...
                     ((mag_data - click_mag) / (max(mag_data) - min(mag_data))).^2);
    [~, idx] = min(distances);
end

% Mouse event handler
function mouseDown(src, ~)
    pt = get(ax, 'CurrentPoint');
    click_freq = pt(1, 1);
    click_mag = pt(1, 2);
    
    idx = findClosestPoint(click_freq, click_mag, freq, mag);
    
    % Check if click is close enough
    distance = sqrt(((freq(idx) - click_freq) / (freq_max - freq_min)).^2 + ...
                    ((mag(idx) - click_mag) / (mag_max - mag_min)).^2);
    
    if distance < 0.05 % Threshold for selection
        selected_idx = idx;
        updatePlot();
    end
end
```

### 5. Sample Rate Optimization

**Purpose**: Automatically determine optimal sample rate based on frequency content

**Implementation**:
```javascript
// JavaScript sample rate detection
export function detectOptimalSampleRate(points) {
  if (!Array.isArray(points) || points.length === 0) return 48000;
  
  const maxFreq = Math.max(...points.map(p => p.frequency || 0));
  
  // Since we're cutting at 22kHz, we can use a lower sample rate
  if (maxFreq <= 22000) {
    return 48000;
  }
  
  // If somehow we have higher frequencies, calculate based on Nyquist
  return Math.ceil(maxFreq * 2 * 1.1);
}
```

**MATLAB Research Example**:
```matlab
% Sample rate optimization
function sample_rate = detectOptimalSampleRate(freq_data)
    max_freq = max(freq_data);
    
    if max_freq <= 22000
        sample_rate = 48000;  % Standard for 22kHz content
    else
        sample_rate = ceil(max_freq * 2 * 1.1);  % Nyquist * safety margin
    end
end
```

### 6. Data Quality Assessment

**Purpose**: Analyze data quality and provide warnings for potential issues

**Implementation**:
```javascript
// JavaScript quality assessment
export function assessDataQuality(points, analysis) {
  const assessment = {
    overall: 'good',
    issues: [],
    warnings: [],
    recommendations: []
  };
  
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
  
  return assessment;
}
```

**MATLAB Research Example**:
```matlab
% Data quality assessment
function assessment = assessDataQuality(freq_data, mag_data)
    % Frequency band analysis
    low_freq_count = sum(freq_data >= 20 & freq_data < 200);
    mid_freq_count = sum(freq_data >= 200 & freq_data < 2000);
    high_freq_count = sum(freq_data >= 2000 & freq_data < 20000);
    
    total_points = length(freq_data);
    low_freq_ratio = low_freq_count / total_points;
    high_freq_ratio = high_freq_count / total_points;
    
    % Quality warnings
    warnings = {};
    if low_freq_ratio < 0.1
        warnings{end+1} = 'Limited low frequency data (< 200 Hz)';
    end
    if high_freq_ratio < 0.1
        warnings{end+1} = 'Limited high frequency data (2k-20k Hz)';
    end
    
    assessment.warnings = warnings;
    assessment.overall = length(warnings) <= 1 ? 'good' : 'fair';
end
```

## Research Applications

### 1. Audio Engineering Research

The visualization logic can be applied to:
- **Frequency Response Analysis**: Study speaker and microphone characteristics
- **Room Acoustics**: Analyze room frequency response and modal behavior
- **Audio Filter Design**: Visualize filter responses and design custom filters
- **Audio Quality Assessment**: Evaluate audio system performance

### 2. Signal Processing Research

Key research areas:
- **FIR Filter Design**: Interactive filter coefficient optimization
- **Digital Signal Processing**: Real-time frequency domain analysis
- **Audio Compression**: Analyze frequency content for compression algorithms
- **Noise Reduction**: Study noise characteristics and filter design

### 3. Human Auditory Research

Applications include:
- **Psychoacoustics**: Study human frequency perception
- **Hearing Aid Design**: Optimize frequency response for hearing loss
- **Audio Perception**: Analyze how humans perceive different frequency ranges
- **Auditory Fatigue**: Study effects of frequency exposure

## MATLAB Research Examples

### Example 1: Basic Visualization
```matlab
% Run the basic visualization example
visualization_research_examples
```

### Example 2: Interactive Editing
```matlab
% Run the interactive visualization example
interactive_visualization_example
```

### Example 3: Custom Analysis
```matlab
% Create custom frequency response analysis
freq = logspace(1, 4, 100);  % 10Hz to 10kHz, 100 points
mag = -20*log10(1 + (freq/1000).^2);  % Low-pass filter response
phase = -atan2(freq/1000, 1) * 180/pi;

% Apply 22kHz cutoff
cutoff_mask = freq <= 22000;
freq = freq(cutoff_mask);
mag = mag(cutoff_mask);
phase = phase(cutoff_mask);

% Create visualization
figure('Color', 'black');
subplot(2,1,1);
semilogx(freq, mag, 'Color', '#ff6b6b', 'LineWidth', 2);
grid on; ylabel('Magnitude (dB)'); title('Custom Filter Response');
subplot(2,1,2);
semilogx(freq, phase, 'Color', '#4ecdc4', 'LineWidth', 2);
grid on; xlabel('Frequency (Hz)'); ylabel('Phase (deg)');
```

## Key Research Insights

### 1. Logarithmic Scaling Importance
- **Human Perception**: Matches human auditory frequency perception
- **Audio Engineering**: Standard practice in audio analysis
- **Visual Clarity**: Provides equal visual weight to octave relationships

### 2. 22kHz Cutoff Benefits
- **Computational Efficiency**: Reduces processing requirements
- **Human Hearing**: Focuses on audible frequency range
- **Sample Rate Optimization**: Enables 48kHz sample rate for most applications

### 3. Interactive Editing Value
- **Real-time Feedback**: Immediate visual feedback for changes
- **User Experience**: Intuitive point-and-click editing
- **Research Applications**: Enables rapid parameter exploration

### 4. Quality Assessment Automation
- **Data Validation**: Automatic detection of potential issues
- **Research Efficiency**: Reduces manual data inspection time
- **Standardization**: Consistent quality metrics across studies

## Conclusion

The FIR Designer visualization logic provides a robust foundation for audio frequency analysis and filter design research. The combination of automatic data processing, interactive editing, and quality assessment makes it suitable for various research applications in audio engineering, signal processing, and human auditory studies.

The MATLAB examples provided demonstrate the core algorithms and can be extended for specific research needs. The modular design allows researchers to adapt individual components for their particular applications while maintaining the proven visualization principles. 