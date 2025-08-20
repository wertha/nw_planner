<script>
  import { dialogState, closeDialog } from '../stores/dialog.js'
  import { get } from 'svelte/store'

  let state
  dialogState.subscribe(v => state = v)

  function handleConfirm() {
    const resolver = state?.resolve
    closeDialog()
    if (resolver) resolver(true)
  }

  function handleCancel() {
    const resolver = state?.resolve
    closeDialog()
    if (resolver) resolver(false)
  }

  function onBackdrop(e){ if(e.target===e.currentTarget) handleCancel() }
</script>

{#if state?.type}
  <div class="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4" on:click={onBackdrop}>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm" role="dialog" aria-modal="true">
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{state.title}</h3>
      </div>
      <div class="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{state.message}</div>
      <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
        {#if state.type === 'confirm'}
          <button class="px-3 py-1.5 text-sm rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200" on:click={handleCancel}>{state.cancelText || 'Cancel'}</button>
        {/if}
        <button class="px-3 py-1.5 text-sm rounded-md bg-nw-blue text-white" on:click={handleConfirm}>{state.confirmText || 'OK'}</button>
      </div>
    </div>
  </div>
{/if}


