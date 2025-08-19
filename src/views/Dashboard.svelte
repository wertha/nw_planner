<script>
  import { onMount } from 'svelte'
  import api from '../services/api.js'
  
  let loading = true
  let characters = []
  let displayedTasks = []
  let upcomingEvents = []
  let resetTimers = {}
  let activeTimers = []
  let selectedCharacterServers = [] // array of { name, timezone }
  let selectedCharacterId = null
  
  onMount(async () => {
    await loadData()
    startResetTimers()
    
    // Cleanup on unmount
    return () => {
      stopAllTimers()
    }
  })
  
  async function loadData() {
    loading = true
    try {
      // Load characters
      characters = await api.getActiveCharacters()
      
      // Load tasks for selected character (default to first)
      if (characters.length > 0) {
        if (!selectedCharacterId) selectedCharacterId = characters[0].id
        const characterTasks = await api.getCharacterTasks(selectedCharacterId)
        displayedTasks = characterTasks
        
        // Extract unique servers from characters with timezone
        const pairs = characters.map(c => ({ name: c.server_name, timezone: c.server_timezone }))
        const byKey = new Map()
        for (const p of pairs) {
          if (!p.name || !p.timezone) continue
          const key = `${p.name}|${p.timezone}`
          if (!byKey.has(key)) byKey.set(key, p)
        }
        selectedCharacterServers = Array.from(byKey.values())
      }
      
      // Load upcoming events
      try {
        const events = await api.getUpcomingEvents(5)
        upcomingEvents = events.map(event => ({
          ...event,
          time: new Date(event.event_time).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          server: event.server_name || 'Unknown'
        }))
      } catch (error) {
        console.error('Error loading events:', error)
        upcomingEvents = []
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      loading = false
    }
  }

  async function startResetTimers() {
    // Start timers for all unique servers from active characters
    if (selectedCharacterServers.length > 0) {
      try {
        // Get initial reset timer data
        const resetData = await api.getResetTimersForServers(selectedCharacterServers)
        
        // Initialize reset timers object
        resetData.forEach(data => {
          if (!data.error) {
            resetTimers[data.server] = {
              daily: data.daily,
              weekly: data.weekly,
              serverTime: data.serverTime
            }
          }
        })
        
        // Start live timers for each server
        for (const srv of selectedCharacterServers) {
          const timerId = await api.startResetTimerForServer(srv, (timerData) => {
            // Update the reactive variable when timer updates
            resetTimers[timerData.server] = {
              daily: timerData.daily,
              weekly: timerData.weekly,
              serverTime: timerData.serverTime
            }
            // Trigger reactivity
            resetTimers = { ...resetTimers }
          })
          
          if (timerId) {
            activeTimers.push(timerId)
          }
        }
      } catch (error) {
        console.error('Error starting reset timers:', error)
      }
    }
  }

  function stopAllTimers() {
    activeTimers.forEach(timerId => {
      api.stopResetTimer(timerId)
    })
    activeTimers = []
  }

  async function toggleTaskCompletion(task) {
    if (!selectedCharacterId) return
    
    try {
      if (task.completed) {
        await api.markTaskIncomplete(task.id, selectedCharacterId, task.resetPeriod)
      } else {
        await api.markTaskComplete(task.id, selectedCharacterId, task.resetPeriod)
      }
      
      // Reload tasks to update the UI
      await loadTasksForCharacter(selectedCharacterId)
    } catch (error) {
      console.error('Error toggling task completion:', error)
    }
  }

  async function loadTasksForCharacter(characterId) {
    try {
      selectedCharacterId = characterId
      if (!characterId) { displayedTasks = []; return }
      const characterTasks = await api.getCharacterTasks(characterId)
      displayedTasks = characterTasks
    } catch (e) {
      displayedTasks = []
    }
  }
</script>

<div class="max-w-7xl mx-auto">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
    <p class="text-gray-600 dark:text-gray-400">Welcome back! Here's your New World overview.</p>
  </div>
  
  {#if loading}
    <div class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-nw-blue"></div>
    </div>
  {:else}
    
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left column: Upcoming Events above Tasks -->
      <div class="lg:col-span-2 space-y-6">
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Upcoming Events</h2>
          {#if upcomingEvents.length > 0}
            <div class="space-y-2">
              {#each upcomingEvents as event}
                <div class="p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900 dark:text-white text-sm">{event.name}</span>
                        <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{event.event_type}</span>
                      </div>
                      <div class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        📅 {event.time} - {event.server}
                        {#if event.location} • 📍 {event.location}{/if}
                      </div>
                      {#if event.description}
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">{event.description}</div>
                      {/if}
                    </div>
                    <div class="ml-3">
                      <span class="text-[10px] px-1.5 py-0.5 rounded-full {
                        event.participation_status === 'Confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                        event.participation_status === 'Signed Up' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' :
                        event.participation_status === 'Tentative' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }">{event.participation_status || 'No RSVP'}</span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-center text-gray-500 dark:text-gray-400 py-4">
              <p class="text-sm">No upcoming events</p>
              <button class="mt-2 text-sm text-nw-blue hover:text-nw-blue-dark" on:click={() => window.location.hash = '#/events'}>Create your first event →</button>
            </div>
          {/if}
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h2>
            <div class="flex items-center gap-2">
              <label for="dash-character" class="text-xs text-gray-600 dark:text-gray-400">Character</label>
              <select id="dash-character" bind:value={selectedCharacterId} on:change={(e)=> loadTasksForCharacter(parseInt(e.target.value))} class="select-input text-xs">
                {#each characters as c}
                  <option value={c.id}>{c.name}</option>
                {/each}
              </select>
            </div>
          </div>
          <div class="space-y-2">
            {#each displayedTasks as task}
              <div class="flex items-center justify-between p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                <div class="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={task.completed}
                    on:change={() => toggleTaskCompletion(task)}
                    class="w-4 h-4 text-nw-blue border-gray-300 rounded focus:ring-nw-blue dark:focus:ring-nw-blue dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <div class="flex flex-col">
                    <span class="text-sm text-gray-900 dark:text-white {task.completed ? 'line-through opacity-50' : ''}">{task.name}</span>
                    <span class="text-[10px] text-gray-500 dark:text-gray-400">{task.type}</span>
                  </div>
                </div>
                <span class="text-xs priority-{task.priority.toLowerCase()}">{task.priority}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
      
      <!-- Reset Timers -->
      <div class="space-y-6">
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Reset Timers</h2>
          
          {#if Object.keys(resetTimers).length > 0}
            <div class="space-y-4">
              {#each Object.entries(resetTimers) as [serverName, timers]}
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <h3 class="text-xs font-medium text-gray-700 dark:text-gray-300">{serverName}</h3>
                    <div class="text-[10px] text-gray-500 dark:text-gray-400">
                      {timers.serverTime ? `${timers.serverTime.time} ${timers.serverTime.date}` : ''}
                    </div>
                  </div>
                  
                  <div class="space-y-1">
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-gray-600 dark:text-gray-400">Daily Reset:</span>
                      <div class="text-base font-bold text-nw-blue">
                        {timers.daily ? timers.daily.formatted : '00:00:00'}
                      </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-gray-600 dark:text-gray-400">Weekly Reset:</span>
                      <div class="text-base font-bold text-orange-500">
                        {timers.weekly ? timers.weekly.formatted : '00:00:00'}
                      </div>
                    </div>
                  </div>
                  
                  {#if timers.daily && timers.daily.totalMs <= 300000}
                    <div class="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
                      🔄 Daily reset in less than 5 minutes!
                    </div>
                  {/if}
                  
                  {#if timers.weekly && timers.weekly.totalMs <= 1800000}
                    <div class="mt-2 text-xs text-orange-600 dark:text-orange-400 font-medium">
                      🔄 Weekly reset in less than 30 minutes!
                    </div>
                  {/if}
                </div>
                
                {#if Object.entries(resetTimers).length > 1 && serverName !== Object.keys(resetTimers)[Object.keys(resetTimers).length - 1]}
                  <hr class="border-gray-200 dark:border-gray-700" />
                {/if}
              {/each}
            </div>
          {:else}
            <div class="text-center text-gray-500 dark:text-gray-400 py-4">
              <p class="text-sm">Loading reset timers...</p>
              <div class="mt-2">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-nw-blue mx-auto"></div>
              </div>
            </div>
          {/if}
        </div>
        
        <!-- Removed duplicate upcoming events (moved above) -->
      </div>
    </div>
  {/if}
</div> 