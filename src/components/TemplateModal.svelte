<script>
  import { createEventDispatcher } from 'svelte'

  export let isOpen = false
  export let template = null // editing template or null
  export let servers = [] // optional [{id,name,timezone,...}]

  const dispatch = createEventDispatcher()

  const eventTypes = ['War','Invasion','Company Event','PvE','PvP','Custom']
  const participationStatuses = ['Signed Up','Confirmed','Tentative','Absent']

  let form = {
    name: '',
    event_type: 'Custom',
    description: '',
    location: '',
    participation_status: 'Signed Up',
    notification_enabled: true,
    notification_minutes: 30,
    preferred_time_mode: 'local',
    timezone_source: null,
    template_server_name: '',
    template_server_timezone: '',
    time_strategy: null,
    time_params: {}
  }

  $: if (isOpen) {
    if (template) {
      form = {
        name: template.name || '',
        event_type: template.event_type || 'Custom',
        description: template.description || '',
        location: template.location || '',
        participation_status: template.participation_status || 'Signed Up',
        notification_enabled: !!(template.notification_enabled || template.notification_enabled === 1),
        notification_minutes: typeof template.notification_minutes === 'number' ? template.notification_minutes : 30,
        preferred_time_mode: template.preferred_time_mode || 'local',
        timezone_source: template.timezone_source || null,
        template_server_name: template.template_server_name || '',
        template_server_timezone: template.template_server_timezone || '',
        time_strategy: template.time_strategy || null,
        time_params: typeof template.time_params === 'string' ? JSON.parse(template.time_params) : (template.time_params || {})
      }
    } else {
      form = { ...form, name: '', event_type: 'Custom' }
    }
  }

  function close() { dispatch('cancel') }
  function save() { dispatch('save', normalize(form)) }

  function normalize(f) {
    const n = { ...f }
    if (!n.time_strategy) n.time_params = null
    else n.time_params = JSON.stringify(n.time_params || {})
    if (!n.timezone_source || n.timezone_source !== 'templateServer') {
      n.template_server_name = null
      n.template_server_timezone = null
    }
    return n
  }

  function onBackdropMouseDown(e){ backMd = e.target === e.currentTarget }
  function onBackdropClick(e){ if (e.target === e.currentTarget && backMd) close() }
  let backMd = false
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" on:mousedown={onBackdropMouseDown} on:click={onBackdropClick}>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl" role="document" on:click|stopPropagation>
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{template ? 'Edit Template' : 'Create Template'}</h2>
        <button class="text-gray-500 hover:text-gray-700 dark:text-gray-300" on:click={close}>✕</button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
          <input class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={form.name} required />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Type</label>
            <select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={form.event_type}>
              {#each eventTypes as t}<option value={t}>{t}</option>{/each}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Participation</label>
            <select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={form.participation_status}>
              {#each participationStatuses as s}<option value={s}>{s}</option>{/each}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Time Mode</label>
            <select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={form.preferred_time_mode}>
              <option value="local">Local</option>
              <option value="server">Server</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone Source</label>
            <select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={form.timezone_source}>
              <option value="">(none)</option>
              <option value="templateServer">Template Server</option>
              <option value="selectedCharacter">Selected Character</option>
              <option value="local">Local</option>
            </select>
          </div>
        </div>

        {#if form.timezone_source === 'templateServer'}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Server</label>
            <select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={form.template_server_name}>
              <option value="">Select server</option>
              {#each servers as s}
                <option value={s.name}>{s.name}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Server Timezone</label>
            <input class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={form.template_server_timezone} placeholder="e.g., America/Los_Angeles" />
          </div>
        </div>
        {/if}

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
          <input class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={form.location} />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={form.description}></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center gap-2">
            <input id="notif" type="checkbox" class="w-4 h-4" bind:checked={form.notification_enabled} />
            <label for="notif" class="text-sm text-gray-700 dark:text-gray-300">Enable notifications</label>
          </div>
          {#if form.notification_enabled}
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notify (minutes before)</label>
            <input type="number" min="0" max="1440" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={form.notification_minutes} />
          </div>
          {/if}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Strategy</label>
          <select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={form.time_strategy}>
            <option value="">(none)</option>
            <option value="relativeOffset">Relative Offset</option>
            <option value="nextDayAtTime">Next Day at Time</option>
            <option value="nextWeekdayAtTime">Next Weekday at Time</option>
            <option value="fixedDateTime">Fixed Date/Time</option>
          </select>
        </div>

        {#if form.time_strategy === 'relativeOffset'}
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Offset Minutes</label>
            <input type="number" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={form.time_params.offsetMinutes} />
          </div>
        {:else if form.time_strategy === 'nextDayAtTime'}
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time of Day</label>
            <input type="time" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={form.time_params.timeOfDay} />
          </div>
        {:else if form.time_strategy === 'nextWeekdayAtTime'}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weekday</label>
              <select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={form.time_params.weekday}>
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time of Day</label>
              <input type="time" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={form.time_params.timeOfDay} />
            </div>
          </div>
        {:else if form.time_strategy === 'fixedDateTime'}
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fixed Date/Time (wall time)</label>
            <input type="datetime-local" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={form.time_params.isoDateTime} />
          </div>
        {/if}
      </div>
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
        <button class="px-4 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300" on:click={close}>Cancel</button>
        <button class="px-4 py-2 text-sm bg-nw-blue text-white rounded-md" on:click={save} disabled={!form.name}>Save Template</button>
      </div>
    </div>
  </div>
{/if}

<style>
</style>


