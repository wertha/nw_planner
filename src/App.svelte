<script>
  import { onMount } from 'svelte'
  import { currentView } from './stores/ui'
  import Header from './components/Header.svelte'
  import Sidebar from './components/Sidebar.svelte'
  import Dashboard from './views/Dashboard.svelte'
  import Calendar from './views/Calendar.svelte'
  import Characters from './views/Characters.svelte'
  import Tasks from './views/Tasks.svelte'
  import Events from './views/Events.svelte'
  import Settings from './views/Settings.svelte'
  
  let currentViewValue = 'dashboard'
  
  onMount(() => {
    const unsubscribe = currentView.subscribe(value => {
      currentViewValue = value
    })
    
    return unsubscribe
  })
  
  function getComponent(view) {
    switch (view) {
      case 'dashboard':
        return Dashboard
      case 'calendar':
        return Calendar
      case 'characters':
        return Characters
      case 'tasks':
        return Tasks
      case 'events':
        return Events
      case 'settings':
        return Settings
      default:
        return Dashboard
    }
  }
</script>

<main class="flex h-screen bg-gray-100 dark:bg-gray-900">
  <Sidebar />
  
  <div class="flex-1 flex flex-col">
    <Header />
    
    <div class="flex-1 overflow-y-auto p-6">
      <svelte:component this={getComponent(currentViewValue)} />
    </div>
  </div>
</main>

<style>
  main {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
  }
</style> 