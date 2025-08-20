<script>
  import { createEventDispatcher } from 'svelte'
  import { format } from 'date-fns'
  
  export let show = false
  export let editingEvent = null
  export let characters = []
  export let isCreating = false
  
  const dispatch = createEventDispatcher()
  
  // Form data
  let formData = {
    name: '',
    description: '',
    event_type: 'Custom',
    server_name: '',
    event_time: '',
    character_id: null,
    participation_status: 'Signed Up',
    location: '',
    recurring_pattern: null,
    notification_enabled: true,
    notification_minutes: 30,
    timezone: ''
  }
  
  // Validation
  let errors = {}
  let isValid = true
  let initializedForKey = null
  let nameInputEl
  let submitting = false
  
  // Event types
  const eventTypes = [
    'War',
    'Invasion', 
    'Company Event',
    'Expedition',
    'PvP',
    'Crafting',
    'Gathering',
    'Custom'
  ]
  
  // Participation statuses
  const participationStatuses = [
    'Signed Up',
    'Confirmed',
    'Tentative',
    'Absent'
  ]
  
  // Server list is inferred from the selected character; no explicit server dropdown needed
  
  // Reactive initialization guard (prevents form reset on every reactive tick)
  $: if (show) {
    const key = editingEvent?.id ?? '__create__'
    if (initializedForKey !== key) {
      if (editingEvent) {
        populateForm()
      } else {
        resetForm()
      }
      initializedForKey = key
      // focus first input shortly after mount
      setTimeout(() => { if (nameInputEl) nameInputEl.focus() }, 0)
    }
  }
  
  // Reset init guard when modal closes
  $: if (!show) {
    initializedForKey = null
    submitting = false
  }
  
  function populateForm() {
    if (!editingEvent) return
    
    formData = {
      name: editingEvent.name || '',
      description: editingEvent.description || '',
      event_type: editingEvent.event_type || 'Custom',
      server_name: editingEvent.server_name || '',
      event_time: editingEvent.event_time ? formatDateTimeLocal(editingEvent.event_time) : '',
      character_id: editingEvent.character_id || null,
      participation_status: editingEvent.participation_status || 'Signed Up',
      location: editingEvent.location || '',
      recurring_pattern: editingEvent.recurring_pattern || null,
      notification_enabled: editingEvent.notification_enabled !== false,
      notification_minutes: editingEvent.notification_minutes || 30,
      timezone: editingEvent.timezone || ''
    }
    isValid = true
  }
  
  function resetForm() {
    formData = {
      name: '',
      description: '',
      event_type: 'Custom',
      server_name: characters.length > 0 ? characters[0].server_name : '',
      event_time: '',
      character_id: characters.length > 0 ? characters[0].id : null,
      participation_status: 'Signed Up',
      location: '',
      recurring_pattern: null,
      notification_enabled: true,
      notification_minutes: 30,
      timezone: characters.length > 0 ? characters[0].server_timezone : Intl.DateTimeFormat().resolvedOptions().timeZone
    }
    errors = {}
    isValid = true
  }
  
  function formatDateTimeLocal(dateString) {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }
  
  function validateForm() {
    errors = {}
    
    // Required fields
    if (!formData.name.trim()) {
      errors.name = 'Event name is required'
    }
    
    if (!formData.event_type) {
      errors.event_type = 'Event type is required'
    }
    
    if (!formData.event_time) {
      errors.event_time = 'Event time is required'
    }
    
    if (!formData.character_id) {
      errors.character_id = 'Character selection is required'
    }
    
    // Note: allow editing past events; only require presence
    
    // Validate notification minutes
    if (formData.notification_enabled && formData.notification_minutes < 0) {
      errors.notification_minutes = 'Notification minutes must be positive'
    }
    
    isValid = Object.keys(errors).length === 0
    return isValid
  }
  
  function handleSubmit() {
    if (submitting) return
    if (!validateForm()) {
      return
    }
    
    // Format event data for submission
    const eventData = {
      ...formData,
      event_time: new Date(formData.event_time).toISOString(),
      timezone: formData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    }
    
    submitting = true
    dispatch('save', eventData)
  }
  
  function handleCancel() {
    initializedForKey = null
    dispatch('cancel')
  }
  
  async function handleDelete() {
    if (editingEvent && editingEvent.id) {
      const { showConfirm } = await import('../stores/dialog.js')
      const ok = await showConfirm('Are you sure you want to delete this event?', 'Delete Event', 'Delete', 'Cancel')
      if (ok) {
        initializedForKey = null
        dispatch('delete', editingEvent.id)
      }
    }
  }
  
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      handleCancel()
    }
  }
  
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      handleCancel()
    }
  }
  
  // Auto-populate server name when character changes
  function handleCharacterChange() {
    if (formData.character_id) {
      const character = characters.find(c => c.id === parseInt(formData.character_id))
      if (character) {
        formData.server_name = character.server_name
        formData.timezone = character.server_timezone
      }
    }
  }
  
  // Get event type specific defaults
  function handleEventTypeChange() {
    const eventTypeDefaults = {
      'War': {
        location: 'Territory',
        notification_minutes: 60
      },
      'Invasion': {
        location: 'Territory',
        notification_minutes: 60
      },
      'Company Event': {
        location: 'Company Hall',
        notification_minutes: 30
      },
      'Expedition': {
        location: 'Dungeon',
        notification_minutes: 15
      },
      'PvP': {
        location: 'Arena/OPR',
        notification_minutes: 15
      },
      'Crafting': {
        location: 'Settlement',
        notification_minutes: 10
      },
      'Gathering': {
        location: 'Various',
        notification_minutes: 10
      }
    }
    
    const defaults = eventTypeDefaults[formData.event_type]
    if (defaults) {
      if (!formData.location) {
        formData.location = defaults.location
      }
      formData.notification_minutes = defaults.notification_minutes
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" on:click={handleBackdropClick} on:keydown={handleKeydown}>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" role="document" on:click|stopPropagation on:keydown|stopPropagation>
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          {isCreating ? 'Create New Event' : 'Edit Event'}
        </h2>
        <button
          on:click={handleCancel}
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Form -->
      <form id="eventForm" on:submit|preventDefault={handleSubmit} class="p-6 space-y-6">
        <!-- Event Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Event Name *
          </label>
          <input
            type="text"
            id="name"
            bind:this={nameInputEl}
            bind:value={formData.name}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-nw-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Enter event name"
            class:border-red-500={errors.name}
            required
          />
          {#if errors.name}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
          {/if}
        </div>
        
        <!-- Event Type -->
        <div>
          <label for="event_type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Event Type *
          </label>
          <select
            id="event_type"
            bind:value={formData.event_type}
            on:change={handleEventTypeChange}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-nw-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
            class:border-red-500={errors.event_type}
            required
          >
            {#each eventTypes as eventType}
              <option value={eventType}>{eventType}</option>
            {/each}
          </select>
          {#if errors.event_type}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.event_type}</p>
          {/if}
        </div>
        
        <!-- Character (server inferred) -->
        <div>
            <label for="character_id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Character *
            </label>
            <select
              id="character_id"
              bind:value={formData.character_id}
              on:change={handleCharacterChange}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-nw-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
              class:border-red-500={errors.character_id}
              required
            >
              <option value="">Select character</option>
              {#each characters as character}
                <option value={character.id}>{character.name} ({character.server_name})</option>
              {/each}
            </select>
            {#if errors.character_id}
              <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.character_id}</p>
            {/if}
        </div>
        
        <!-- Event Time and Participation Status -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="event_time" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Time *
            </label>
            <input
              type="datetime-local"
              id="event_time"
              bind:value={formData.event_time}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-nw-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
              class:border-red-500={errors.event_time}
              required
            />
            {#if errors.event_time}
              <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.event_time}</p>
            {/if}
          </div>
          
          <div>
            <label for="participation_status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Participation Status
            </label>
            <select
              id="participation_status"
              bind:value={formData.participation_status}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-nw-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {#each participationStatuses as status}
                <option value={status}>{status}</option>
              {/each}
            </select>
          </div>
        </div>
        
        <!-- Location -->
        <div>
          <label for="location" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location
          </label>
          <input
            type="text"
            id="location"
            bind:value={formData.location}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-nw-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Enter location"
          />
        </div>
        
        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            bind:value={formData.description}
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-nw-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Enter event description"
          ></textarea>
        </div>
        
        <!-- Notifications -->
        <div class="space-y-4">
          <div class="flex items-center">
            <input
              type="checkbox"
              id="notification_enabled"
              bind:checked={formData.notification_enabled}
              class="w-4 h-4 text-nw-blue bg-gray-100 border-gray-300 rounded focus:ring-nw-blue focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label for="notification_enabled" class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable notifications
            </label>
          </div>
          
          {#if formData.notification_enabled}
            <div>
              <label for="notification_minutes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notify me (minutes before event)
              </label>
              <input
                type="number"
                id="notification_minutes"
                bind:value={formData.notification_minutes}
                min="0"
                max="1440"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-nw-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
                class:border-red-500={errors.notification_minutes}
              />
              {#if errors.notification_minutes}
                <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.notification_minutes}</p>
              {/if}
            </div>
          {/if}
        </div>
      </form>
      
      <!-- Footer -->
      <div class="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
        <div>
          {#if !isCreating}
            <button
              type="button"
              on:click={handleDelete}
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Delete Event
            </button>
          {/if}
        </div>
        
        <div class="flex items-center space-x-3">
          <button
            type="button"
            on:click={handleCancel}
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-nw-blue focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="eventForm"
            class="px-4 py-2 text-sm font-medium text-white bg-nw-blue rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-60"
            disabled={!isValid || submitting}
          >
            {isCreating ? 'Create Event' : 'Update Event'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Custom scrollbar for modal */
  .overflow-y-auto::-webkit-scrollbar {
    width: 8px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
</style> 