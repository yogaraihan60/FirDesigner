<template>
  <div class="app-container">
    <!-- Environment Indicator -->
    <div v-if="!isElectron" class="dev-mode-warning">
      <p>⚠️ Development Mode: Some features require Electron environment</p>
    </div>
    <div v-else class="electron-mode-indicator">
      <p>🚀 Electron Mode: Full functionality available</p>
    </div>
    
    <!-- Demo Section -->
    <div v-if="isElectron" class="demo-section">
      <button @click="testAPI" class="test-button">🧪 Test Electron API</button>
      <button @click="loadDemoData" class="demo-button">📊 Load Demo Data</button>
      <p v-if="testResult" class="test-result">{{ testResult }}</p>
    </div>
    
    <!-- Main Application -->
    <div class="main-application">
      <div class="app-header">
        <h1>FIR Designer</h1>
        <div class="app-logo">FIRd</div>
      </div>
      
      <!-- Tabbed Interface -->
      <TabbedInterface />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useFilterStore } from './stores/filterStore'
import TabbedInterface from './components/TabbedInterface.vue'
import EventHub from './utils/eventHub'

const store = useFilterStore()
const isElectron = ref(false)
const testResult = ref('')

// Set up error handling
onMounted(() => {
  // Check if we're running in Electron
  isElectron.value = !!window.electronAPI
  
  if (window.electronAPI) {
    window.electronAPI.onError((data) => {
      console.error('Electron error:', data)
      // Handle error display
    })
  }
})

onUnmounted(() => {
  if (window.electronAPI) {
    window.electronAPI.removeAllListeners('error-channel')
  }
})

const testAPI = async () => {
  try {
    const result = await window.electronAPI.testAPI()
    testResult.value = result.message
    console.log('✅ Electron API test successful:', result)
  } catch (error) {
    testResult.value = `Error: ${error.message}`
    console.error('❌ Electron API test failed:', error)
  }
}

const loadDemoData = async () => {
  try {
    // Load the sample TRF file
    const fs = await import('fs/promises')
    const buffer = await fs.readFile('./sample.trf')
    
    // Parse the TRF data with 22kHz cutoff
    const { parseTRF, apply22kHzCutoff, detectOptimalSampleRate } = await import('./utils/trfParser.js')
    const dataPoints = parseTRF(buffer)
    
    // Apply additional 22kHz cutoff as safety measure
    const filteredPoints = apply22kHzCutoff(dataPoints)
    
    if (filteredPoints.length === 0) {
      throw new Error('No valid data points found after 22kHz cutoff')
    }
    
    // Create demo data structure
    const demoData = {
      fileName: 'sample.trf',
      filePath: './sample.trf',
      dataPoints: filteredPoints,
      sampleRate: detectOptimalSampleRate(filteredPoints),
      pointCount: filteredPoints.length,
      frequencyRange: {
        min: Math.min(...filteredPoints.map(p => p.frequency)),
        max: Math.max(...filteredPoints.map(p => p.frequency))
      }
    }
    
    // Update store
    store.trfData = demoData
    store.status = 'ready'
    testResult.value = `✅ Loaded demo data: ${filteredPoints.length} points (max freq: ${Math.max(...filteredPoints.map(p => p.frequency))} Hz)`
    console.log('✅ Demo data loaded successfully:', demoData)
  } catch (error) {
    testResult.value = `Error loading demo: ${error.message}`
    console.error('❌ Demo data loading failed:', error)
  }
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #0a0a0a;
  color: white;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dev-mode-warning,
.electron-mode-indicator {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-align: center;
  font-size: 0.9em;
}

.dev-mode-warning {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid #ffc107;
  color: #ffc107;
}

.electron-mode-indicator {
  background: rgba(40, 167, 69, 0.1);
  border: 1px solid #28a745;
  color: #28a745;
}

.demo-section {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(100, 108, 255, 0.05);
  border-radius: 8px;
  border: 1px solid #444;
}

.test-button,
.demo-button {
  padding: 0.5rem 1rem;
  border: 1px solid #646cff;
  background: #646cff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.2s ease;
}

.test-button:hover,
.demo-button:hover {
  background: #535bf2;
  border-color: #535bf2;
}

.test-result {
  margin: 0;
  font-size: 0.9em;
  color: #ccc;
}

.main-application {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 8px;
  border: 1px solid #444;
}

.app-header h1 {
  margin: 0;
  color: #646cff;
  font-size: 1.5em;
  font-weight: 600;
}

.app-logo {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #646cff, #535bf2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9em;
  color: white;
  border: 2px solid #444;
}

/* Responsive design */
@media (max-width: 768px) {
  .app-container {
    padding: 0.5rem;
  }
  
  .demo-section {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .app-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style> 