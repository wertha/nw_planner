<script>
  import { onMount } from 'svelte'
  import api from '../services/api.js'
  import EventModal from '../components/EventModal.svelte'
  
  let loading = true
  let events = []
  let characters = []
  let filterType = 'all'
  let filterCharacter = 'all'
  let showModal = false
  let editingEvent = null
  
  onMount(async () => {
    await loadData()
  })
  
  async function loadData() {
    loading = true
    try {
      // Load events and characters
      const [eventsData, charactersData] = await Promise.all([
        api.getEvents(),
        api.getActiveCharacters()
      ])
      
      events = eventsData
      characters = charactersData
    } catch (error) {
      console.error('Error loading events data:', error)
    } finally {
      loading = false
    }
  }
  
  async function updateRsvpStatus(eventId, newStatus) {
    try {
      await api.updateEventRsvp(eventId, newStatus)
      await loadData() // Reload to get updated data
    } catch (error) {
      console.error('Error updating RSVP:', error)
    }
  }
  
  async function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await api.deleteEvent(eventId)
        await loadData()
      } catch (error) {
        console.error('Error deleting event:', error)
      }
    }
  }

  function openCreate() {
    editingEvent = null
    showModal = true
  }
  function openEdit(ev) {
    editingEvent = ev
    showModal = true
  }
  async function handleSave(e) {
    const data = e.detail
    try {
      if (editingEvent) {
        await api.updateEvent(editingEvent.id, data)
      } else {
        await api.createEvent(data)
      }
      showModal = false
      editingEvent = null
      await loadData()
    } catch (err) {
      console.error('Error saving event:', err)
    }
  }
  
  // Filter events based on type and character
  $: filteredEvents = events.filter(event => {
    const typeMatch = filterType === 'all' || event.event_type === filterType
    const characterMatch = filterCharacter === 'all' || event.character_id == filterCharacter
    return typeMatch && characterMatch
  })
  
  // Get unique event types for filter
  $: eventTypes = [...new Set(events.map(e => e.event_type))].filter(Boolean)
  
  function formatEventTime(eventTime) {
    const date = new Date(eventTime)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  }
  
  function getEventTypeColor(eventType) {
    const colors = {
      'War': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
      'Invasion': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200',
      'Company Event': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
      'Meeting': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
      'Custom': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200'
    }
    return colors[eventType] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
</script>

<div class="max-w-7xl mx-auto">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Events</h1>
    <p class="text-gray-600 dark:text-gray-400">Manage your scheduled events and activities.</p>
  </div>
  
  {#if loading}
    <div class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-nw-blue"></div>
    </div>
  {:else}
    <!-- Action Bar -->
    <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
      <div class="flex space-x-2">
        <button class="btn-primary" on:click={openCreate}>Add New Event</button>
        <button class="btn-secondary" on:click={async () => { try { await api.createWarEvent({ name: 'War', event_time: new Date().toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }) ; await loadData() } catch (e) { console.error('Quick War failed', e) } }}>Quick War</button>
      </div>
      
      <!-- Filters -->
      <div class="flex space-x-3">
        <select bind:value={filterType} class="select-input text-sm">
          <option value="all">All Types</option>
          {#each eventTypes as type}
            <option value={type}>{type}</option>
          {/each}
        </select>
        
        <select bind:value={filterCharacter} class="select-input text-sm">
          <option value="all">All Characters</option>
          {#each characters as character}
            <option value={character.id}>{character.name}</option>
          {/each}
        </select>
      </div>
    </div>
    
    <!-- Events List -->
    {#if filteredEvents.length > 0}
      <div class="space-y-4">
        {#each filteredEvents as event}
          {@const timeData = formatEventTime(event.event_time)}
          <div class="card">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <!-- Event Header -->
                <div class="flex items-center space-x-3 mb-2">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{event.name}</h3>
                  <span class="text-xs px-2 py-1 rounded-full {getEventTypeColor(event.event_type)}">
                    {event.event_type}
                  </span>
                </div>
                
                <!-- Event Details -->
                <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div class="flex items-center space-x-4">
                    <span>📅 {timeData.date} at {timeData.time}</span>
                    {#if event.server_name}
                      <span>🌐 {event.server_name}</span>
                    {/if}
                    {#if event.location}
                      <span>📍 {event.location}</span>
                    {/if}
                  </div>
                  
                  {#if event.description}
                    <div class="text-gray-500 dark:text-gray-400 italic">
                      {event.description}
                    </div>
                  {/if}
                </div>
              </div>
              
              <!-- Actions -->
              <div class="flex items-center space-x-3 ml-4">
                <!-- RSVP Status Dropdown -->
                <select 
                  value={event.participation_status || 'Signed Up'}
                  on:change={(e) => updateRsvpStatus(event.id, e.target.value)}
                  class="text-xs px-2 py-1 rounded border {
                    event.participation_status === 'Confirmed' ? 'bg-green-50 border-green-200 text-green-800' :
                    event.participation_status === 'Signed Up' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                    event.participation_status === 'Tentative' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                    'bg-gray-50 border-gray-200 text-gray-800'
                  }"
                >
                  <option value="Signed Up">Signed Up</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Tentative">Tentative</option>
                  <option value="Absent">Absent</option>
                </select>
                
                <!-- Action Buttons -->
                <div class="flex space-x-1">
                  <button class="btn-secondary text-xs px-2 py-1" on:click={() => openEdit(event)}>Edit</button>
                  <button 
                    class="btn-danger text-xs px-2 py-1"
                    on:click={() => deleteEvent(event.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No events found</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {events.length === 0 ? 'You haven\'t created any events yet.' : 'No events match your current filters.'}
        </p>
        <button class="btn-primary" on:click={openCreate}>Create Your First Event</button>
      </div>
    {/if}
  {/if}
  <EventModal show={showModal} editingEvent={editingEvent} isCreating={!editingEvent} on:save={handleSave} on:cancel={() => { showModal = false; editingEvent = null }} on:delete={async (e) => { try { await api.deleteEvent(e.detail); showModal = false; editingEvent = null; await loadData() } catch (err) { console.error('Delete failed', err) } }} />
</div> 