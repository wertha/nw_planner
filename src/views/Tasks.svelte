<script>
  import { onMount } from 'svelte'
  import api from '../services/api.js'
  import TaskModal from '../components/TaskModal.svelte'
  
  let loading = true
  let tasks = []
  let error = null
  let showModal = false
  let editingTask = null
  
  // Characters and their assigned tasks (with completion status)
  let characters = []
  let charactersLoading = true
  let characterTasks = {} // { [characterId]: TaskWithStatus[] }
  let characterRowEl = null
  
  onMount(async () => {
    await Promise.all([loadTasks(), loadCharactersAndTasks()])
  })
  
  async function loadTasks() {
    loading = true
    error = null
    try {
      tasks = await api.getTasks()
    } catch (err) {
      console.error('Error loading tasks:', err)
      error = 'Failed to load tasks. Please try again.'
    } finally {
      loading = false
    }
  }
  
  async function loadCharactersAndTasks() {
    charactersLoading = true
    try {
      characters = await api.getActiveCharacters()
      const map = {}
      for (const c of characters) {
        try {
          map[c.id] = await api.getCharacterTasks(c.id)
        } catch (err) {
          console.error('Error loading character tasks:', c, err)
          map[c.id] = []
        }
      }
      characterTasks = map
    } catch (err) {
      console.error('Error loading characters:', err)
      characters = []
      characterTasks = {}
    } finally {
      charactersLoading = false
    }
  }

  function openCreate() {
    editingTask = null
    showModal = true
  }

  function openEdit(task) {
    editingTask = task
    showModal = true
  }

  async function handleSave(event) {
    const data = event.detail
    try {
      if (editingTask) {
        // Update task then assignments
        const { assignments, ...taskData } = data
        const updated = await api.updateTask(editingTask.id, taskData)
        if (assignments) {
          await api.setTaskAssignments(editingTask.id, assignments)
        }
      } else {
        // Create task then assignments
        const { assignments, ...taskData } = data
        const created = await api.createTask(taskData)
        if (created?.id && assignments) {
          await api.setTaskAssignments(created.id, assignments)
        }
      }
      showModal = false
      editingTask = null
      await Promise.all([loadTasks(), loadCharactersAndTasks()])
    } catch (err) {
      console.error('Error saving task:', err)
    }
  }

  async function handleDelete(event) {
    const id = event.detail
    try {
      await api.deleteTask(id)
      showModal = false
      editingTask = null
      await Promise.all([loadTasks(), loadCharactersAndTasks()])
    } catch (err) {
      console.error('Error deleting task:', err)
    }
  }
  
  async function toggleCharacterTask(characterId, task) {
    try {
      if (task.completed) {
        await api.markTaskIncomplete(task.id, characterId, task.resetPeriod)
      } else {
        await api.markTaskComplete(task.id, characterId, task.resetPeriod)
      }
      // Reload just this character's tasks
      const updated = await api.getCharacterTasks(characterId)
      characterTasks = { ...characterTasks, [characterId]: updated }
    } catch (err) {
      console.error('Error toggling character task:', err)
    }
  }

  function handleCharacterWheel(event) {
    const el = characterRowEl
    if (!el) return
    const canScrollHorizontally = el.scrollWidth > el.clientWidth
    if (!canScrollHorizontally) return
    // Convert vertical wheel to horizontal scroll within the row
    if (Math.abs(event.deltaY) >= Math.abs(event.deltaX)) {
      el.scrollLeft += event.deltaY
      event.preventDefault()
    }
  }

  async function deleteTaskItem(task) {
    try {
      const confirmed = confirm(`Delete task "${task.name}"?`)
      if (!confirmed) return
      await api.deleteTask(task.id)
      await Promise.all([loadTasks(), loadCharactersAndTasks()])
    } catch (err) {
      console.error('Error deleting task:', err)
    }
  }
</script>

<div class="max-w-7xl mx-auto min-w-0">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Tasks</h1>
    <p class="text-gray-600 dark:text-gray-400">Manage your daily and weekly tasks.</p>
  </div>

  <!-- Row 1: Character Cards (horizontal scroll) -->
  <div class="mb-6">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Assigned Tasks by Character</h2>
    {#if charactersLoading}
      <div class="flex items-center justify-center h-32">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-nw-blue"></div>
      </div>
    {:else if characters.length === 0}
      <div class="text-center text-gray-600 dark:text-gray-400">No active characters. Create a character to begin assigning tasks.</div>
    {:else}
      <div class="overflow-x-auto min-w-0" bind:this={characterRowEl} on:wheel={handleCharacterWheel}>
        <div class="flex gap-4 w-max">
        {#each characters as c}
          <div class="w-72 shrink-0 card">
            <div class="flex items-center justify-between mb-2">
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">{c.name}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">{c.server_name}</p>
              </div>
            </div>
            {#if (characterTasks[c.id] || []).length === 0}
              <div class="text-sm text-gray-500 dark:text-gray-400">No tasks assigned</div>
            {:else}
              <!-- Dailies -->
              <div class="mb-3">
                <div class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Daily</div>
                <div class="space-y-2">
                  {#each (characterTasks[c.id] || []).filter(t => t.type === 'daily') as t}
                    <div class="flex items-center justify-between">
                      <label class="flex items-center space-x-2">
                        <input type="checkbox" checked={t.completed} on:change={() => toggleCharacterTask(c.id, t)} class="w-4 h-4 text-nw-blue border-gray-300 rounded focus:ring-nw-blue dark:bg-gray-700 dark:border-gray-600" />
                        <span class="text-sm text-gray-900 dark:text-gray-100 {t.completed ? 'line-through opacity-60' : ''}">{t.name}</span>
                      </label>
                      <span class="text-xs priority-{t.priority.toLowerCase()}">{t.priority}</span>
                    </div>
                  {/each}
                </div>
              </div>
              <!-- Weeklies -->
              <div>
                <div class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Weekly</div>
                <div class="space-y-2">
                  {#each (characterTasks[c.id] || []).filter(t => t.type === 'weekly') as t}
                    <div class="flex items-center justify-between">
                      <label class="flex items-center space-x-2">
                        <input type="checkbox" checked={t.completed} on:change={() => toggleCharacterTask(c.id, t)} class="w-4 h-4 text-nw-blue border-gray-300 rounded focus:ring-nw-blue dark:bg-gray-700 dark:border-gray-600" />
                        <span class="text-sm text-gray-900 dark:text-gray-100 {t.completed ? 'line-through opacity-60' : ''}">{t.name}</span>
                      </label>
                      <span class="text-xs priority-{t.priority.toLowerCase()}">{t.priority}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Row 2: Master Task Library (vertical scroll) -->
  <div class="mb-4 flex items-center justify-between">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Task Library</h2>
    <div class="space-x-2">
      <button class="btn-secondary" on:click={async () => { await api.initializeDefaultTasks(); await Promise.all([loadTasks(), loadCharactersAndTasks()]) }}>Import Defaults</button>
      <button class="btn-primary" on:click={openCreate}>Add New Task</button>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center h-40">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-nw-blue"></div>
    </div>
  {:else if error}
    <div class="text-center py-8">
      <div class="text-red-600 dark:text-red-400 mb-4">{error}</div>
      <button on:click={() => Promise.all([loadTasks(), loadCharactersAndTasks()])} class="btn btn-primary">
        Try Again
      </button>
    </div>
  {:else}
    <div class="max-h-[60vh] overflow-y-auto space-y-2">
      {#if tasks.length === 0}
        <div class="text-center text-gray-600 dark:text-gray-400 py-8">No tasks found.</div>
      {:else}
        {#each tasks as task}
          <div class="border border-gray-200 dark:border-gray-700 rounded px-3 py-2 flex items-center justify-between">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[32rem]">{task.name}</h3>
                <span class="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{task.type}</span>
                <span class="text-xs priority-{task.priority.toLowerCase()}">{task.priority}</span>
              </div>
              {#if task.description}
                <p class="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[48rem]">{task.description}</p>
              {/if}
            </div>
            <div class="flex items-center gap-2 ml-4 flex-shrink-0">
              <button class="btn-secondary text-xs" on:click={() => openEdit(task)}>Edit</button>
              <button class="btn-danger text-xs" on:click={() => deleteTaskItem(task)}>Delete</button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}

  <TaskModal isOpen={showModal} task={editingTask} on:save={handleSave} on:delete={handleDelete} on:close={() => { showModal = false; editingTask = null }} />
</div> 