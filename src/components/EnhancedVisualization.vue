<template>
  <div class="enhanced-visualization">
    <!-- Chart Controls -->
    <div class="chart-controls">
      <div class="control-section">
        <h4>📊 Display Options</h4>
        <div class="control-grid">
          <label class="checkbox-label">
            <input type="checkbox" v-model="displayOptions.showMagnitude" @change="updateChart" />
            Show Magnitude
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="displayOptions.showPhase" @change="updateChart" />
            Show Phase
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="displayOptions.showCoherence" @change="updateChart" />
            Show Coherence
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="displayOptions.showGrid" @change="updateChart" />
            Show Grid
          </label>
        </div>
      </div>
      
      <div class="control-section">
        <h4>🎛️ Range Controls</h4>
        <div class="range-controls">
          <div class="range-input">
            <label>Magnitude Range (dB):</label>
            <div class="range-slider">
              <input 
                type="range" 
                v-model.number="magnitudeRange.min" 
                @input="updateMagnitudeRange"
                min="-60" 
                max="20" 
                step="1"
              />
              <span>{{ magnitudeRange.min }} dB</span>
            </div>
            <div class="range-slider">
              <input 
                type="range" 
                v-model.number="magnitudeRange.max" 
                @input="updateMagnitudeRange"
                min="-20" 
                max="60" 
                step="1"
              />
              <span>{{ magnitudeRange.max }} dB</span>
            </div>
          </div>
          
          <div class="range-input">
            <label>Phase Range (deg):</label>
            <div class="range-slider">
              <input 
                type="range" 
                v-model.number="phaseRange.min" 
                @input="updatePhaseRange"
                min="-360" 
                max="0" 
                step="5"
              />
              <span>{{ phaseRange.min }}°</span>
            </div>
            <div class="range-slider">
              <input 
                type="range" 
                v-model.number="phaseRange.max" 
                @input="updatePhaseRange"
                min="0" 
                max="360" 
                step="5"
              />
              <span>{{ phaseRange.max }}°</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="control-section">
        <h4>✏️ Edit Mode</h4>
        <div class="edit-controls">
          <label class="checkbox-label">
            <input type="checkbox" v-model="editMode.enabled" @change="toggleEditMode" />
            Enable Interactive Editing
          </label>
          <div v-if="editMode.enabled" class="edit-options">
            <label class="radio-label">
              <input type="radio" v-model="editMode.type" value="magnitude" />
              Edit Magnitude
            </label>
            <label class="radio-label">
              <input type="radio" v-model="editMode.type" value="phase" />
              Edit Phase
            </label>
            <div class="edit-info">
              <p>💡 Click and drag on the chart to edit {{ editMode.type }} values</p>
              <p>🎯 Selected point: {{ selectedPoint ? `${selectedPoint.frequency.toFixed(1)} Hz` : 'None' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Main Chart -->
    <div class="chart-container">
      <canvas ref="chartCanvas" class="main-chart"></canvas>
      <div class="chart-overlay" v-if="editMode.enabled" @mousedown="startEdit" @mousemove="updateEdit" @mouseup="endEdit" @mouseleave="endEdit"></div>
    </div>
    
    <!-- Data Table -->
    <div class="data-table-section" v-if="store.hasTRFData">
      <h4>📋 Data Points</h4>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Index</th>
              <th>Frequency (Hz)</th>
              <th>Magnitude (dB)</th>
              <th>Phase (deg)</th>
              <th>Coherence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(point, index) in visibleDataPoints" :key="index" :class="{ selected: selectedPointIndex === index }">
              <td>{{ index }}</td>
              <td>{{ point.frequency.toFixed(1) }}</td>
              <td>
                <input 
                  v-if="editMode.enabled && editMode.type === 'magnitude'"
                  type="number" 
                  v-model.number="point.magnitude" 
                  @input="updateDataPoint(index, 'magnitude', $event.target.value)"
                  step="0.1"
                  class="edit-input"
                />
                <span v-else>{{ point.magnitude.toFixed(2) }}</span>
              </td>
              <td>
                <input 
                  v-if="editMode.enabled && editMode.type === 'phase'"
                  type="number" 
                  v-model.number="point.phase" 
                  @input="updateDataPoint(index, 'phase', $event.target.value)"
                  step="1"
                  class="edit-input"
                />
                <span v-else>{{ point.phase.toFixed(1) }}</span>
              </td>
              <td>{{ point.coherence ? point.coherence.toFixed(3) : 'N/A' }}</td>
              <td>
                <button @click="selectPoint(index)" class="select-btn">Select</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Status Bar -->
    <div class="status-bar">
      <div class="status-item">
        <span class="status-label">Points:</span>
        <span class="status-value">{{ store.trfData?.pointCount || 0 }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">Sample Rate:</span>
        <span class="status-value">{{ store.trfData?.sampleRate || 0 }} Hz</span>
      </div>
      <div class="status-item">
        <span class="status-label">Frequency Range:</span>
        <span class="status-value">{{ formatFrequency(store.trfData?.frequencyRange?.min || 0) }} - {{ formatFrequency(store.trfData?.frequencyRange?.max || 0) }}</span>
      </div>
      <div class="status-item" v-if="store.hasCoefficients">
        <span class="status-label">Coefficients:</span>
        <span class="status-value">{{ store.coefficients?.length || 0 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useFilterStore } from '@/stores/filterStore'

const store = useFilterStore()
const chartCanvas = ref(null)
let animationFrame = null

// Display options
const displayOptions = reactive({
  showMagnitude: true,
  showPhase: true,
  showCoherence: true,
  showGrid: true
})

// Range controls
const magnitudeRange = reactive({
  min: -30,
  max: 10
})

const phaseRange = reactive({
  min: -180,
  max: 180
})

// Edit mode
const editMode = reactive({
  enabled: false,
  type: 'magnitude', // 'magnitude' or 'phase'
  isDragging: false,
  dragStart: null
})

const selectedPointIndex = ref(null)
const selectedPoint = computed(() => {
  if (selectedPointIndex.value === null || !store.trfData?.dataPoints) return null
  return store.trfData.dataPoints[selectedPointIndex.value]
})

// Computed data
const visibleDataPoints = computed(() => {
  if (!store.trfData?.dataPoints) return []
  return store.trfData.dataPoints.filter(point => 
    point.frequency >= 20 && point.frequency <= 22000
  )
})

// Utility functions
const formatFrequency = (freq) => {
  if (freq >= 1e6) return `${(freq / 1e6).toFixed(1)} MHz`
  if (freq >= 1e3) return `${(freq / 1e3).toFixed(1)} kHz`
  return `${freq.toFixed(1)} Hz`
}

// Chart drawing functions
const drawChart = () => {
  const canvas = chartCanvas.value
  if (!canvas || !store.trfData?.dataPoints) return

  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  // Draw background
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)

  // Draw grid
  if (displayOptions.showGrid) {
    drawGrid(ctx, width, height)
  }

  // Draw axes
  drawAxes(ctx, width, height)

  // Draw data curves
  if (displayOptions.showMagnitude) {
    drawMagnitudeCurve(ctx, width, height)
  }

  if (displayOptions.showPhase) {
    drawPhaseCurve(ctx, width, height)
  }

  if (displayOptions.showCoherence) {
    drawCoherenceCurve(ctx, width, height)
  }

  // Draw selected point
  if (selectedPointIndex.value !== null) {
    drawSelectedPoint(ctx, width, height)
  }
}

const drawGrid = (ctx, width, height) => {
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 1

  // Frequency grid lines (logarithmic)
  const freqs = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
  freqs.forEach(freq => {
    const x = (Math.log10(freq) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * (width - 80) + 40
    ctx.beginPath()
    ctx.moveTo(x, 20)
    ctx.lineTo(x, height - 40)
    ctx.stroke()
  })

  // Magnitude grid lines
  for (let i = 0; i <= 10; i++) {
    const y = 20 + (height - 60) * (i / 10)
    ctx.beginPath()
    ctx.moveTo(40, y)
    ctx.lineTo(width - 40, y)
    ctx.stroke()
  }
}

const drawAxes = (ctx, width, height) => {
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.fillStyle = '#ffffff'
  ctx.font = '12px Arial'

  // X-axis
  ctx.beginPath()
  ctx.moveTo(40, height - 40)
  ctx.lineTo(width - 40, height - 40)
  ctx.stroke()

  // Y-axis
  ctx.beginPath()
  ctx.moveTo(40, 20)
  ctx.lineTo(40, height - 40)
  ctx.stroke()

  // Labels
  ctx.fillText('Frequency (Hz)', width / 2, height - 10)
  ctx.save()
  ctx.translate(20, height / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText('Magnitude (dB) / Phase (deg)', 0, 0)
  ctx.restore()

  // Frequency labels
  const freqs = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
  freqs.forEach(freq => {
    const x = (Math.log10(freq) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * (width - 80) + 40
    ctx.fillText(formatFrequency(freq), x - 15, height - 20)
  })

  // Magnitude labels
  for (let i = 0; i <= 5; i++) {
    const y = 20 + (height - 60) * (i / 5)
    const value = magnitudeRange.min + (magnitudeRange.max - magnitudeRange.min) * (1 - i / 5)
    ctx.fillText(value.toFixed(0), 5, y + 5)
  }
}

const drawMagnitudeCurve = (ctx, width, height) => {
  if (!store.trfData?.dataPoints) return

  ctx.strokeStyle = '#ff6b6b'
  ctx.lineWidth = 2
  ctx.beginPath()

  const points = visibleDataPoints.value
  points.forEach((point, index) => {
    const x = (Math.log10(point.frequency) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * (width - 80) + 40
    const y = ((magnitudeRange.max - point.magnitude) / (magnitudeRange.max - magnitudeRange.min)) * (height - 60) + 20

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()
}

const drawPhaseCurve = (ctx, width, height) => {
  if (!store.trfData?.dataPoints) return

  ctx.strokeStyle = '#4ecdc4'
  ctx.lineWidth = 2
  ctx.beginPath()

  const points = visibleDataPoints.value
  points.forEach((point, index) => {
    const x = (Math.log10(point.frequency) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * (width - 80) + 40
    const y = ((phaseRange.max - point.phase) / (phaseRange.max - phaseRange.min)) * (height - 60) + 20

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()
}

const drawCoherenceCurve = (ctx, width, height) => {
  if (!store.trfData?.dataPoints) return

  const points = visibleDataPoints.value.filter(p => p.coherence !== undefined)
  if (points.length === 0) return

  ctx.strokeStyle = '#45b7d1'
  ctx.lineWidth = 1
  ctx.beginPath()

  points.forEach((point, index) => {
    const x = (Math.log10(point.frequency) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * (width - 80) + 40
    const y = (1 - point.coherence) * (height - 60) + 20

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()
}

const drawSelectedPoint = (ctx, width, height) => {
  if (selectedPointIndex.value === null || !store.trfData?.dataPoints) return

  const point = store.trfData.dataPoints[selectedPointIndex.value]
  const x = (Math.log10(point.frequency) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * (width - 80) + 40
  const y = ((magnitudeRange.max - point.magnitude) / (magnitudeRange.max - magnitudeRange.min)) * (height - 60) + 20

  ctx.fillStyle = '#ffff00'
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, 2 * Math.PI)
  ctx.fill()
}

// Chart update functions
const updateChart = () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  animationFrame = requestAnimationFrame(drawChart)
}

const updateMagnitudeRange = () => {
  updateChart()
}

const updatePhaseRange = () => {
  updateChart()
}

// Edit mode functions
const toggleEditMode = () => {
  if (!editMode.enabled) {
    selectedPointIndex.value = null
  }
  updateChart()
}

const selectPoint = (index) => {
  selectedPointIndex.value = index
  updateChart()
}

const startEdit = (event) => {
  if (!editMode.enabled) return
  
  const rect = chartCanvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  // Find closest point
  const points = visibleDataPoints.value
  let closestIndex = -1
  let closestDistance = Infinity
  
  points.forEach((point, index) => {
    const pointX = (Math.log10(point.frequency) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * (chartCanvas.value.width - 80) + 40
    const pointY = ((magnitudeRange.max - point.magnitude) / (magnitudeRange.max - magnitudeRange.min)) * (chartCanvas.value.height - 60) + 20
    
    const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2)
    if (distance < closestDistance && distance < 20) {
      closestDistance = distance
      closestIndex = index
    }
  })
  
  if (closestIndex !== -1) {
    editMode.isDragging = true
    editMode.dragStart = { x, y }
    selectedPointIndex.value = closestIndex
    updateChart()
  }
}

const updateEdit = (event) => {
  if (!editMode.isDragging || !editMode.dragStart || selectedPointIndex.value === null) return
  
  const rect = chartCanvas.value.getBoundingClientRect()
  const y = event.clientY - rect.top
  
  if (selectedPointIndex.value !== null && store.trfData?.dataPoints) {
    const point = store.trfData.dataPoints[selectedPointIndex.value]
    
    if (editMode.type === 'magnitude') {
      const newMagnitude = magnitudeRange.max - (y - 20) / (chartCanvas.value.height - 60) * (magnitudeRange.max - magnitudeRange.min)
      point.magnitude = Math.max(magnitudeRange.min, Math.min(magnitudeRange.max, newMagnitude))
    } else {
      const newPhase = phaseRange.max - (y - 20) / (chartCanvas.value.height - 60) * (phaseRange.max - phaseRange.min)
      point.phase = Math.max(phaseRange.min, Math.min(phaseRange.max, newPhase))
    }
    
    // Trigger store update
    store.updateTRFDataPoint(selectedPointIndex.value, point)
    updateChart()
  }
}

const endEdit = () => {
  editMode.isDragging = false
  editMode.dragStart = null
}

const updateDataPoint = (index, property, value) => {
  if (!store.trfData?.dataPoints) return
  
  const point = store.trfData.dataPoints[index]
  point[property] = parseFloat(value)
  
  store.updateTRFDataPoint(index, point)
  updateChart()
}

// Watchers
watch(() => store.trfData, () => {
  nextTick(() => {
    updateChart()
  })
}, { deep: true })

watch(() => store.displayRanges, () => {
  nextTick(() => {
    updateChart()
  })
}, { deep: true })

// Lifecycle
onMounted(() => {
  nextTick(() => {
    if (chartCanvas.value) {
      chartCanvas.value.width = 800
      chartCanvas.value.height = 400
      updateChart()
    }
  })
})
</script>

<style scoped>
.enhanced-visualization {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  background: #1a1a1a;
  border-radius: 8px;
  padding: 1rem;
}

.chart-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 8px;
  border: 1px solid #444;
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.control-section h4 {
  margin: 0;
  color: #646cff;
  font-size: 1em;
  font-weight: 600;
}

.control-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.checkbox-label,
.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9em;
  color: #ccc;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"],
.radio-label input[type="radio"] {
  margin: 0;
}

.range-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.range-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.range-input label {
  font-size: 0.9em;
  color: #ccc;
  font-weight: 500;
}

.range-slider {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.range-slider input[type="range"] {
  flex: 1;
  height: 6px;
  background: #444;
  border-radius: 3px;
  outline: none;
}

.range-slider input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: #646cff;
  border-radius: 50%;
  cursor: pointer;
}

.range-slider span {
  min-width: 60px;
  font-size: 0.8em;
  color: #888;
  text-align: right;
}

.edit-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.edit-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(100, 108, 255, 0.1);
  border-radius: 6px;
  border: 1px solid #646cff;
}

.edit-info {
  margin-top: 0.5rem;
}

.edit-info p {
  margin: 0.25rem 0;
  font-size: 0.8em;
  color: #888;
}

.chart-container {
  position: relative;
  flex: 1;
  min-height: 400px;
  background: #2a2a2a;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #444;
}

.main-chart {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #000000;
  border-radius: 4px;
}

.chart-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  cursor: crosshair;
  z-index: 10;
}

.data-table-section {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #444;
}

.data-table-section h4 {
  margin: 0 0 1rem 0;
  color: #646cff;
  font-size: 1em;
}

.table-container {
  max-height: 300px;
  overflow-y: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85em;
}

.data-table th,
.data-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid #444;
}

.data-table th {
  background: #333;
  color: #646cff;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
}

.data-table td {
  color: #ccc;
}

.data-table tr.selected {
  background: rgba(100, 108, 255, 0.1);
}

.edit-input {
  width: 80px;
  padding: 0.25rem;
  background: #1a1a1a;
  border: 1px solid #646cff;
  border-radius: 4px;
  color: white;
  font-size: 0.8em;
}

.select-btn {
  padding: 0.25rem 0.5rem;
  background: #646cff;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 0.8em;
  cursor: pointer;
}

.select-btn:hover {
  background: #535bf2;
}

.status-bar {
  display: flex;
  gap: 2rem;
  padding: 0.75rem 1rem;
  background: #333;
  border-radius: 6px;
  border: 1px solid #444;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-label {
  font-size: 0.85em;
  color: #888;
  font-weight: 500;
}

.status-value {
  font-size: 0.85em;
  color: #ccc;
  font-weight: 600;
}

/* Responsive design */
@media (max-width: 768px) {
  .chart-controls {
    grid-template-columns: 1fr;
  }
  
  .control-grid {
    grid-template-columns: 1fr;
  }
  
  .status-bar {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style> 