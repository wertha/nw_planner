<script>
  import FactionIcon from './FactionIcon.svelte'
  export let value = 'Factionless'
  export let disabled = false
  const options = ['Factionless', 'Marauders', 'Covenant', 'Syndicate']
  function handleChange(e){ value = e.target.value }
</script>

<div class="relative w-full">
  <div class="w-full inline-flex items-center justify-between border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-base text-gray-800 dark:text-gray-100">
    <span class="flex items-center gap-2 overflow-hidden text-ellipsis">
      <FactionIcon faction={value} size={18} />
      <span class="truncate">{value}</span>
    </span>
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" class="ml-2 text-gray-500"><polyline points="6 8 10 12 14 8"/></svg>
  </div>
  <!-- Native select overlays for accessibility and form binding -->
  <select bind:value {disabled} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
    {#each options as opt}
      <option value={opt}>{opt}</option>
    {/each}
  </select>
</div>


