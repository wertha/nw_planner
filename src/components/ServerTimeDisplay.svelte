<script>
  import { onMount, onDestroy } from 'svelte'
  import api from '../services/api.js'
  
  export let serverName
  export let showResetTimers = true
  export let showServerTime = true
  export let size = 'normal' // 'small', 'normal', 'large'
  
  let timerId = null
  let serverTime = { time: '00:00:00', date: 'Loading...', timezone: '' }
  let resetTimers = {
    daily: { hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00', totalMs: 0 },
    weekly: { hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00', totalMs: 0 }
  }
  let loading = true
  let error = null
  
  onMount(async () => {
    await startTimer()
  })
  
  onDestroy(() => {
    stopTimer()
  })
  
  async function startTimer() {
    if (!serverName) return
    
    try {
      loading = true
      error = null
      
      timerId = await api.startResetTimer(serverName, (timerData) => {
        serverTime = timerData.serverTime
        resetTimers = {
          daily: timerData.daily,
          weekly: timerData.weekly
        }
        loading = false
      })
    } catch (err) {
      console.error('Error starting server timer:', err)
      error = `Failed to load data for ${serverName}`
      loading = false
    }
  }
  
  function stopTimer() {
    if (timerId) {
      api.stopResetTimer(timerId)
      timerId = null
    }
  }
  
  // Reactive statement to restart timer if serverName changes
  $: if (serverName) {
    stopTimer()
    startTimer()
  }
  
  // Size-based styling
  $: sizeClasses = {
    small: {
      container: 'text-xs',
      time: 'text-sm font-medium',
      reset: 'text-sm font-bold',
      spacing: 'space-y-1'
    },
    normal: {
      container: 'text-sm',
      time: 'text-base font-medium',
      reset: 'text-lg font-bold',
      spacing: 'space-y-2'
    },
    large: {
      container: 'text-base',
      time: 'text-lg font-medium',
      reset: 'text-2xl font-bold',
      spacing: 'space-y-4'
    }
  }[size]
</script>

<div class="server-time-display {sizeClasses.container}">
  {#if loading}
    <div class="flex items-center space-x-2">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-nw-blue"></div>
      <span class="text-gray-500 dark:text-gray-400">Loading {serverName}...</span>
    </div>
  {:else if error}
    <div class="text-red-600 dark:text-red-400">
      <span class="text-sm">⚠️ {error}</span>
    </div>
  {:else}
    <div class={sizeClasses.spacing}>
      <!-- Server Name & Time -->
      {#if showServerTime}
        <div class="flex items-center justify-between">
          <span class="font-medium text-gray-900 dark:text-white">{serverName}</span>
          <div class="text-right">
            <div class={sizeClasses.time + ' text-gray-900 dark:text-white'}>
              {serverTime.time}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {serverTime.date}
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Reset Timers -->
      {#if showResetTimers}
        <div class={sizeClasses.spacing}>
          <!-- Daily Reset -->
          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-400">Daily Reset:</span>
            <div class={sizeClasses.reset + ' text-nw-blue'}>
              {resetTimers.daily.formatted}
            </div>
          </div>
          
          <!-- Weekly Reset -->
          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-400">Weekly Reset:</span>
            <div class={sizeClasses.reset + ' text-orange-500'}>
              {resetTimers.weekly.formatted}
            </div>
          </div>
          
          <!-- Warning Messages -->
          {#if resetTimers.daily.totalMs <= 300000 && resetTimers.daily.totalMs > 0}
            <div class="text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
              🔄 Daily reset in less than 5 minutes!
            </div>
          {/if}
          
          {#if resetTimers.weekly.totalMs <= 1800000 && resetTimers.weekly.totalMs > 0}
            <div class="text-xs text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
              🔄 Weekly reset in less than 30 minutes!
            </div>
          {/if}
          
          {#if resetTimers.daily.totalMs <= 0}
            <div class="text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
              ✅ Daily reset has occurred!
            </div>
          {/if}
          
          {#if resetTimers.weekly.totalMs <= 0}
            <div class="text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
              ✅ Weekly reset has occurred!
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .server-time-display {
    transition: all 0.2s ease-in-out;
  }
</style> 