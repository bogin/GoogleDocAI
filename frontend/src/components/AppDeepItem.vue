<template>
  <div class="deep-item">
    <template v-if="isArray(value)">
      <div class="array-container">
        <div
          v-for="(item, index) in value"
          :key="index"
          class="array-item"
          :class="{ highlighted: isHighlighted(item) }"
        >
          <div class="array-header" @click="toggleExpand(`array-${index}`)">
            <span class="expand-icon">
              <AppIcon
                :type="
                  expandedItems[`array-${index}`]
                    ? 'expendOpen'
                    : 'expendClosed'
                "
              />
            </span>
            <span class="array-title">{{ getItemTitle(item) }}</span>
          </div>
          <div v-show="expandedItems[`array-${index}`]" class="array-content">
            <div v-for="(val, key) in item" :key="key" class="object-row">
              <span class="object-key">{{ formatKey(`${key}`) }}:</span>
              <AppDeepItem
                v-if="isObject(val)"
                :value="val ?? '-'"
                :searchTerm="searchTerm"
                :level="level + 1"
              />
              <span
                v-else
                class="object-value"
                :class="{ highlighted: isValueHighlighted(val) }"
              >
                {{ formatValue(val) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="isObject(value)">
      <div class="object-container" :style="{ marginLeft: `${level * 16}px` }">
        <div v-for="(val, key) in value" :key="key" class="object-row">
          <span class="object-key">{{ formatKey(`${key}`) }}:</span>
          <AppDeepItem
            v-if="isObject(val)"
            :value="val ?? '-'"
            :searchTerm="searchTerm"
            :level="level + 1"
          />
          <span
            v-else
            class="object-value"
            :class="{ highlighted: isValueHighlighted(val) }"
          >
            {{ formatValue(val) }}
          </span>
        </div>
      </div>
    </template>

    <template v-else>
      <span
        class="simple-value"
        :class="{ highlighted: isValueHighlighted(value) }"
      >
        {{ formatValue(value) }}
      </span>
    </template>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, PropType } from 'vue'
import AppIcon from './AppIcon.vue'

export default defineComponent({
  name: 'AppDeepItem',

  components: {
    AppIcon,
  },

  props: {
    value: {
      type: [Object, Array, String, Number, Boolean] as PropType<any>,
      required: true,
    },
    searchTerm: {
      type: String,
      default: '',
    },
    level: {
      type: Number,
      default: 0,
    },
  },

  setup(props) {
    const expandedItems = ref<Record<string, boolean>>({})

    const isObject = (val: any): boolean => {
      return val !== null && typeof val === 'object' && !Array.isArray(val)
    }

    const isArray = (val: any): boolean => {
      return Array.isArray(val)
    }

    const formatKey = (key: string): string => {
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
    }

    const formatValue = (value: any): string => {
      if (value === null || value === undefined) return '-'
      return String(value)
    }

    const toggleExpand = (id: string) => {
      expandedItems.value[id] = !expandedItems.value[id]
    }

    const getItemTitle = (item: any): string => {
      if (item.name) return item.name
      if (item.displayName) return item.displayName
      if (item.email) return item.email
      if (item.id) return `ID: ${item.id}`
      return 'Item'
    }

    const isValueHighlighted = (value: any): boolean => {
      if (!value || !props.searchTerm) return false
      return String(value)
        .toLowerCase()
        .includes(props.searchTerm.toLowerCase())
    }

    const isHighlighted = (item: any): boolean => {
      if (!props.searchTerm) return false
      return JSON.stringify(item)
        .toLowerCase()
        .includes(props.searchTerm.toLowerCase())
    }

    return {
      expandedItems,
      isObject,
      isArray,
      formatKey,
      formatValue,
      toggleExpand,
      getItemTitle,
      isValueHighlighted,
      isHighlighted,
    }
  },
})
</script>

<style lang="scss" scoped>
.deep-item {
  width: 100%;
}

.array-container {
  width: 100%;
}

.array-item {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 8px;
  background: white;

  &.highlighted {
    background-color: #fff3e0;
  }
}

.array-header {
  padding: 8px;
  display: flex;
  align-items: center;
  cursor: pointer;

  &:hover {
    background-color: #f5f5f5;
  }

  .expand-icon {
    margin-right: 8px;
    font-size: 12px;
    color: #666;
  }

  .array-title {
    font-weight: 500;
    color: #1a73e8;
  }
}

.array-content {
  padding: 8px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.object-container {
  padding: 4px 0;
}

.object-row {
  display: flex;
  padding: 4px 0;
  font-size: 14px;
  align-items: flex-start;

  .object-key {
    min-width: 120px;
    color: #666;
    font-weight: 500;
    padding-right: 8px;
  }

  .object-value {
    flex: 1;
    color: #333;
    word-break: break-word;
    font-family: monospace;

    &.highlighted {
      background-color: #fff3e0;
    }
  }
}

.simple-value {
  color: #333;
  word-break: break-word;
  font-family: monospace;

  &.highlighted {
    background-color: #fff3e0;
  }
}

.highlighted {
  background-color: #fff3e0;
}
</style>
