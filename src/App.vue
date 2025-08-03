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
    
    <div class="control-panel">
      <h1>FIR Designer</h1>
      
      <!-- File Import Section -->
      <FileImporter />
      
      <!-- Filter Configuration Section -->
      <FilterDesign v-if="store.trfData" />
      
      <!-- Export Section -->
      <ExportPanel v-if="store.coefficients.length > 0" />
    </div>
    
    <div class="visualization-panel">
      <Visualization />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useFilterStore } from './stores/filterStore'
import FileImporter from './components/FileImporter.vue'
import FilterDesign from './components/FilterDesign.vue'
import Visualization from './components/Visualization.vue'
import ExportPanel from './components/ExportPanel.vue'
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
    
    // Parse the TRF data
    const { parseTRF } = await import('./utils/trfParser.js')
    const dataPoints = parseTRF(buffer)
    
    // Create demo data structure
    const demoData = {
      fileName: 'sample.trf',
      filePath: './sample.trf',
      dataPoints,
      sampleRate: 48000,
      pointCount: dataPoints.length,
      frequencyRange: {
        min: Math.min(...dataPoints.map(p => p.frequency)),
        max: Math.max(...dataPoints.map(p => p.frequency))
      }
    }
    
    // Update store
    store.trfData = demoData
    store.status = 'ready'
    testResult.value = `✅ Loaded demo data: ${dataPoints.length} points`
    console.log('✅ Demo data loaded successfully:', demoData)
  } catch (error) {
    testResult.value = `Error loading demo: ${error.message}`
    console.error('❌ Demo data loading failed:', error)
  }
}
</script> 