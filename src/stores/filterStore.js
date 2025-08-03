import { defineStore } from 'pinia'
import EventHub from '@/utils/eventHub'

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
      stopbandAttenuation: 80
    },
    status: 'idle', // idle, loading, processing, ready, error
    error: null
  }),
  
  getters: {
    hasTRFData: (state) => state.trfData !== null,
    hasCoefficients: (state) => state.coefficients.length > 0,
    isProcessing: (state) => state.status === 'loading' || state.status === 'processing',
    canDesignFilter: (state) => state.trfData && state.status !== 'loading' && state.status !== 'processing'
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
          this.trfData = trfData
          this.status = 'ready'
          EventHub.emit('trf-loaded', trfData)
          return trfData
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
        
        // Ensure data is serializable for IPC
        const serializableDataPoints = this.trfData.dataPoints.map(point => ({
          frequency: point.frequency,
          magnitude: point.magnitude,
          phase: point.phase,
          ...(point.coherence !== undefined && { coherence: point.coherence })
        }))
        
        const serializableConfig = {
          method: this.filterConfig.method,
          numTaps: this.filterConfig.numTaps,
          sampleRate: this.filterConfig.sampleRate,
          filterType: this.filterConfig.filterType,
          cutoffFrequency: this.filterConfig.cutoffFrequency,
          windowType: this.filterConfig.windowType,
          passbandRipple: this.filterConfig.passbandRipple,
          stopbandAttenuation: this.filterConfig.stopbandAttenuation
        }
        
        const result = await window.electronAPI.designFIRFilter(
          serializableDataPoints,
          serializableConfig
        )
        
        // Ensure coefficients are serializable
        this.coefficients = result.coefficients.map(c => {
          const value = Number(c)
          return isFinite(value) ? value : 0
        })
        
        // Ensure frequency response is serializable
        this.frequencyResponse = result.frequencyResponse.map(point => ({
          frequency: Number(point.frequency),
          magnitude: Number(point.magnitude),
          phase: Number(point.phase)
        }))
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