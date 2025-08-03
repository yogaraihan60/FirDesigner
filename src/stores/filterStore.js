import { defineStore } from 'pinia'
import EventHub from '@/utils/eventHub'
import { apply22kHzCutoff, detectOptimalSampleRate } from '@/utils/trfParser'

export const useFilterStore = defineStore('filter', {
  state: () => ({
    trfData: null,
    coefficients: [],
    frequencyResponse: null,
    filterConfig: {
      method: 'least-squares',
      numTaps: 512,
      sampleRate: 48000,
      filterType: 'lowpass',
      cutoffFrequency: 0.1,
      windowType: 'hamming',
      passbandRipple: 0.1,
      stopbandAttenuation: 80,
      // Frequency range configuration
      frequencyRange: {
        enabled: false,
        min: 20,
        max: 22000,
        preset: 'human-hearing' // human-hearing, full-spectrum, custom
      }
    },
    // Display ranges and settings
    displayRanges: {
      magnitude: { min: -20, max: 20 },
      phase: { min: -180, max: 180 },
      frequency: { min: 20, max: 20000 }
    },
    displaySettings: {
      showMagnitude: true,
      showPhase: true,
      logFrequency: true,
      showGrid: true
    },
    status: 'idle', // idle, loading, processing, ready, error
    error: null
  }),
  
  getters: {
    hasTRFData: (state) => state.trfData !== null,
    hasCoefficients: (state) => state.coefficients.length > 0,
    isProcessing: (state) => state.status === 'loading' || state.status === 'processing',
    canDesignFilter: (state) => state.trfData && state.status !== 'loading' && state.status !== 'processing',
    
    // Frequency range getters
    frequencyRangeEnabled: (state) => state.filterConfig.frequencyRange.enabled,
    frequencyRangeMin: (state) => state.filterConfig.frequencyRange.min,
    frequencyRangeMax: (state) => state.filterConfig.frequencyRange.max,
    frequencyRangePreset: (state) => state.filterConfig.frequencyRange.preset,
    
    // Get filtered TRF data based on frequency range
    filteredTRFData: (state) => {
      if (!state.trfData || !state.filterConfig.frequencyRange.enabled) {
        return state.trfData;
      }
      
      const { min, max } = state.filterConfig.frequencyRange;
      return {
        ...state.trfData,
        dataPoints: state.trfData.dataPoints.filter(point => 
          point.frequency >= min && point.frequency <= max
        )
      };
    }
  },
  
  actions: {
    async loadTRFFile() {
      this.status = 'loading'
      this.error = null
      
      try {
        // Check if we're running in Electron
        if (!window.electronAPI) {
          throw new Error('Electron API not available. Please run in Electron environment.')
        }
        
        const trfData = await window.electronAPI.openTRFFile()
        if (trfData) {
          // Ensure the data is properly structured and apply 22kHz cutoff
          this.trfData = this.normalizeTRFData(trfData)
          
          // Auto-configure frequency range based on loaded data
          this.autoConfigureFrequencyRange(this.trfData)
          
          this.status = 'ready'
          EventHub.emit('trf-loaded', this.trfData)
          return this.trfData
        } else {
          this.status = 'idle'
          return null
        }
      } catch (err) {
        this.status = 'error'
        this.error = err.message
        EventHub.emit('error', 'TRF_LOAD_FAILED', err)
        throw err
      }
    },

    // Normalize TRF data to ensure proper structure with 22kHz cutoff
    normalizeTRFData(trfData) {
      if (!trfData) return null;
      
      // Apply 22kHz cutoff to data points
      const filteredDataPoints = apply22kHzCutoff(trfData.dataPoints || []);
      
      // Detect optimal sample rate
      const optimalSampleRate = detectOptimalSampleRate(filteredDataPoints);
      
      return {
        fileName: String(trfData.fileName || ''),
        filePath: String(trfData.filePath || ''),
        dataPoints: filteredDataPoints.map(point => {
          // Handle null/undefined points
          if (!point) return null;
          
          return {
            frequency: Number(point.frequency) || 0,
            magnitude: Number(point.magnitude) || 0,
            phase: Number(point.phase) || 0,
            ...(point.coherence !== undefined && { coherence: Number(point.coherence) || 0 })
          };
        }).filter(point => point !== null), // Remove null points
        sampleRate: optimalSampleRate,
        pointCount: filteredDataPoints.length,
        frequencyRange: {
          min: Math.min(...filteredDataPoints.map(p => p.frequency || 0)),
          max: Math.max(...filteredDataPoints.map(p => p.frequency || 0))
        },
        // Preserve additional properties if they exist
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
    },
    
    autoConfigureFrequencyRange(trfData) {
      if (!trfData || !trfData.dataPoints || trfData.dataPoints.length === 0) {
        return;
      }
      
      const frequencies = trfData.dataPoints.map(p => p.frequency);
      const minFreq = Math.min(...frequencies);
      const maxFreq = Math.max(...frequencies);
      
      // Since we're cutting at 22kHz, always use human hearing range
      this.updateFrequencyRange({
        enabled: true,
        min: 20,
        max: 22000,
        preset: 'human-hearing'
      });
    },
    
    updateFrequencyRange(rangeConfig) {
      this.filterConfig.frequencyRange = {
        ...this.filterConfig.frequencyRange,
        ...rangeConfig
      };
      EventHub.emit('frequency-range-updated', this.filterConfig.frequencyRange);
    },
    
    setFrequencyRangePreset(preset) {
      const presets = {
        'human-hearing': { min: 20, max: 22000 },
        'full-spectrum': { min: 0, max: 22000 }, // Updated to respect 22kHz limit
        'speech': { min: 300, max: 3400 },
        'music': { min: 20, max: 20000 },
        'sub-bass': { min: 20, max: 60 },
        'bass': { min: 60, max: 250 },
        'low-mid': { min: 250, max: 500 },
        'mid': { min: 500, max: 2000 },
        'high-mid': { min: 2000, max: 4000 },
        'presence': { min: 4000, max: 6000 },
        'brilliance': { min: 6000, max: 20000 }
      };
      
      if (presets[preset]) {
        this.updateFrequencyRange({
          enabled: true,
          ...presets[preset],
          preset
        });
      }
    },
    
    async designFilter() {
      if (!this.trfData) {
        throw new Error('No TRF data loaded')
      }
      
      this.status = 'processing'
      this.error = null
      
      try {
        // Check if we're running in Electron
        if (!window.electronAPI) {
          throw new Error('Electron API not available. Please run in Electron environment.')
        }
        
        // Use filtered data if frequency range is enabled
        const dataToUse = this.filteredTRFData;
        
        // Ensure data is serializable for IPC
        const serializableDataPoints = dataToUse.dataPoints.map(point => ({
          frequency: Number(point.frequency) || 0,
          magnitude: Number(point.magnitude) || 0,
          phase: Number(point.phase) || 0,
          ...(point.coherence !== undefined && { coherence: Number(point.coherence) || 0 })
        }))
        
        const serializableConfig = {
          method: String(this.filterConfig.method || ''),
          numTaps: Number(this.filterConfig.numTaps) || 512,
          sampleRate: Number(this.filterConfig.sampleRate) || 48000,
          filterType: String(this.filterConfig.filterType || ''),
          cutoffFrequency: Number(this.filterConfig.cutoffFrequency) || 0.1,
          windowType: String(this.filterConfig.windowType || ''),
          passbandRipple: Number(this.filterConfig.passbandRipple) || 0.1,
          stopbandAttenuation: Number(this.filterConfig.stopbandAttenuation) || 80,
          frequencyRange: {
            enabled: Boolean(this.filterConfig.frequencyRange.enabled),
            min: Number(this.filterConfig.frequencyRange.min) || 20,
            max: Number(this.filterConfig.frequencyRange.max) || 22000,
            preset: String(this.filterConfig.frequencyRange.preset || 'human-hearing')
          }
        }
        
        const result = await window.electronAPI.designFIRFilter(
          serializableDataPoints,
          serializableConfig
        )
        
        // Ensure coefficients are serializable
        this.coefficients = Array.isArray(result.coefficients) ? result.coefficients.map(c => {
          const value = Number(c);
          return isFinite(value) ? value : 0;
        }) : [];
        
        // Ensure frequency response is serializable
        this.frequencyResponse = Array.isArray(result.frequencyResponse) ? result.frequencyResponse.map(point => ({
          frequency: Number(point.frequency) || 0,
          magnitude: Number(point.magnitude) || 0,
          phase: Number(point.phase) || 0
        })) : [];
        
        this.status = 'ready'
        EventHub.emit('filter-designed', result)
        return result
      } catch (err) {
        this.status = 'error'
        this.error = err.message
        EventHub.emit('error', 'FILTER_DESIGN_FAILED', err)
        throw err
      }
    },
    
    updateFilterConfig(config) {
      this.filterConfig = { ...this.filterConfig, ...config }
      EventHub.emit('config-updated', this.filterConfig)
    },
    
    updateDisplayRanges(ranges) {
      this.displayRanges = { ...this.displayRanges, ...ranges }
      EventHub.emit('display-ranges-updated', this.displayRanges)
    },
    
    updateDisplaySettings(settings) {
      this.displaySettings = { ...this.displaySettings, ...settings }
      EventHub.emit('display-settings-updated', this.displaySettings)
    },
    
    updateTRFDataPoint(index, updatedPoint) {
      if (!this.trfData?.dataPoints || index < 0 || index >= this.trfData.dataPoints.length) {
        return
      }
      
      // Update the data point
      this.trfData.dataPoints[index] = {
        ...this.trfData.dataPoints[index],
        ...updatedPoint
      }
      
      // Recalculate frequency range if needed
      if (updatedPoint.frequency !== undefined) {
        const frequencies = this.trfData.dataPoints.map(p => p.frequency)
        this.trfData.frequencyRange = {
          min: Math.min(...frequencies),
          max: Math.max(...frequencies)
        }
      }
      
      // Emit update event
      EventHub.emit('trf-data-updated', this.trfData)
    },
    
    resetState() {
      this.trfData = null
      this.coefficients = []
      this.frequencyResponse = null
      this.status = 'idle'
      this.error = null
      EventHub.emit('state-reset')
    },
    
    setError(error) {
      this.status = 'error'
      this.error = error
    },
    
    clearError() {
      this.error = null
      if (this.status === 'error') {
        this.status = 'idle'
      }
    }
  }
}) 