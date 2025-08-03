import { ref } from 'vue'

class EventHub {
  constructor() {
    this.events = ref(new Map())
  }

  on(event, callback) {
    if (!this.events.value.has(event)) {
      this.events.value.set(event, [])
    }
    this.events.value.get(event).push(callback)
  }

  off(event, callback) {
    if (this.events.value.has(event)) {
      const callbacks = this.events.value.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, ...args) {
    if (this.events.value.has(event)) {
      this.events.value.get(event).forEach(callback => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      })
    }
  }

  once(event, callback) {
    const onceCallback = (...args) => {
      this.off(event, onceCallback)
      callback(...args)
    }
    this.on(event, onceCallback)
  }

  clear(event) {
    if (event) {
      this.events.value.delete(event)
    } else {
      this.events.value.clear()
    }
  }
}

export default new EventHub() 