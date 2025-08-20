import { writable } from 'svelte/store'

// Dialog store state
export const dialogState = writable({
    type: null, // 'alert' | 'confirm'
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    resolve: null
})

function openDialog(payload) {
    return new Promise((resolve) => {
        dialogState.set({ ...payload, resolve })
    })
}

export function showAlert(message, title = 'Notice', buttonText = 'OK') {
    return openDialog({ type: 'alert', message, title, confirmText: buttonText })
}

export function showConfirm(message, title = 'Confirm', confirmText = 'Confirm', cancelText = 'Cancel') {
    return openDialog({ type: 'confirm', message, title, confirmText, cancelText })
}

export function closeDialog() {
    dialogState.set({ type: null, title: '', message: '', confirmText: 'OK', cancelText: 'Cancel', resolve: null })
}


