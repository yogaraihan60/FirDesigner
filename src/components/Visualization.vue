<template>
  <div class="visualization-container">
    <!-- Frequency Response Graph (Bode Plot) -->
    <div class="graph-section">
      <h3>Frequency Response</h3>
      <div class="graph-container">
        <canvas ref="freqCanvas" class="graph-canvas"></canvas>
        <div class="graph-controls">
          <div class="control-group">
            <label>Level: min {{ freqYMin }} dB max {{ freqYMax }} dB</label>
            <button @click="adjustFreqYRange(-5)">▼</button>
            <button @click="adjustFreqYRange(5)">▲</button>
          </div>
          <div class="control-group">
            <label>
              <input type="checkbox" v-model="showMagnitude" /> M
            </label>
            <label>
              <input type="checkbox" v-model="showPhase" /> P
            </label>
            <label>
              <input type="checkbox" v-model="showCoherence" /> C
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Impulse Response Graph -->
    <div class="graph-section">
      <h3>Impulse Response</h3>
      <div class="graph-container">
        <canvas ref="impulseCanvas" class="graph-canvas"></canvas>
        <div class="graph-controls">
          <div class="control-group">
            <label>Value zoom:</label>
            <button @click="adjustImpulseYRange(-0.1)">-</button>
            <button @click="adjustImpulseYRange(0.1)">+</button>
          </div>
          <div class="control-group">
            <label>Time (samples): min {{ impulseXMin }} max {{ impulseXMax }}</label>
            <input type="number" v-model.number="impulseXMin" @input="updateImpulseGraph" />
            <input type="number" v-model.number="impulseXMax" @input="updateImpulseGraph" />
          </div>
        </div>
      </div>
    </div>

    <!-- Status and Info -->
    <div class="status-section">
      <div v-if="store.hasTRFData" class="info-panel">
        <h4>TRF Data Info</h4>
        <p><strong>Points:</strong> {{ store.trfData?.pointCount || 0 }}</p>
        <p><strong>Sample Rate:</strong> {{ store.trfData?.sampleRate || 0 }} Hz</p>
        <p><strong>Frequency Range:</strong> {{ formatFrequency(store.trfData?.frequencyRange?.min || 0) }} - {{ formatFrequency(store.trfData?.frequencyRange?.max || 0) }}</p>
      </div>
      
      <div v-if="store.hasCoefficients" class="info-panel">
        <h4>Filter Info</h4>
        <p><strong>Coefficients:</strong> {{ store.coefficients?.length || 0 }}</p>
        <p><strong>Max Coefficient:</strong> {{ maxCoefficient?.toFixed(6) || 'N/A' }}</p>
        <p><strong>Min Coefficient:</strong> {{ minCoefficient?.toFixed(6) || 'N/A' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useFilterStore } from '@/stores/filterStore'

const store = useFilterStore()

// Canvas references
const freqCanvas = ref(null)
const impulseCanvas = ref(null)

// Graph state
const freqYMin = ref(-30)
const freqYMax = ref(10)
const impulseXMin = ref(-200)
const impulseXMax = ref(1000)
const impulseYMin = ref(-1.0)
const impulseYMax = ref(1.0)

// Display options
const showMagnitude = ref(true)
const showPhase = ref(true)
const showCoherence = ref(true)

// Computed properties
const maxCoefficient = computed(() => {
  if (!store.coefficients?.length) return null
  return Math.max(...store.coefficients)
})

const minCoefficient = computed(() => {
  if (!store.coefficients?.length) return null
  return Math.min(...store.coefficients)
})

// Utility functions
const formatFrequency = (freq) => {
  if (freq >= 1e6) {
    return `${(freq / 1e6).toFixed(1)} MHz`
  } else if (freq >= 1e3) {
    return `${(freq / 1e3).toFixed(1)} kHz`
  } else {
    return `${freq.toFixed(1)} Hz`
  }
}

// Graph drawing functions
const drawFrequencyResponse = () => {
  const canvas = freqCanvas.value
  if (!canvas || !store.frequencyResponse?.length) return

  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  // Draw grid
  drawGrid(ctx, width, height, freqYMin.value, freqYMax.value, true)

  // Draw axes
  drawAxes(ctx, width, height, 'Frequency (Hz)', 'Level (dB)', freqYMin.value, freqYMax.value, true)

  // Draw frequency response data
  if (showMagnitude.value) {
    drawFrequencyCurve(ctx, width, height, store.frequencyResponse, 'magnitude', '#ff0000', freqYMin.value, freqYMax.value, true)
  }

  if (showPhase.value) {
    drawFrequencyCurve(ctx, width, height, store.frequencyResponse, 'phase', '#0000ff', -180, 180, false)
  }

  if (showCoherence.value && store.trfData?.dataPoints?.some(p => p.coherence !== undefined)) {
    drawCoherenceCurve(ctx, width, height, store.trfData.dataPoints, '#00ffff')
  }
}

const drawImpulseResponse = () => {
  const canvas = impulseCanvas.value
  if (!canvas || !store.coefficients?.length) return

  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  // Draw grid
  drawGrid(ctx, width, height, impulseYMin.value, impulseYMax.value, false)

  // Draw axes
  drawAxes(ctx, width, height, 'Time (samples @ 96 kHz)', 'Response Value', impulseYMin.value, impulseYMax.value, false)

  // Draw impulse response
  drawImpulseCurve(ctx, width, height, store.coefficients, '#00ff00')
}

const drawGrid = (ctx, width, height, yMin, yMax, isLogX) => {
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 1

  // Vertical grid lines
  if (isLogX) {
    // Logarithmic frequency grid
    const freqs = [15, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
    freqs.forEach(freq => {
      const x = (Math.log10(freq) - Math.log10(15)) / (Math.log10(20000) - Math.log10(15)) * width
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    })
  } else {
    // Linear time grid
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
  }

  // Horizontal grid lines
  for (let i = 0; i <= 10; i++) {
    const y = (i / 10) * height
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

const drawAxes = (ctx, width, height, xLabel, yLabel, yMin, yMax, isLogX) => {
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.fillStyle = '#ffffff'
  ctx.font = '12px Arial'

  // X-axis
  ctx.beginPath()
  ctx.moveTo(0, height - 20)
  ctx.lineTo(width, height - 20)
  ctx.stroke()

  // Y-axis
  ctx.beginPath()
  ctx.moveTo(20, 0)
  ctx.lineTo(20, height - 20)
  ctx.stroke()

  // Labels
  ctx.fillText(xLabel, width / 2, height - 5)
  ctx.save()
  ctx.translate(10, height / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText(yLabel, 0, 0)
  ctx.restore()

  // Y-axis values
  for (let i = 0; i <= 5; i++) {
    const y = (i / 5) * (height - 20)
    const value = yMin + (yMax - yMin) * (1 - i / 5)
    ctx.fillText(value.toFixed(0), 5, y + 5)
  }
}

const drawFrequencyCurve = (ctx, width, height, data, property, color, yMin, yMax, isLogX) => {
  if (!data?.length) return

  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()

  data.forEach((point, index) => {
    let x, y

    if (isLogX) {
      x = (Math.log10(point.frequency) - Math.log10(15)) / (Math.log10(20000) - Math.log10(15)) * width
    } else {
      x = (index / (data.length - 1)) * width
    }

    y = ((yMax - point[property]) / (yMax - yMin)) * (height - 20)

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()
}

const drawCoherenceCurve = (ctx, width, height, data) => {
  if (!data?.length) return

  ctx.strokeStyle = '#00ffff'
  ctx.lineWidth = 1
  ctx.beginPath()

  data.forEach((point, index) => {
    if (point.coherence === undefined) return

    const x = (Math.log10(point.frequency) - Math.log10(15)) / (Math.log10(20000) - Math.log10(15)) * width
    const y = (1 - point.coherence) * (height - 20)

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()
}

const drawImpulseCurve = (ctx, width, height, coefficients) => {
  if (!coefficients?.length) return

  ctx.strokeStyle = '#00ff00'
  ctx.lineWidth = 2
  ctx.beginPath()

  coefficients.forEach((coeff, index) => {
    const x = (index / (coefficients.length - 1)) * width
    const y = ((1.0 - coeff) / 2.0) * (height - 20)

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()
}

// Control functions
const adjustFreqYRange = (delta) => {
  freqYMin.value += delta
  freqYMax.value += delta
  updateFrequencyGraph()
}

const adjustImpulseYRange = (delta) => {
  impulseYMin.value += delta
  impulseYMax.value += delta
  updateImpulseGraph()
}

const updateFrequencyGraph = () => {
  nextTick(() => {
    drawFrequencyResponse()
  })
}

const updateImpulseGraph = () => {
  nextTick(() => {
    drawImpulseResponse()
  })
}

// Watchers
watch(() => store.frequencyResponse, updateFrequencyGraph, { deep: true })
watch(() => store.coefficients, updateImpulseGraph, { deep: true })
watch(() => store.trfData, updateFrequencyGraph, { deep: true })
watch([showMagnitude, showPhase, showCoherence], updateFrequencyGraph)

// Lifecycle
onMounted(() => {
  // Set canvas sizes
  if (freqCanvas.value) {
    freqCanvas.value.width = 800
    freqCanvas.value.height = 300
  }
  if (impulseCanvas.value) {
    impulseCanvas.value.width = 800
    impulseCanvas.value.height = 300
  }

  // Initial draw
  updateFrequencyGraph()
  updateImpulseGraph()
})
</script>

<style scoped>
.visualization-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
  background: #1a1a1a;
  border-radius: 8px;
}

.graph-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.graph-section h3 {
  margin: 0;
  color: #646cff;
  font-size: 1.2em;
}

.graph-container {
  position: relative;
  background: #2a2a2a;
  border-radius: 8px;
  padding: 1rem;
}

.graph-canvas {
  width: 100%;
  height: 300px;
  background: #000000;
  border-radius: 4px;
}

.graph-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding: 0.5rem;
  background: #333333;
  border-radius: 4px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-group label {
  font-size: 0.9em;
  color: #ffffff;
}

.control-group button {
  padding: 0.25rem 0.5rem;
  background: #646cff;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 0.8em;
}

.control-group button:hover {
  background: #535bf2;
}

.control-group input[type="number"] {
  width: 60px;
  padding: 0.25rem;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: white;
  font-size: 0.8em;
}

.control-group input[type="checkbox"] {
  margin-right: 0.25rem;
}

.status-section {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.info-panel {
  flex: 1;
  min-width: 200px;
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 8px;
}

.info-panel h4 {
  margin: 0 0 0.75rem 0;
  color: #646cff;
  font-size: 1em;
}

.info-panel p {
  margin: 0.25rem 0;
  font-size: 0.9em;
  color: #ffffff;
}

.info-panel strong {
  color: #646cff;
}
</style> 