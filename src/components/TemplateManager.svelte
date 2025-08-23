<script>
  import { onMount } from 'svelte'
  import TemplateModal from './TemplateModal.svelte'
  import api from '../services/api.js'

  export let isOpen = false

  let loading = true
  let templates = []
  let search = ''
  let sort = 'name'
  let showTemplateModal = false
  let editingTemplate = null

  onMount(load)
  async function load(){
    loading = true
    try { templates = await api.getEventTemplates() } catch { templates = [] }
    loading = false
  }

  function applyTemplate(t){
    const ev = new CustomEvent('apply', { detail: t })
    dispatchEvent(ev)
  }

  function openCreate(){ editingTemplate = null; showTemplateModal = true }
  function openEdit(t){ editingTemplate = t; showTemplateModal = true }
  async function duplicate(t){
    const copy = { ...t, id: undefined, name: `${t.name} (copy)` }
    await api.createEventTemplate(copy)
    await load()
  }
  async function remove(t){
    const { showConfirm } = await import('../stores/dialog.js')
    const ok = await showConfirm(`Delete template "${t.name}"?`, 'Delete Template', 'Delete', 'Cancel')
    if (!ok) return
    await api.deleteEventTemplate(t.id)
    await load()
  }

  $: filtered = (templates || [])
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=> sort==='updated' ? (new Date(b.updated_at||0) - new Date(a.updated_at||0)) : a.name.localeCompare(b.name))
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl" role="document" on:click|stopPropagation>
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Templates</h2>
          <input placeholder="Search" class="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={search}>
          <select class="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" bind:value={sort}>
            <option value="name">Sort: Name</option>
            <option value="updated">Sort: Updated</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary" on:click={openCreate}>New Template</button>
          <button class="text-gray-500 hover:text-gray-700 dark:text-gray-300" on:click={()=> dispatchEvent(new CustomEvent('close'))}>✕</button>
        </div>
      </div>
      <div class="p-6">
        {#if loading}
          <div class="h-48 flex items-center justify-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-nw-blue"></div></div>
        {:else if filtered.length === 0}
          <div class="text-center text-gray-600 dark:text-gray-400 py-12">
            <p>No templates yet.</p>
            <button class="btn-primary mt-3" on:click={openCreate}>Create your first template</button>
          </div>
        {:else}
          <div class="overflow-auto max-h-[60vh]">
            <table class="w-full text-sm">
              <thead class="text-left text-gray-700 dark:text-gray-300">
                <tr>
                  <th class="py-2 pr-4">Name</th>
                  <th class="py-2 pr-4">Type</th>
                  <th class="py-2 pr-4">Pref Mode</th>
                  <th class="py-2 pr-4">Strategy</th>
                  <th class="py-2 pr-4">TZ Source</th>
                  <th class="py-2 pr-4">Updated</th>
                  <th class="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody class="text-gray-800 dark:text-gray-200">
                {#each filtered as t}
                  <tr class="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td class="py-2 pr-4 font-medium">{t.name}</td>
                    <td class="py-2 pr-4">{t.event_type || '-'}</td>
                    <td class="py-2 pr-4">{t.preferred_time_mode || '-'}</td>
                    <td class="py-2 pr-4">{t.time_strategy || '-'}</td>
                    <td class="py-2 pr-4">{t.timezone_source || '-'}</td>
                    <td class="py-2 pr-4">{t.updated_at ? new Date(t.updated_at).toLocaleString() : '-'}</td>
                    <td class="py-2 pr-4">
                      <div class="flex items-center gap-2">
                        <button class="btn-secondary text-xs" on:click={()=> applyTemplate(t)}>Apply</button>
                        <button class="btn-secondary text-xs" on:click={()=> openEdit(t)}>Edit</button>
                        <button class="btn-secondary text-xs" on:click={()=> duplicate(t)}>Duplicate</button>
                        <button class="btn-danger text-xs" on:click={()=> remove(t)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>

      <TemplateModal isOpen={showTemplateModal} template={editingTemplate} on:cancel={()=>{ showTemplateModal=false; editingTemplate=null }} on:save={async (e)=>{ try { if (editingTemplate) await api.updateEventTemplate(editingTemplate.id, e.detail); else await api.createEventTemplate(e.detail); showTemplateModal=false; editingTemplate=null; await load() } catch (err) { console.error('Template save failed', err) } }} />
    </div>
  </div>
{/if}

<style>
  .btn-secondary { @apply px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700; }
  .btn-primary { @apply px-3 py-1.5 rounded-md text-white bg-nw-blue; }
  .btn-danger { @apply px-3 py-1.5 rounded-md text-white bg-red-600; }
</style>


