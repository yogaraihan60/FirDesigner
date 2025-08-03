<template>
  <div class="file-importer">
    <h3>Import TRF File</h3>
    
    <div 
      class="drop-zone" 
      :class="{ dragover: isDragOver }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop="handleDrop"
      @click="openFileDialog"
    >
      <div class="drop-content">
        <p>📁 Drag & Drop TRF file here</p>
        <p>or</p>
        <button @click.stop="openFileDialog">Browse Files</button>
      </div>
    </div>
    
    <!-- Paste Section -->
    <div class="paste-section">
      <h4>📋 Paste TRF Data</h4>
      <div class="paste-controls">
        <button @click="showPasteDialog = true" class="paste-button">
          📋 Paste from Clipboard
        </button>
        <button @click="clearPastedData" class="clear-button" v-if="pastedData">
          🗑️ Clear Pasted Data
        </button>
      </div>
      
      <!-- Paste Dialog -->
      <div v-if="showPasteDialog" class="paste-dialog">
        <div class="paste-dialog-content">
          <h5>Paste TRF Data</h5>
          <p class="paste-instructions">
            Paste your TRF data below. The data should contain frequency, magnitude, and phase columns.
          </p>
          <textarea 
            v-model="pastedText"
            placeholder="Paste your TRF data here..."
            class="paste-textarea"
            rows="10"
          ></textarea>
          <div class="paste-actions">
            <button @click="processPastedData" class="process-button" :disabled="!pastedText.trim()">
              ✅ Process Data
            </button>
            <button @click="showPasteDialog = false" class="cancel-button">
              ❌ Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Status Messages -->
    <div v-if="store.status === 'loading'" class="status loading">
      <p>⏳ Loading file...</p>
    </div>
    
    <div v-if="store.error" class="status error">
      <p>❌ {{ store.error }}</p>
      <button @click="store.clearError()">Dismiss</button>
    </div>
    
    <!-- File Information -->
    <div v-if="trfMeta" class="file-info">
      <h4>📄 {{ trfMeta.fileName }}</h4>
      <div class="file-details">
        <p><strong>Points:</strong> {{ trfMeta.pointCount.toLocaleString() }}</p>
        <p><strong>Sample Rate:</strong> {{ trfMeta.sampleRate.toLocaleString() }} Hz</p>
        <p><strong>Frequency Range:</strong> {{ formatFrequency(trfMeta.frequencyRange.min) }} - {{ formatFrequency(trfMeta.frequencyRange.max) }}</p>
        <p v-if="hasCoherenceData"><strong>Data Type:</strong> Includes Coherence</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFilterStore } from '@/stores/filterStore'

const store = useFilterStore()
const trfMeta = ref(null)
const isDragOver = ref(false)
const showPasteDialog = ref(false)
const pastedText = ref('')
const pastedData = ref(null)

// Computed property to check if data includes coherence
const hasCoherenceData = computed(() => {
  return trfMeta.value?.dataPoints?.some(point => point.coherence !== undefined) || false
})

const openFileDialog = async () => {
  try {
    const data = await store.loadTRFFile()
    if (data) {
      trfMeta.value = data
    }
  } catch (err) {
    console.error('File load error:', err)
  }
}

const handleDragOver = (e) => {
  isDragOver.value = true
}

const handleDragLeave = (e) => {
  isDragOver.value = false
}

const handleDrop = async (e) => {
  e.preventDefault()
  isDragOver.value = false
  
  const files = Array.from(e.dataTransfer.files)
  const trfFile = files.find(file => file.name.toLowerCase().endsWith('.trf'))
  
  if (trfFile) {
    try {
      // Check if we're running in Electron
      if (!window.electronAPI) {
        throw new Error('File processing requires Electron environment')
      }
      
      const data = await window.electronAPI.processDroppedFile(trfFile.path)
      store.trfData = data
      trfMeta.value = data
      store.status = 'ready'
    } catch (err) {
      console.error('File processing error:', err)
      store.setError(err.message)
    }
  } else {
    store.setError('Please drop a valid TRF file')
  }
}

const formatFrequency = (freq) => {
  if (freq >= 1e6) {
    return `${(freq / 1e6).toFixed(1)} MHz`
  } else if (freq >= 1e3) {
    return `${(freq / 1e3).toFixed(1)} kHz`
  } else {
    return `${freq.toFixed(1)} Hz`
  }
}

const processPastedData = async () => {
  try {
    if (!pastedText.value.trim()) {
      throw new Error('No data to process')
    }
    
    // Check if we're in Electron environment for file processing
    if (window.electronAPI) {
      // Use Electron's file processing capabilities
      const data = await window.electronAPI.processPastedData(pastedText.value)
      if (data) {
        store.trfData = data
        store.status = 'ready'
        pastedData.value = data
        trfMeta.value = data
        
        // Close dialog and show success
        showPasteDialog.value = false
        pastedText.value = ''
        
        console.log('✅ Pasted data processed successfully:', data)
      }
    } else {
      // Fallback for browser environment - parse directly
      const lines = pastedText.value.split(/\r?\n/)
      const dataPoints = []
      
      let dataStarted = false
      let headerFound = false
      let hasCoherence = false
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        if (!line) continue
        
        // Skip title lines (like "TTA DM3 10-9")
        if (line.includes('TTA') || line.includes('DM3')) {
          continue
        }
        
        // Detect header row with various formats
        if (!headerFound && (
          line.toLowerCase().includes('frequency (hz)') ||
          line.toLowerCase().includes('frequency') ||
          line.toLowerCase().includes('freq')
        )) {
          headerFound = true
          dataStarted = true
          hasCoherence = line.toLowerCase().includes('coherence')
          continue
        }
        
        // Detect data start even without header
        if (!dataStarted && isNumericLine(line)) {
          dataStarted = true
        }
        
        if (dataStarted) {
          const values = line.split(/\s+/).filter(v => v !== '')
          
          // Handle different column formats
          if (values.length >= 3) {
            const frequency = parseFloat(values[0])
            const magnitude = parseFloat(values[1])
            const phase = parseFloat(values[2])
            
            // Apply 22kHz cutoff and validate data
            if (!isNaN(frequency) && !isNaN(magnitude) && !isNaN(phase) && 
                frequency >= 0 && frequency <= 22000) { // Apply 22kHz cutoff
              const point = { frequency, magnitude, phase }
              
              // Add coherence if present
              if (hasCoherence && values.length >= 4) {
                const coherence = parseFloat(values[3])
                if (!isNaN(coherence) && coherence >= 0 && coherence <= 1) {
                  point.coherence = coherence
                }
              }
              
              dataPoints.push(point)
            }
          }
        }
      }
      
      if (dataPoints.length === 0) {
        throw new Error('No valid data points found in pasted content')
      }
      
      // Create data structure similar to file import
      const processedData = {
        fileName: 'Pasted TRF Data',
        filePath: null,
        dataPoints,
        sampleRate: detectSampleRate(dataPoints),
        pointCount: dataPoints.length,
        frequencyRange: {
          min: Math.min(...dataPoints.map(p => p.frequency)),
          max: Math.max(...dataPoints.map(p => p.frequency))
        }
      }
      
      // Update store and local state
      store.trfData = processedData
      store.status = 'ready'
      pastedData.value = processedData
      trfMeta.value = processedData
      
      // Close dialog and show success
      showPasteDialog.value = false
      pastedText.value = ''
      
      console.log('✅ Pasted data processed successfully:', processedData)
    }
  } catch (error) {
    console.error('❌ Error processing pasted data:', error)
    store.setError(error.message)
  }
}

const clearPastedData = () => {
  pastedData.value = null
  trfMeta.value = null
  store.resetState()
}

const detectSampleRate = (points) => {
  if (points.length < 2) return 48000
  
  const maxFreq = Math.max(...points.map(p => p.frequency))
  // Nyquist frequency * safety margin (1.1)
  return Math.ceil(maxFreq * 2 * 1.1)
}

const isNumericLine = (line) => {
  const values = line.split(/\s+/).filter(v => v !== '')
  if (values.length < 3) return false
  
  const first = parseFloat(values[0])
  const second = parseFloat(values[1])
  const third = parseFloat(values[2])
  
  return !isNaN(first) && !isNaN(second) && !isNaN(third)
}

// Set up keyboard shortcuts
onMounted(() => {
  // Add keyboard shortcut for paste dialog (Ctrl/Cmd + V)
  const handleKeydown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      event.preventDefault()
      showPasteDialog.value = true
    }
  }
  
  document.addEventListener('keydown', handleKeydown)
  
  // Cleanup on unmount
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
})
</script>

<style scoped>
.file-importer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.drop-zone {
  border: 2px dashed #646cff;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  transition: all 0.25s ease;
  cursor: pointer;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drop-zone:hover {
  border-color: #535bf2;
  background-color: rgba(100, 108, 255, 0.05);
}

.drop-zone.dragover {
  border-color: #535bf2;
  background-color: rgba(100, 108, 255, 0.1);
  transform: scale(1.02);
}

.drop-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.drop-content p {
  margin: 0;
  font-size: 1.1em;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-details p {
  margin: 0;
  font-size: 0.9em;
}

.paste-section {
  margin-top: 1rem;
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 8px;
}

.paste-section h4 {
  margin: 0 0 0.75rem 0;
  color: #646cff;
  font-size: 1em;
}

.paste-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.paste-button,
.clear-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.25s ease;
}

.paste-button {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
}

.clear-button {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
}

.paste-button:hover,
.clear-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.paste-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.paste-dialog-content {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.paste-dialog-content h5 {
  margin: 0 0 1rem 0;
  color: #646cff;
}

.paste-instructions {
  margin: 0 0 1rem 0;
  font-size: 0.9em;
  color: #ccc;
}

.paste-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444;
  border-radius: 4px;
  background: #2a2a2a;
  color: white;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  resize: vertical;
  margin-bottom: 1rem;
}

.paste-textarea:focus {
  outline: none;
  border-color: #646cff;
}

.paste-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.process-button,
.cancel-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.25s ease;
}

.process-button {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

.process-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.cancel-button {
  background: linear-gradient(135deg, #6c757d, #495057);
  color: white;
}

.process-button:hover:not(:disabled),
.cancel-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style> 