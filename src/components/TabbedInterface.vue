<template>
  <div class="tabbed-interface">
    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        :disabled="tab.disabled"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>
    
    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Import Tab -->
      <div v-if="activeTab === 'import'" class="tab-panel">
        <FileImporter />
      </div>
      
      <!-- Filter Design Tab -->
      <div v-if="activeTab === 'filter-design'" class="tab-panel">
        <FilterDesign v-if="store.trfData" />
        <div v-else class="no-data-message">
          <p>📁 Please import TRF data first to configure filters</p>
        </div>
      </div>
      
      <!-- Range Editor Tab -->
      <div v-if="activeTab === 'range-editor'" class="tab-panel">
        <RangeEditor />
      </div>
      
      <!-- Export Tab -->
      <div v-if="activeTab === 'export'" class="tab-panel">
        <ExportPanel v-if="store.coefficients.length > 0" />
        <div v-else class="no-data-message">
          <p>🎛️ Please design a filter first to export coefficients</p>
        </div>
      </div>
      
      <!-- Visualization Tab -->
      <div v-if="activeTab === 'visualization'" class="tab-panel">
        <EnhancedVisualization />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFilterStore } from '@/stores/filterStore'
import FileImporter from './FileImporter.vue'
import FilterDesign from './FilterDesign.vue'
import RangeEditor from './RangeEditor.vue'
import ExportPanel from './ExportPanel.vue'
import EnhancedVisualization from './EnhancedVisualization.vue'

const store = useFilterStore()
const activeTab = ref('import')

const tabs = computed(() => [
  {
    id: 'import',
    label: 'Import',
    icon: '📁',
    disabled: false
  },
  {
    id: 'filter-design',
    label: 'Filter Design',
    icon: '🎛️',
    disabled: !store.hasTRFData
  },
  {
    id: 'range-editor',
    label: 'Range Editor',
    icon: '📊',
    disabled: false
  },
  {
    id: 'export',
    label: 'Export',
    icon: '💾',
    disabled: !store.hasCoefficients
  },
  {
    id: 'visualization',
    label: 'Visualization',
    icon: '📈',
    disabled: false
  }
])
</script>

<style scoped>
.tabbed-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
}

.tab-navigation {
  display: flex;
  background: #2a2a2a;
  border-bottom: 1px solid #444;
  overflow-x: auto;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  color: #888;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  border-bottom: 3px solid transparent;
}

.tab-button:hover:not(:disabled) {
  color: #ccc;
  background: rgba(100, 108, 255, 0.1);
}

.tab-button.active {
  color: #646cff;
  background: rgba(100, 108, 255, 0.15);
  border-bottom-color: #646cff;
}

.tab-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab-content {
  flex: 1;
  overflow: hidden;
}

.tab-panel {
  height: 100%;
  overflow-y: auto;
  padding: 1rem;
}

.no-data-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  background: rgba(100, 108, 255, 0.05);
  border: 2px dashed #444;
  border-radius: 8px;
  color: #888;
  font-size: 1.1em;
}

.no-data-message p {
  margin: 0;
  text-align: center;
}

/* Responsive design */
@media (max-width: 768px) {
  .tab-navigation {
    flex-wrap: wrap;
  }
  
  .tab-button {
    padding: 0.5rem 1rem;
    font-size: 0.8em;
  }
}
</style> 