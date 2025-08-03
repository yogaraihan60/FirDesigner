<template>
  <div class="range-editor">
    <h3>📊 Display Range Settings</h3>
    
    <div class="range-sections">
      <!-- Magnitude Range Settings -->
      <div class="range-section">
        <h4>🎚️ Magnitude Range (Level dB)</h4>
        <div class="range-controls">
          <div class="range-input">
            <label for="magMin">Min Level (dB):</label>
            <div class="input-with-arrows">
              <input 
                id="magMin" 
                type="number" 
                v-model.number="localRanges.magnitude.min"
                @input="updateRanges"
                step="1"
                min="-100"
                max="50"
              />
              <div class="arrow-controls">
                <button @click="adjustRange('magnitude', 'min', 1)" class="arrow-btn">▲</button>
                <button @click="adjustRange('magnitude', 'min', -1)" class="arrow-btn">▼</button>
              </div>
            </div>
          </div>
          
          <div class="range-input">
            <label for="magMax">Max Level (dB):</label>
            <div class="input-with-arrows">
              <input 
                id="magMax" 
                type="number" 
                v-model.number="localRanges.magnitude.max"
                @input="updateRanges"
                step="1"
                min="-50"
                max="100"
              />
              <div class="arrow-controls">
                <button @click="adjustRange('magnitude', 'max', 1)" class="arrow-btn">▲</button>
                <button @click="adjustRange('magnitude', 'max', -1)" class="arrow-btn">▼</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="range-presets">
          <button @click="setMagnitudePreset('standard')" class="preset-btn">Standard (-20 to 20 dB)</button>
          <button @click="setMagnitudePreset('wide')" class="preset-btn">Wide (-30 to 10 dB)</button>
          <button @click="setMagnitudePreset('narrow')" class="preset-btn">Narrow (-10 to 10 dB)</button>
          <button @click="setMagnitudePreset('auto')" class="preset-btn">Auto Range</button>
        </div>
      </div>
      
      <!-- Phase Range Settings -->
      <div class="range-section">
        <h4>🔄 Phase Range (Degrees)</h4>
        <div class="range-controls">
          <div class="range-input">
            <label for="phaseMin">Min Phase (deg):</label>
            <div class="input-with-arrows">
              <input 
                id="phaseMin" 
                type="number" 
                v-model.number="localRanges.phase.min"
                @input="updateRanges"
                step="5"
                min="-360"
                max="0"
              />
              <div class="arrow-controls">
                <button @click="adjustRange('phase', 'min', 5)" class="arrow-btn">▲</button>
                <button @click="adjustRange('phase', 'min', -5)" class="arrow-btn">▼</button>
              </div>
            </div>
          </div>
          
          <div class="range-input">
            <label for="phaseMax">Max Phase (deg):</label>
            <div class="input-with-arrows">
              <input 
                id="phaseMax" 
                type="number" 
                v-model.number="localRanges.phase.max"
                @input="updateRanges"
                step="5"
                min="0"
                max="360"
              />
              <div class="arrow-controls">
                <button @click="adjustRange('phase', 'max', 5)" class="arrow-btn">▲</button>
                <button @click="adjustRange('phase', 'max', -5)" class="arrow-btn">▼</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="range-presets">
          <button @click="setPhasePreset('standard')" class="preset-btn">Standard (-180 to 180°)</button>
          <button @click="setPhasePreset('narrow')" class="preset-btn">Narrow (-90 to 90°)</button>
          <button @click="setPhasePreset('wide')" class="preset-btn">Wide (-360 to 360°)</button>
          <button @click="setPhasePreset('auto')" class="preset-btn">Auto Range</button>
        </div>
      </div>
      
      <!-- Frequency Range Settings -->
      <div class="range-section">
        <h4>🎵 Frequency Range (Hz)</h4>
        <div class="range-controls">
          <div class="range-input">
            <label for="freqMin">Min Frequency (Hz):</label>
            <div class="input-with-arrows">
              <input 
                id="freqMin" 
                type="number" 
                v-model.number="localRanges.frequency.min"
                @input="updateRanges"
                step="1"
                min="1"
                max="100000"
              />
              <div class="arrow-controls">
                <button @click="adjustRange('frequency', 'min', 10)" class="arrow-btn">▲</button>
                <button @click="adjustRange('frequency', 'min', -10)" class="arrow-btn">▼</button>
              </div>
            </div>
          </div>
          
          <div class="range-input">
            <label for="freqMax">Max Frequency (Hz):</label>
            <div class="input-with-arrows">
              <input 
                id="freqMax" 
                type="number" 
                v-model.number="localRanges.frequency.max"
                @input="updateRanges"
                step="100"
                min="100"
                max="1000000"
              />
              <div class="arrow-controls">
                <button @click="adjustRange('frequency', 'max', 1000)" class="arrow-btn">▲</button>
                <button @click="adjustRange('frequency', 'max', -1000)" class="arrow-btn">▼</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="range-presets">
          <button @click="setFrequencyPreset('audio')" class="preset-btn">Audio (20 to 20k Hz)</button>
          <button @click="setFrequencyPreset('speech')" class="preset-btn">Speech (300 to 3.4k Hz)</button>
          <button @click="setFrequencyPreset('bass')" class="preset-btn">Bass (20 to 200 Hz)</button>
          <button @click="setFrequencyPreset('auto')" class="preset-btn">Auto Range</button>
        </div>
      </div>
    </div>
    
    <!-- Global Controls -->
    <div class="global-controls">
      <h4>⚙️ Global Display Settings</h4>
      <div class="control-grid">
        <div class="control-item">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="localSettings.showMagnitude"
              @change="updateSettings"
            />
            Show Magnitude Response
          </label>
        </div>
        
        <div class="control-item">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="localSettings.showPhase"
              @change="updateSettings"
            />
            Show Phase Response
          </label>
        </div>
        
        <div class="control-item">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="localSettings.logFrequency"
              @change="updateSettings"
            />
            Logarithmic Frequency Scale
          </label>
        </div>
        
        <div class="control-item">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="localSettings.showGrid"
              @change="updateSettings"
            />
            Show Grid Lines
          </label>
        </div>
      </div>
      
      <div class="action-buttons">
        <button @click="resetToDefaults" class="reset-btn">🔄 Reset to Defaults</button>
        <button @click="autoRangeAll" class="auto-btn">🎯 Auto Range All</button>
      </div>
    </div>
    
    <!-- Range Info -->
    <div class="range-info" v-if="store.hasTRFData">
      <h4>📈 Current Data Ranges</h4>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Magnitude:</span>
          <span class="info-value">{{ dataRanges.magnitude.min.toFixed(1) }} to {{ dataRanges.magnitude.max.toFixed(1) }} dB</span>
        </div>
        <div class="info-item">
          <span class="info-label">Phase:</span>
          <span class="info-value">{{ dataRanges.phase.min.toFixed(1) }} to {{ dataRanges.phase.max.toFixed(1) }}°</span>
        </div>
        <div class="info-item">
          <span class="info-label">Frequency:</span>
          <span class="info-value">{{ dataRanges.frequency.min.toFixed(1) }} to {{ dataRanges.frequency.max.toFixed(1) }} Hz</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useFilterStore } from '@/stores/filterStore'

const store = useFilterStore()

// Local state for ranges
const localRanges = reactive({
  magnitude: { min: -20, max: 20 },
  phase: { min: -180, max: 180 },
  frequency: { min: 20, max: 20000 }
})

// Local state for settings
const localSettings = reactive({
  showMagnitude: true,
  showPhase: true,
  logFrequency: true,
  showGrid: true
})

// Computed data ranges from TRF data
const dataRanges = computed(() => {
  if (!store.trfData || !store.trfData.dataPoints) {
    return {
      magnitude: { min: -20, max: 20 },
      phase: { min: -180, max: 180 },
      frequency: { min: 20, max: 20000 }
    }
  }
  
  const points = store.trfData.dataPoints
  const magnitudes = points.map(p => p.magnitude)
  const phases = points.map(p => p.phase)
  const frequencies = points.map(p => p.frequency)
  
  return {
    magnitude: {
      min: Math.min(...magnitudes),
      max: Math.max(...magnitudes)
    },
    phase: {
      min: Math.min(...phases),
      max: Math.max(...phases)
    },
    frequency: {
      min: Math.min(...frequencies),
      max: Math.max(...frequencies)
    }
  }
})

// Initialize from store
watch(() => store.displayRanges, (newRanges) => {
  if (newRanges) {
    Object.assign(localRanges, newRanges)
  }
}, { immediate: true, deep: true })

watch(() => store.displaySettings, (newSettings) => {
  if (newSettings) {
    Object.assign(localSettings, newSettings)
  }
}, { immediate: true, deep: true })

const updateRanges = () => {
  store.updateDisplayRanges({
    magnitude: { ...localRanges.magnitude },
    phase: { ...localRanges.phase },
    frequency: { ...localRanges.frequency }
  })
}

const updateSettings = () => {
  store.updateDisplaySettings({
    showMagnitude: localSettings.showMagnitude,
    showPhase: localSettings.showPhase,
    logFrequency: localSettings.logFrequency,
    showGrid: localSettings.showGrid
  })
}

const adjustRange = (type, bound, delta) => {
  localRanges[type][bound] += delta
  updateRanges()
}

const setMagnitudePreset = (preset) => {
  const presets = {
    standard: { min: -20, max: 20 },
    wide: { min: -30, max: 10 },
    narrow: { min: -10, max: 10 },
    auto: dataRanges.value.magnitude
  }
  
  Object.assign(localRanges.magnitude, presets[preset])
  updateRanges()
}

const setPhasePreset = (preset) => {
  const presets = {
    standard: { min: -180, max: 180 },
    narrow: { min: -90, max: 90 },
    wide: { min: -360, max: 360 },
    auto: dataRanges.value.phase
  }
  
  Object.assign(localRanges.phase, presets[preset])
  updateRanges()
}

const setFrequencyPreset = (preset) => {
  const presets = {
    audio: { min: 20, max: 20000 },
    speech: { min: 300, max: 3400 },
    bass: { min: 20, max: 200 },
    auto: dataRanges.value.frequency
  }
  
  Object.assign(localRanges.frequency, presets[preset])
  updateRanges()
}

const resetToDefaults = () => {
  Object.assign(localRanges, {
    magnitude: { min: -20, max: 20 },
    phase: { min: -180, max: 180 },
    frequency: { min: 20, max: 20000 }
  })
  
  Object.assign(localSettings, {
    showMagnitude: true,
    showPhase: true,
    logFrequency: true,
    showGrid: true
  })
  
  updateRanges()
  updateSettings()
}

const autoRangeAll = () => {
  setMagnitudePreset('auto')
  setPhasePreset('auto')
  setFrequencyPreset('auto')
}
</script>

<style scoped>
.range-editor {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 8px;
  border: 1px solid #444;
}

.range-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.range-section {
  background: rgba(100, 108, 255, 0.05);
  border: 1px solid #444;
  border-radius: 6px;
  padding: 1rem;
}

.range-section h4 {
  margin: 0 0 1rem 0;
  color: #646cff;
  font-size: 1em;
}

.range-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.range-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.range-input label {
  font-size: 0.85em;
  color: #888;
  font-weight: 500;
}

.input-with-arrows {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-with-arrows input {
  flex: 1;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #444;
  background: #1a1a1a;
  color: white;
  font-size: 0.9em;
}

.input-with-arrows input:focus {
  outline: none;
  border-color: #646cff;
}

.arrow-controls {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.arrow-btn {
  width: 24px;
  height: 20px;
  border: 1px solid #444;
  background: #1a1a1a;
  color: #ccc;
  cursor: pointer;
  font-size: 0.7em;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
}

.arrow-btn:hover {
  background: #646cff;
  color: white;
}

.range-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.preset-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #444;
  background: #1a1a1a;
  color: #ccc;
  border-radius: 4px;
  font-size: 0.8em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  background: #646cff;
  color: white;
  border-color: #646cff;
}

.global-controls {
  background: rgba(100, 108, 255, 0.05);
  border: 1px solid #444;
  border-radius: 6px;
  padding: 1rem;
}

.global-controls h4 {
  margin: 0 0 1rem 0;
  color: #646cff;
  font-size: 1em;
}

.control-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.control-item {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9em;
  color: #ccc;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.reset-btn,
.auto-btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn {
  background: #6c757d;
  color: white;
}

.reset-btn:hover {
  background: #5a6268;
}

.auto-btn {
  background: #28a745;
  color: white;
}

.auto-btn:hover {
  background: #218838;
}

.range-info {
  background: rgba(100, 108, 255, 0.1);
  border: 1px solid #646cff;
  border-radius: 6px;
  padding: 1rem;
}

.range-info h4 {
  margin: 0 0 1rem 0;
  color: #646cff;
  font-size: 1em;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 0.85em;
  color: #888;
}

.info-value {
  font-size: 0.85em;
  font-weight: 500;
  color: #646cff;
}
</style> 