<script>
  import { createEventDispatcher } from 'svelte'
  import api from '../services/api.js'
  
  export let server = null // null for create, server object for edit
  export let isOpen = false
  
  const dispatch = createEventDispatcher()
  
  // Form data
  let formData = {
    name: '',
    region: '',
    timezone: '',
    active_status: true
  }
  
  // Available regions
  const regions = [
    'AP Southeast',
    'SA East', 
    'US West',
    'US East',
    'EU Central'
  ]
  
  // Common timezones for each region
  const timezonesByRegion = {
    'AP Southeast': [
      'Australia/Sydney',
      'Australia/Melbourne',
      'Asia/Singapore',
      'Asia/Hong_Kong',
      'Asia/Tokyo'
    ],
    'SA East': [
      'America/Sao_Paulo',
      'America/Argentina/Buenos_Aires',
      'America/Montevideo'
    ],
    'US West': [
      'America/Los_Angeles',
      'America/Denver',
      'America/Phoenix'
    ],
    'US East': [
      'America/New_York',
      'America/Chicago',
      'America/Toronto'
    ],
    'EU Central': [
      'Europe/Berlin',
      'Europe/Paris',
      'Europe/Rome',
      'Europe/Amsterdam',
      'Europe/London'
    ]
  }
  
  let loading = false
  let errors = {}
  
  // Prevent re-initializing form while typing; re-init only when opening or switching target server
  let initializedForId = null
  
  // Initialize form data when modal opens or server changes
  $: if (isOpen) {
    const currentTargetId = server?.id ?? '__create__'
    if (initializedForId !== currentTargetId) {
      if (server) {
        // Edit mode
        formData = {
          name: server.name || '',
          region: server.region || '',
          timezone: server.timezone || '',
          active_status: server.active_status !== undefined ? server.active_status : true
        }
      } else {
        // Create mode
        formData = {
          name: '',
          region: '',
          timezone: '',
          active_status: true
        }
      }
      errors = {}
      initializedForId = currentTargetId
    }
  }
  
  // Auto-set common timezone when region changes
  $: if (formData.region && timezonesByRegion[formData.region]) {
    if (!formData.timezone || !timezonesByRegion[formData.region].includes(formData.timezone)) {
      formData.timezone = timezonesByRegion[formData.region][0]
    }
  }
  
  // Get available timezones for current region
  $: availableTimezones = formData.region ? timezonesByRegion[formData.region] : []
  
  function validateForm() {
    errors = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Server name is required'
    }
    
    if (!formData.region) {
      errors.region = 'Region is required'
    }
    
    if (!formData.timezone) {
      errors.timezone = 'Timezone is required'
    }
    
    return Object.keys(errors).length === 0
  }
  
  async function handleSubmit() {
    if (!validateForm()) return
    
    loading = true
    try {
      if (server) {
        // Update existing server
        await api.updateServer(server.id, formData)
      } else {
        // Create new server
        await api.createServer(formData)
      }
      
      dispatch('saved')
      dispatch('close')
    } catch (error) {
      console.error('Error saving server:', error)
      errors.submit = error.message || 'Failed to save server'
    } finally {
      loading = false
    }
  }
  
  function handleClose() {
    initializedForId = null
    dispatch('close')
  }
  
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      handleClose()
    }
  }
</script>

{#if isOpen}
  <!-- Modal backdrop -->
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" on:click={handleClose} on:keydown={handleKeydown}>
    <!-- Modal content -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4" role="document" on:click|stopPropagation on:keydown|stopPropagation>
      <div class="p-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {server ? 'Edit Server' : 'Add Server'}
        </h2>
        
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
  <!-- Server Name -->
  <div>
    <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Server Name *
    </label>
    <input
      id="name"
      type="text"
      bind:value={formData.name}
      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-nw-blue focus:border-nw-blue dark:bg-gray-700 dark:text-white"
      class:border-red-500={errors.name}
      placeholder="Enter server name"
      required
    />
    {#if errors.name}
      <p class="mt-1 text-sm text-red-600">{errors.name}</p>
    {/if}
  </div>
  
  <!-- Region -->
  <div>
    <label for="region" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Region *
    </label>
    <select
      id="region"
      bind:value={formData.region}
      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-nw-blue focus:border-nw-blue dark:bg-gray-700 dark:text-white"
      class:border-red-500={errors.region}
      required
    >
      <option value="">Select a region</option>
      {#each regions as region}
        <option value={region}>{region}</option>
      {/each}
    </select>
    {#if errors.region}
      <p class="mt-1 text-sm text-red-600">{errors.region}</p>
    {/if}
  </div>
  
  <!-- Timezone -->
  <div>
    <label for="timezone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Timezone *
    </label>
    <select
      id="timezone"
      bind:value={formData.timezone}
      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-nw-blue focus:border-nw-blue dark:bg-gray-700 dark:text-white"
      class:border-red-500={errors.timezone}
      disabled={!formData.region}
      required
    >
      <option value="">Select a timezone</option>
      {#each availableTimezones as timezone}
        <option value={timezone}>{timezone}</option>
      {/each}
    </select>
    {#if errors.timezone}
      <p class="mt-1 text-sm text-red-600">{errors.timezone}</p>
    {/if}
  </div>
  
  <!-- Active Status -->
  <div>
    <label class="flex items-center">
      <input
        type="checkbox"
        bind:checked={formData.active_status}
        class="rounded border-gray-300 text-nw-blue focus:ring-nw-blue dark:border-gray-600 dark:bg-gray-700"
      />
      <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
    </label>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      Active servers will be available for character and event selection
    </p>
  </div>
  
  <!-- Submit Error -->
  {#if errors.submit}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
      <p class="text-sm text-red-800 dark:text-red-200">{errors.submit}</p>
    </div>
  {/if}
  
  <!-- Action Buttons -->
  <div class="flex justify-end space-x-3 pt-4">
    <button
      type="button"
      on:click={handleClose}
      class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nw-blue"
      disabled={loading}
    >
      Cancel
    </button>
    <button
      type="submit"
      class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-nw-blue hover:bg-nw-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nw-blue disabled:opacity-50"
      disabled={loading}
    >
      {#if loading}
        <span class="flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Saving...
        </span>
      {:else}
        {server ? 'Update Server' : 'Create Server'}
      {/if}
    </button>
  </div>
</form>
      </div>
    </div>
  </div>
{/if} 