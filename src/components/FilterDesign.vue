<template>
  <div class="filter-design">
    <h3>Filter Configuration</h3>
    
    <div class="filter-config">
      <!-- Method Selection -->
      <div class="config-group">
        <label for="method">Design Method:</label>
        <select 
          id="method" 
          v-model="localConfig.method"
          @change="updateConfig"
        >
          <option value="least-squares">Least Squares</option>
          <option value="window">Window Method</option>
          <option value="parks-mcclellan">Parks-McClellan</option>
        </select>
      </div>
      
      <!-- Number of Taps -->
      <div class="config-group">
        <label for="numTaps">Number of Taps:</label>
        <input 
          id="numTaps" 
          type="number" 
          v-model.number="localConfig.numTaps"
          @input="updateConfig"
          min="16" 
          max="4096" 
          step="16"
        />
        <small>Power of 2 recommended for efficiency</small>
      </div>
      
      <!-- Sample Rate -->
      <div class="config-group">
        <label for="sampleRate">Sample Rate (Hz):</label>
        <input 
          id="sampleRate" 
          type="number" 
          v-model.number="localConfig.sampleRate"
          @input="updateConfig"
          min="1000" 
          max="1000000"
          step="1000"
        />
      </div>
      
      <!-- Filter Type -->
      <div class="config-group">
        <label for="filterType">Filter Type:</label>
        <select 
          id="filterType" 
          v-model="localConfig.filterType"
          @change="updateConfig"
        >
          <option value="lowpass">Low Pass</option>
          <option value="highpass">High Pass</option>
          <option value="bandpass">Band Pass</option>
          <option value="bandstop">Band Stop</option>
        </select>
      </div>
      
      <!-- Cutoff Frequency -->
      <div class="config-group">
        <label for="cutoffFrequency">Cutoff Frequency (normalized):</label>
        <input 
          id="cutoffFrequency" 
          type="number" 
          v-model.number="localConfig.cutoffFrequency"
          @input="updateConfig"
          min="0.01" 
          max="0.99" 
          step="0.01"
        />
        <small>0.0 to 1.0 (1.0 = Nyquist frequency)</small>
      </div>
      
      <!-- Window Type -->
      <div class="config-group">
        <label for="windowType">Window Type:</label>
        <select 
          id="windowType" 
          v-model="localConfig.windowType"
          @change="updateConfig"
        >
          <option value="hamming">Hamming</option>
          <option value="hanning">Hanning</option>
          <option value="blackman">Blackman</option>
          <option value="rectangular">Rectangular</option>
        </select>
      </div>
      
      <!-- Passband Ripple -->
      <div class="config-group">
        <label for="passbandRipple">Passband Ripple (dB):</label>
        <input 
          id="passbandRipple" 
          type="number" 
          v-model.number="localConfig.passbandRipple"
          @input="updateConfig"
          min="0.01" 
          max="10" 
          step="0.01"
        />
      </div>
      
      <!-- Stopband Attenuation -->
      <div class="config-group">
        <label for="stopbandAttenuation">Stopband Attenuation (dB):</label>
        <input 
          id="stopbandAttenuation" 
          type="number" 
          v-model.number="localConfig.stopbandAttenuation"
          @input="updateConfig"
          min="20" 
          max="200" 
          step="1"
        />
      </div>
    </div>
    
    <!-- Design Button -->
    <div class="design-actions">
      <button 
        @click="designFilter"
        :disabled="!store.canDesignFilter || store.isProcessing"
        class="design-button"
      >
        <span v-if="store.status === 'processing'">⏳ Designing...</span>
        <span v-else>🎛️ Design Filter</span>
      </button>
    </div>
    
    <!-- Status Messages -->
    <div v-if="store.status === 'processing'" class="status loading">
      <p>🔄 Designing FIR filter...</p>
    </div>
    
    <div v-if="store.hasCoefficients" class="status success">
      <p>✅ Filter designed successfully!</p>
      <p><strong>Taps:</strong> {{ store.coefficients.length }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useFilterStore } from '@/stores/filterStore'

const store = useFilterStore()

// Local config that syncs with store
const localConfig = reactive({
  method: store.filterConfig.method,
  numTaps: store.filterConfig.numTaps,
  sampleRate: store.filterConfig.sampleRate,
  filterType: store.filterConfig.filterType,
  cutoffFrequency: store.filterConfig.cutoffFrequency,
  windowType: store.filterConfig.windowType,
  passbandRipple: store.filterConfig.passbandRipple,
  stopbandAttenuation: store.filterConfig.stopbandAttenuation
})

// Sync with store changes
watch(() => store.filterConfig, (newConfig) => {
  Object.assign(localConfig, newConfig)
}, { deep: true })

const updateConfig = () => {
  store.updateFilterConfig({
    method: localConfig.method,
    numTaps: localConfig.numTaps,
    sampleRate: localConfig.sampleRate,
    filterType: localConfig.filterType,
    cutoffFrequency: localConfig.cutoffFrequency,
    windowType: localConfig.windowType,
    passbandRipple: localConfig.passbandRipple,
    stopbandAttenuation: localConfig.stopbandAttenuation
  })
}

const designFilter = async () => {
  try {
    await store.designFilter()
  } catch (err) {
    console.error('Filter design error:', err)
  }
}
</script>

<style scoped>
.filter-design {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-config {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.config-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.config-group label {
  font-size: 0.9em;
  font-weight: 500;
  color: #646cff;
}

.config-group input,
.config-group select {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #444;
  background: #2a2a2a;
  color: white;
  font-size: 0.9em;
}

.config-group input:focus,
.config-group select:focus {
  outline: none;
  border-color: #646cff;
}

.config-group small {
  font-size: 0.8em;
  opacity: 0.7;
  margin-top: 0.25rem;
}

.design-actions {
  margin-top: 1rem;
}

.design-button {
  width: 100%;
  padding: 0.75rem;
  font-size: 1em;
  font-weight: 500;
  background: linear-gradient(135deg, #646cff, #535bf2);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.25s ease;
}

.design-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.3);
}

.design-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style> 