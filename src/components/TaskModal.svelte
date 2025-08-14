<script>
  import { createEventDispatcher } from 'svelte'
  import api from '../services/api.js'
  
  export let isOpen = false
  export let task = null // null for create
  
  const dispatch = createEventDispatcher()
  
  let formData = {
    name: '',
    description: '',
    type: 'daily',
    priority: 'Medium',
    rewards: ''
  }
  
  let errors = {}
  let initializedForId = null
  
  const taskTypes = ['daily', 'weekly']
  const priorities = ['Low', 'Medium', 'High', 'Critical']
  
  // Assignment state
  let characters = []
  let charactersLoading = false
  let selectedAssignments = []
  
  async function loadCharactersAndAssignments() {
    charactersLoading = true
    try {
      characters = await api.getActiveCharacters()
      if (task?.id) {
        selectedAssignments = await api.getAssignedCharactersForTask(task.id)
      } else {
        selectedAssignments = []
      }
    } catch (e) {
      characters = []
      selectedAssignments = []
    } finally {
      charactersLoading = false
    }
  }
  
  $: if (isOpen) {
    const currentId = task?.id ?? '__create__'
    if (initializedForId !== currentId) {
      if (task) {
        formData = {
          name: task.name || '',
          description: task.description || '',
          type: task.type || 'daily',
          priority: task.priority || 'Medium',
          rewards: task.rewards || ''
        }
      } else {
        formData = {
          name: '',
          description: '',
          type: 'daily',
          priority: 'Medium',
          rewards: ''
        }
      }
      errors = {}
      initializedForId = currentId
      loadCharactersAndAssignments()
    }
  }
  
  function validateForm() {
    errors = {}
    if (!formData.name.trim()) errors.name = 'Task name is required'
    if (!taskTypes.includes(formData.type)) errors.type = 'Invalid type'
    if (!priorities.includes(formData.priority)) errors.priority = 'Invalid priority'
    return Object.keys(errors).length === 0
  }
  
  function toggleAssignment(characterId) {
    if (selectedAssignments.includes(characterId)) {
      selectedAssignments = selectedAssignments.filter(id => id !== characterId)
    } else {
      selectedAssignments = [...selectedAssignments, characterId]
    }
  }
  
  function handleSubmit() {
    if (!validateForm()) return
    dispatch('save', { ...formData, assignments: selectedAssignments })
  }
  
  function handleClose() {
    initializedForId = null
    dispatch('close')
  }
  
  function handleDelete() {
    if (task?.id && confirm('Delete this task?')) {
      dispatch('delete', task.id)
    }
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" on:click={handleClose}>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4" role="document" on:click|stopPropagation>
      <div class="p-6 space-y-4">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{task ? 'Edit Task' : 'Create Task'}</h2>
        
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Name *</label>
            <input id="name" type="text" bind:value={formData.name} class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-nw-blue focus:border-nw-blue dark:bg-gray-700 dark:text-white" class:border-red-500={errors.name} required />
            {#if errors.name}
              <p class="mt-1 text-sm text-red-600">{errors.name}</p>
            {/if}
          </div>
          
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea id="description" rows="3" bind:value={formData.description} class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-nw-blue focus:border-nw-blue dark:bg-gray-700 dark:text-white" />
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
              <select id="type" bind:value={formData.type} class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-nw-blue focus:border-nw-blue dark:bg-gray-700 dark:text-white" required>
                {#each taskTypes as t}
                  <option value={t}>{t}</option>
                {/each}
              </select>
            </div>
            <div>
              <label for="priority" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority *</label>
              <select id="priority" bind:value={formData.priority} class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-nw-blue focus:border-nw-blue dark:bg-gray-700 dark:text-white" required>
                {#each priorities as p}
                  <option value={p}>{p}</option>
                {/each}
              </select>
            </div>
          </div>
          
          <div>
            <label for="rewards" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rewards</label>
            <input id="rewards" type="text" bind:value={formData.rewards} class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-nw-blue focus:border-nw-blue dark:bg-gray-700 dark:text-white" />
          </div>

          <!-- Assignments -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Assignments</label>
              {#if charactersLoading}
                <span class="text-xs text-gray-500">Loading...</span>
              {/if}
            </div>
            {#if characters.length === 0}
              <p class="text-sm text-gray-500 dark:text-gray-400">No active characters. Create characters first to assign tasks.</p>
            {:else}
              <div class="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded p-2 space-y-2">
                {#each characters as c}
                  <label class="flex items-center space-x-2">
                    <input type="checkbox" checked={selectedAssignments.includes(c.id)} on:change={() => toggleAssignment(c.id)} class="rounded border-gray-300 text-nw-blue focus:ring-nw-blue dark:border-gray-600 dark:bg-gray-700" />
                    <span class="text-sm text-gray-800 dark:text-gray-200">{c.name} <span class="text-gray-500 dark:text-gray-400">({c.server_name})</span></span>
                  </label>
                {/each}
              </div>
            {/if}
          </div>
          
          {#if errors.submit}
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p class="text-sm text-red-800 dark:text-red-200">{errors.submit}</p>
            </div>
          {/if}
          
          <div class="flex justify-between pt-2">
            {#if task}
              <button type="button" on:click={handleDelete} class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">Delete</button>
            {/if}
            <div class="ml-auto space-x-2">
              <button type="button" on:click={handleClose} class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700">Cancel</button>
              <button type="submit" class="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-nw-blue">{task ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}


