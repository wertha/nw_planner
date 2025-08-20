<script>
  import { createEventDispatcher, onMount } from 'svelte'
  import api from '../services/api.js'
  
  export let isOpen = false
  export let selectedTaskCount = 0
  
  const dispatch = createEventDispatcher()
  
  let characters = []
  let loading = false
  let selectedCharacterIds = []
  
  onMount(loadCharacters)
  
  async function loadCharacters() {
    loading = true
    try {
      characters = await api.getActiveCharacters()
    } catch (e) {
      characters = []
    } finally {
      loading = false
    }
  }
  
  function toggleCharacter(id) {
    if (selectedCharacterIds.includes(id)) {
      selectedCharacterIds = selectedCharacterIds.filter(x => x !== id)
    } else {
      selectedCharacterIds = [...selectedCharacterIds, id]
    }
  }
  
  function handleAssign() {
    if (selectedCharacterIds.length === 0) return
    dispatch('assign', selectedCharacterIds)
  }
  
  function handleClose() {
    dispatch('close')
    selectedCharacterIds = []
  }
  
  function handleKeydown(event) {
    if (event.key === 'Escape') handleClose()
  }

  // Prevent accidental close on selection-drag outside
  let backdropMouseDownOnSelf = false
  function onBackdropMouseDown(e) { backdropMouseDownOnSelf = e.target === e.currentTarget }
  function onBackdropClick(e) { if (e.target === e.currentTarget && backdropMouseDownOnSelf) handleClose() }
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" on:mousedown={onBackdropMouseDown} on:click={onBackdropClick} on:keydown={handleKeydown}>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4" role="document" on:click|stopPropagation on:keydown|stopPropagation>
      <div class="p-6 space-y-4">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Assign to Characters</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">{selectedTaskCount} task{selectedTaskCount === 1 ? '' : 's'} selected</p>
        
        {#if loading}
          <div class="text-sm text-gray-500 dark:text-gray-400">Loading characters...</div>
        {:else if characters.length === 0}
          <div class="text-sm text-gray-500 dark:text-gray-400">No active characters available.</div>
        {:else}
          <div class="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded p-2 space-y-2">
            {#each characters as c}
              <label class="flex items-center space-x-2">
                <input type="checkbox" checked={selectedCharacterIds.includes(c.id)} on:change={() => toggleCharacter(c.id)} class="rounded border-gray-300 text-nw-blue focus:ring-nw-blue dark:border-gray-600 dark:bg-gray-700" />
                <span class="text-sm text-gray-800 dark:text-gray-200">{c.name} <span class="text-gray-500 dark:text-gray-400">({c.server_name})</span></span>
              </label>
            {/each}
          </div>
        {/if}
        
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" on:click={handleClose} class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700">Cancel</button>
          <button type="button" on:click={handleAssign} class="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-nw-blue disabled:opacity-50" disabled={selectedCharacterIds.length === 0}>Assign</button>
        </div>
      </div>
    </div>
  </div>
{/if}


