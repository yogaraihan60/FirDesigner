<template>
  <div class="export-panel">
    <h3>Export Coefficients</h3>
    
    <div class="export-options">
      <div class="format-selection">
        <label for="exportFormat">Export Format:</label>
        <select 
          id="exportFormat" 
          v-model="selectedFormat"
        >
          <option value="text">Text File (.txt)</option>
          <option value="csv">CSV File (.csv)</option>
          <option value="matlab">MATLAB Script (.m)</option>
          <option value="python">Python Array (.py)</option>
        </select>
      </div>
      
      <div class="export-info">
        <p><strong>Format:</strong> {{ formatDescription }}</p>
        <p><strong>Coefficients:</strong> {{ store.coefficients.length }} values</p>
      </div>
      
      <div class="export-actions">
        <button 
          @click="exportCoefficients"
          :disabled="!store.hasCoefficients"
          class="export-button"
        >
          💾 Export Coefficients
        </button>
        
        <button 
          @click="copyToClipboard"
          :disabled="!store.hasCoefficients"
          class="copy-button"
        >
          📋 Copy to Clipboard
        </button>
      </div>
    </div>
    
    <!-- Export Status -->
    <div v-if="exportStatus" class="export-status" :class="exportStatus.type">
      <p>{{ exportStatus.message }}</p>
    </div>
    
    <!-- Preview -->
    <div v-if="store.hasCoefficients" class="coefficient-preview">
      <h4>Preview (first 10 coefficients):</h4>
      <div class="preview-content">
        <code>{{ coefficientPreview }}</code>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFilterStore } from '@/stores/filterStore'

const store = useFilterStore()
const selectedFormat = ref('text')
const exportStatus = ref(null)

const formatDescription = computed(() => {
  const descriptions = {
    text: 'Plain text, one coefficient per line',
    csv: 'Comma-separated values',
    matlab: 'MATLAB array assignment',
    python: 'Python list assignment'
  }
  return descriptions[selectedFormat.value]
})

const coefficientPreview = computed(() => {
  if (!store.coefficients.length) return ''
  
  const preview = store.coefficients.slice(0, 10)
  
  switch (selectedFormat.value) {
    case 'text':
      return preview.map(c => c.toFixed(6)).join('\n')
    case 'csv':
      return preview.map(c => c.toFixed(6)).join(', ')
    case 'matlab':
      return `coefficients = [${preview.map(c => c.toFixed(6)).join(', ')}];`
    case 'python':
      return `coefficients = [${preview.map(c => c.toFixed(6)).join(', ')}]`
    default:
      return preview.map(c => c.toFixed(6)).join('\n')
  }
})

const exportCoefficients = async () => {
  try {
    exportStatus.value = { type: 'loading', message: 'Exporting...' }
    
    // Ensure coefficients are serializable for IPC
    const serializableCoefficients = store.coefficients.map(c => {
      // Convert to number and ensure it's finite
      const value = Number(c)
      return isFinite(value) ? value : 0
    })
    
    const result = await window.electronAPI.exportCoefficients(
      serializableCoefficients,
      selectedFormat.value
    )
    
    if (result) {
      exportStatus.value = { 
        type: 'success', 
        message: `✅ Exported to: ${result.filePath}` 
      }
    } else {
      exportStatus.value = { 
        type: 'info', 
        message: 'Export cancelled' 
      }
    }
  } catch (err) {
    exportStatus.value = { 
      type: 'error', 
      message: `❌ Export failed: ${err.message}` 
    }
    console.error('Export error:', err)
  }
  
  // Clear status after 5 seconds
  setTimeout(() => {
    exportStatus.value = null
  }, 5000)
}

const copyToClipboard = async () => {
  try {
    let content = ''
    
    switch (selectedFormat.value) {
      case 'text':
        content = store.coefficients.map(c => c.toFixed(6)).join('\n')
        break
      case 'csv':
        content = store.coefficients.map(c => c.toFixed(6)).join(',')
        break
      case 'matlab':
        content = `% FIR Filter Coefficients\ncoefficients = [${store.coefficients.map(c => c.toFixed(6)).join(', ')}];`
        break
      case 'python':
        content = `# FIR Filter Coefficients\ncoefficients = [${store.coefficients.map(c => c.toFixed(6)).join(', ')}]`
        break
    }
    
    await navigator.clipboard.writeText(content)
    exportStatus.value = { 
      type: 'success', 
      message: '✅ Coefficients copied to clipboard' 
    }
  } catch (err) {
    exportStatus.value = { 
      type: 'error', 
      message: '❌ Failed to copy to clipboard' 
    }
    console.error('Clipboard error:', err)
  }
  
  // Clear status after 3 seconds
  setTimeout(() => {
    exportStatus.value = null
  }, 3000)
}
</script>

<style scoped>
.export-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.format-selection {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.format-selection label {
  font-size: 0.9em;
  font-weight: 500;
  color: #646cff;
}

.format-selection select {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #444;
  background: #2a2a2a;
  color: white;
  font-size: 0.9em;
}

.format-selection select:focus {
  outline: none;
  border-color: #646cff;
}

.export-info {
  background: #2a2a2a;
  border-radius: 4px;
  padding: 0.75rem;
}

.export-info p {
  margin: 0.25rem 0;
  font-size: 0.9em;
}

.export-actions {
  display: flex;
  gap: 0.5rem;
}

.export-button,
.copy-button {
  flex: 1;
  padding: 0.75rem;
  font-size: 0.9em;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.export-button {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

.export-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.copy-button {
  background: linear-gradient(135deg, #6c757d, #495057);
  color: white;
}

.copy-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.export-button:disabled,
.copy-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.export-status {
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.9em;
}

.export-status.loading {
  background-color: rgba(255, 193, 7, 0.1);
  border: 1px solid #ffc107;
  color: #ffc107;
}

.export-status.success {
  background-color: rgba(40, 167, 69, 0.1);
  border: 1px solid #28a745;
  color: #28a745;
}

.export-status.error {
  background-color: rgba(220, 53, 69, 0.1);
  border: 1px solid #dc3545;
  color: #dc3545;
}

.export-status.info {
  background-color: rgba(13, 202, 240, 0.1);
  border: 1px solid #0dcaf0;
  color: #0dcaf0;
}

.coefficient-preview {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 1rem;
}

.coefficient-preview h4 {
  margin: 0 0 0.75rem 0;
  color: #646cff;
  font-size: 0.9em;
}

.preview-content {
  background: #1a1a1a;
  border-radius: 4px;
  padding: 0.75rem;
  max-height: 150px;
  overflow-y: auto;
}

.preview-content code {
  font-family: 'Courier New', monospace;
  font-size: 0.8em;
  color: #e9ecef;
  white-space: pre-wrap;
  word-break: break-all;
}
</style> 