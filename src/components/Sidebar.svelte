<script>
  import { currentView, sidebarCollapsed } from '../stores/ui'
  
  let currentViewValue = 'dashboard'
  let collapsed = false
  
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: 'dashboard' },
    { id: 'calendar', name: 'Calendar', icon: 'calendar' },
    { id: 'characters', name: 'Characters', icon: 'users' },
    { id: 'tasks', name: 'Tasks', icon: 'tasks' },
    { id: 'events', name: 'Events', icon: 'events' },
    { id: 'settings', name: 'Settings', icon: 'settings' }
  ]
  
  function setCurrentView(viewId) {
    currentView.set(viewId)
  }
  
  function toggleSidebar() {
    sidebarCollapsed.update(value => !value)
  }
  
  // Subscribe to stores
  const unsubscribeView = currentView.subscribe(value => {
    currentViewValue = value
  })
  
  const unsubscribeCollapsed = sidebarCollapsed.subscribe(value => {
    collapsed = value
  })
</script>

<aside class="bg-gray-800 text-white {collapsed ? 'w-18' : 'w-64'} min-h-screen transition-all duration-300 ease-in-out">
  <div class="{collapsed ? 'p-2' : 'p-4'}">
    <!-- Sidebar Toggle -->
    <button
      class="w-full flex items-center justify-{collapsed ? 'center' : 'between'} p-2 rounded-lg hover:bg-gray-700 transition-colors mb-4"
      on:click={toggleSidebar}
    >
      {#if !collapsed}
        <span class="font-medium">Menu</span>
      {/if}
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
      </svg>
    </button>
    
    <!-- Navigation Menu -->
    <nav class="space-y-2">
      {#each menuItems as item}
        <button
          class="w-full flex items-center {collapsed ? 'justify-center' : 'justify-start'} {collapsed ? 'p-2' : 'p-3'} rounded-lg hover:bg-gray-700 transition-colors {
            currentViewValue === item.id ? 'bg-nw-blue' : ''
          }"
          on:click={() => setCurrentView(item.id)}
          title={collapsed ? item.name : ''}
        >
          <!-- Icon -->
          <span class="w-5 h-5 {collapsed ? '' : 'mr-3'}">
            {#if item.icon === 'dashboard'}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z"></path>
              </svg>
            {:else if item.icon === 'calendar'}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            {:else if item.icon === 'users'}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            {:else if item.icon === 'tasks'}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
            {:else if item.icon === 'events'}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            {:else if item.icon === 'settings'}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            {/if}
          </span>
          
          <!-- Text -->
          {#if !collapsed}
            <span class="font-medium">{item.name}</span>
          {/if}
        </button>
      {/each}
    </nav>
  </div>
</aside> 