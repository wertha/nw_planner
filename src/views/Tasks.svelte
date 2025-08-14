<script>
  import { onMount } from 'svelte'
  import api from '../services/api.js'
  import TaskModal from '../components/TaskModal.svelte'
  
  let loading = true
  let tasks = []
  let error = null
  let showModal = false
  let editingTask = null
  
  onMount(async () => {
    await loadTasks()
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
      await loadTasks()
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
      await loadTasks()
    } catch (err) {
      console.error('Error deleting task:', err)
    }
  }
</script>

<div class="max-w-7xl mx-auto">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Tasks</h1>
    <p class="text-gray-600 dark:text-gray-400">Manage your daily and weekly tasks.</p>
  </div>
  
  {#if loading}
    <div class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-nw-blue"></div>
    </div>
  {:else if error}
    <div class="text-center py-12">
      <div class="text-red-600 dark:text-red-400 mb-4">{error}</div>
      <button on:click={loadTasks} class="btn btn-primary">
        Try Again
      </button>
    </div>
  {:else if tasks.length === 0}
    <div class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tasks yet</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Get started by creating your first task or importing the default New World tasks.
      </p>
      <div class="mt-4 space-x-2">
        <button class="btn-primary" on:click={openCreate}>Create Task</button>
        <button class="btn-secondary" on:click={async () => { await api.initializeDefaultTasks(); await loadTasks() }}>Import Defaults</button>
      </div>
    </div>
  {:else}
    <div class="mb-6">
      <button class="btn-primary" on:click={openCreate}>Add New Task</button>
    </div>
    
    <div class="space-y-4">
      {#each tasks as task}
        <div class="card">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-4">
                <input type="checkbox" class="w-5 h-5 text-nw-blue border-gray-300 rounded focus:ring-nw-blue" />
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{task.name}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <span class="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">{task.type}</span>
              <span class="text-sm priority-{task.priority.toLowerCase()}">{task.priority}</span>
              <button class="btn-secondary text-sm" on:click={() => openEdit(task)}>Edit</button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <TaskModal isOpen={showModal} task={editingTask} on:save={handleSave} on:delete={handleDelete} on:close={() => { showModal = false; editingTask = null }} />
</div> 