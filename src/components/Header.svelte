<script>
  import { onMount } from 'svelte'
  import { selectedCharacters, darkMode } from '../stores/ui'
  import api from '../services/api.js'
  import ServerTimeDisplay from './ServerTimeDisplay.svelte'
  
  let characters = []
  let selectedCharacterIds = []
  let darkModeEnabled = false
  let loading = true
  let selectedCharacterServers = []
  
  onMount(async () => {
    await loadCharacters()
    
    // Subscribe to stores
    const unsubscribeSelected = selectedCharacters.subscribe(value => {
      selectedCharacterIds = value
    })
    
    const unsubscribeDark = darkMode.subscribe(value => {
      darkModeEnabled = value
      // Apply dark mode to document
      if (darkModeEnabled) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    })
    
    return () => {
      unsubscribeSelected()
      unsubscribeDark()
    }
  })
  
  async function loadCharacters() {
    loading = true
    try {
      characters = await api.getActiveCharacters()
      
      // If no characters are selected, select the first one by default
      if (selectedCharacterIds.length === 0 && characters.length > 0) {
        selectedCharacters.set([characters[0].id])
      }
    } catch (error) {
      console.error('Error loading characters:', error)
    } finally {
      loading = false
    }
  }
  
  function toggleDarkMode() {
    darkMode.update(value => !value)
  }
  
  function toggleCharacterSelection(characterId) {
    selectedCharacters.update(selected => {
      if (selected.includes(characterId)) {
        return selected.filter(id => id !== characterId)
      } else {
        return [...selected, characterId]
      }
    })
  }

  // Update selected character servers when selection changes
  $: {
    if (characters.length > 0 && selectedCharacterIds.length > 0) {
      const selected = characters.filter(c => selectedCharacterIds.includes(c.id))
      selectedCharacterServers = [...new Set(selected.map(c => c.server_name))]
    } else {
      selectedCharacterServers = []
    }
  }
</script>

<header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
  <div class="flex items-center justify-between">
    <!-- App Title -->
    <div class="flex items-center space-x-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        New World Planner
      </h1>
      <span class="text-sm text-gray-500 dark:text-gray-400">
        v1.0.0
      </span>
    </div>
    
    <!-- Center - Character Selector -->
    <div class="flex items-center space-x-4">
      <div class="relative">
        <label for="character-selector" class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Active Characters
        </label>
        <div class="flex space-x-2">
          {#each characters as character}
            <button
              class="px-3 py-1 text-sm rounded-md border {
                selectedCharacterIds.includes(character.id)
                  ? 'bg-nw-blue text-white border-nw-blue'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              } transition-colors"
              on:click={() => toggleCharacterSelection(character.id)}
            >
              <span class="faction-{character.faction.toLowerCase()}">●</span>
              {character.name}
              <span class="text-xs opacity-75">({character.server_name})</span>
            </button>
          {/each}
        </div>
      </div>
    </div>
    
    <!-- Right - Settings and Dark Mode -->
    <div class="flex items-center space-x-4">
      <button
        class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        on:click={toggleDarkMode}
        title="Toggle dark mode"
      >
        {#if darkModeEnabled}
          <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
        {:else}
          <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
          </svg>
        {/if}
      </button>
      
      <!-- Server Time Displays -->
      {#if selectedCharacterServers.length > 0}
        <div class="flex space-x-4">
          {#each selectedCharacterServers as serverName}
            <div class="text-right min-w-[120px]">
              <ServerTimeDisplay 
                {serverName} 
                showResetTimers={false} 
                showServerTime={true} 
                size="small" 
              />
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <div class="text-right">
            <div class="font-medium">Local Time</div>
            <div class="text-xs">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</header>

<style>
  .faction-factionless {
    color: #6b7280; /* gray-500 */
  }
  
  .faction-marauders {
    color: #dc2626;
  }
  
  .faction-covenant {
    color: #eab308;
  }
  
  .faction-syndicate {
    color: #7c3aed;
  }
</style> 