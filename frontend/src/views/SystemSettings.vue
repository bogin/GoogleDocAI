<template>
  <div class="settings-view">
    <!-- Header section remains the same -->
    <header class="settings-header">
      <h1>System Settings</h1>
      <p class="description">
        Manage your application's configuration and integrations
      </p>
    </header>

    <div v-if="isLoading" class="loading">
      <div class="loader"></div>
      <p>Loading settings...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>

      <AppButton
        @click="retryLoad"
        classes="retry-button"
        text="Retry"
      ></AppButton>
    </div>

    <div v-else class="settings-grid">
      <!-- OpenAI Settings Card -->
      <div class="settings-card">
        <div class="card-header">
          <h2>OpenAI Integration</h2>
          <AppButton
            @click="showOpenAIForm = true"
            classes="edit-button"
            text="Edit"
          ></AppButton>
        </div>
        <div class="card-content">
          <h5>One key will work as well</h5>

          <div
            class="setting-item"
            v-for="(key, index) in openAIKeys"
            :key="index"
          >
            <label>{{ key.label }}:</label>
            <span class="masked-value">{{
              maskString(openAISettings?.[key.name])
            }}</span>
          </div>
          <p class="last-updated">
            Last updated:
            {{ formatDate(getSettingByKey('openai')?.updated_at) }}
          </p>
        </div>
      </div>

      <!-- Google Settings Card -->
      <div class="settings-card">
        <div class="card-header">
          <h2>Google Integration</h2>

          <AppButton
            @click="showGoogleForm = true"
            classes="edit-button"
            text="Edit"
          ></AppButton>
        </div>
        <div class="card-content">
          <div class="setting-item">
            <label>Client ID:</label>
            <span class="masked-value">{{
              maskString(googleSettings?.clientId)
            }}</span>
          </div>
          <div class="setting-item">
            <label>Client Secret:</label>
            <span class="masked-value">{{
              maskString(googleSettings?.clientSecret)
            }}</span>
          </div>
          <p class="last-updated">
            Last updated:
            {{ formatDate(getSettingByKey('google')?.updated_at) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Forms remain the same -->
    <DynamicForm
      v-if="showOpenAIForm"
      :show="showOpenAIForm"
      title="OpenAI Settings"
      :form-config="openAIFormConfig"
      :initial-data="openAISettings"
      @update="handleOpenAIUpdate"
      @create="handleOpenAICreate"
      @close="showOpenAIForm = false"
    />

    <DynamicForm
      v-if="showGoogleForm"
      :show="showGoogleForm"
      title="Google Settings"
      :form-config="googleFormConfig"
      :initial-data="googleSettings"
      @update="handleGoogleUpdate"
      @create="handleGoogleCreate"
      @close="showGoogleForm = false"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import DynamicForm from '@/components/DynamicForm.vue'
import type { FormField } from '@/types/formField'
import type { RootState } from '../types/systemSettings'
import AppButton from '@/components/AppButton.vue'

export default defineComponent({
  name: 'SystemSettingsView',

  components: {
    DynamicForm,
    AppButton,
  },

  setup() {
    const store = useStore<RootState>()
    const showOpenAIForm = ref(false)
    const showGoogleForm = ref(false)

    const googleFormConfig: FormField[] = [
      {
        name: 'clientId',
        label: 'Client ID',
        type: 'text',
        required: true,
        placeholder: 'Enter Google Client ID',
      },
      {
        name: 'clientSecret',
        label: 'Client Secret',
        type: 'text',
        required: true,
        placeholder: 'Enter Google Client Secret',
      },
    ]

    const openAIKeys = [
      { name: 'typoKey', label: 'Typo Key' },
      { name: 'analyticsKey', label: 'Analytics Key' },
      { name: 'postgresFilesKey', label: 'Postgres Files Key' },
      { name: 'mongoFilesKey', label: 'Mongo Files Key' },
    ]

    const openAIFormConfig: FormField[] = openAIKeys.map((key) => ({
      name: key.name,
      label: key.label,
      type: 'text',
      required: true,
      placeholder: `Enter ${key.label}`,
    }))

    const handleOpenAIUpdate = async (
      data: Record<string, any>
    ): Promise<void> => {
      try {
        await store.dispatch('systemSettings/updateSettings', {
          key: 'openai',
          value: data,
        })
        showOpenAIForm.value = false
      } catch (error) {
        console.error('Failed to update OpenAI settings:', error)
      }
    }

    const handleOpenAICreate = async (
      data: Record<string, any>
    ): Promise<void> => {
      try {
        await store.dispatch('systemSettings/createSettings', {
          key: 'openai',
          value: data,
        })
        showOpenAIForm.value = false
      } catch (error) {
        console.error('Failed to update OpenAI settings:', error)
      }
    }

    const handleGoogleCreate = async (
      data: Record<string, any>
    ): Promise<void> => {
      try {
        await store.dispatch('systemSettings/createSettings', {
          key: 'google',
          value: data,
        })
        showGoogleForm.value = false
      } catch (error) {
        console.error('Failed to create Google settings:', error)
      }
    }

    const handleGoogleUpdate = async (
      data: Record<string, any>
    ): Promise<void> => {
      try {
        await store.dispatch('systemSettings/updateSettings', {
          key: 'google',
          value: data,
        })
        showGoogleForm.value = false
      } catch (error) {
        console.error('Failed to update Google settings:', error)
      }
    }

    const maskApiKey = (key?: string): string => {
      if (!key) return '••••••••'
      return `${key.slice(0, 2)}-••••${key.slice(-4)}`
    }

    const maskString = (str?: string): string => {
      if (!str) return '••••••••'
      return `${str.slice(0, 4)}••••${str.slice(-4)}`
    }

    const formatDate = (date?: string): string => {
      if (!date) return 'Never'
      return new Date(date).toLocaleString()
    }

    const retryLoad = () => {
      store.dispatch('systemSettings/fetchSettings')
    }

    onMounted(() => {
      store.dispatch('systemSettings/fetchSettings')
    })

    const isLoading = computed(() => store.state.systemSettings?.isLoading)
    const error = computed(() => store.state.systemSettings?.error)
    const openAISettings = computed(
      () => store.getters['systemSettings/getOpenAISettings']
    )
    const googleSettings = computed(
      () => store.getters['systemSettings/getGoogleSettings']
    )
    const getSettingByKey = (key: string) => {
      return store.state.systemSettings?.settings?.find(
        (setting) => setting.key === key
      )
    }

    return {
      isLoading,
      error,
      showOpenAIForm,
      showGoogleForm,
      openAIFormConfig,
      googleFormConfig,
      openAISettings,
      googleSettings,
      openAIKeys,
      handleOpenAICreate,
      handleGoogleCreate,
      getSettingByKey,
      handleOpenAIUpdate,
      handleGoogleUpdate,
      maskApiKey,
      maskString,
      formatDate,
      retryLoad,
    }
  },
})
</script>

<style lang="scss" scoped>
.settings-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.settings-header {
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    color: #1a202c;
    margin-bottom: 0.5rem;
  }

  .description {
    color: #4a5568;
    font-size: 1.1rem;
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.settings-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;

    h2 {
      font-size: 1.25rem;
      color: #2d3748;
      margin: 0;
    }

    .edit-button {
      padding: 0.5rem 1rem;
      background: #1a73e8;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;

      &:hover {
        background: #1557b0;
      }
    }
  }

  .card-content {
    padding: 1.25rem;

    .setting-item {
      margin-bottom: 1rem;

      label {
        display: block;
        color: #4a5568;
        font-weight: 500;
        margin-bottom: 0.25rem;
      }

      .masked-value {
        font-family: monospace;
        background: #f7fafc;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
      }
    }

    .last-updated {
      font-size: 0.875rem;
      color: #718096;
      margin-top: 1rem;
    }
  }
}

.loading {
  text-align: center;
  padding: 2rem;

  .loader {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #1a73e8;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
}

.error-container {
  text-align: center;
  padding: 2rem;

  .error-message {
    color: #e53e3e;
    margin-bottom: 1rem;
  }

  .retry-button {
    padding: 0.5rem 1rem;
    background: #1a73e8;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;

    &:hover {
      background: #1557b0;
    }
  }
}

@media (max-width: 768px) {
  .settings-view {
    padding: 1rem;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
