import { writable } from 'svelte/store'

// Current view state
export const currentView = writable('dashboard')

// Dark mode state (persistent)
function createPersistentDarkModeStore() {
    let initial = false
    try {
        if (typeof window !== 'undefined') {
            const stored = window.localStorage.getItem('nwp.darkMode')
            if (stored === 'true' || stored === 'false') {
                initial = stored === 'true'
            } else {
                // Fallback to system preference
                initial = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            }
            // Apply class immediately on load
            if (typeof document !== 'undefined') {
                document.documentElement.classList.toggle('dark', initial)
            }
        }
    } catch (_) {
        // Ignore storage/matchMedia errors and use default
    }

    const store = writable(initial)
    // Persist and reflect to document
    store.subscribe((value) => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem('nwp.darkMode', String(value))
            }
            if (typeof document !== 'undefined') {
                document.documentElement.classList.toggle('dark', !!value)
            }
        } catch (_) {
            // noop
        }
    })
    return store
}

export const darkMode = createPersistentDarkModeStore()

// Selected characters
export const selectedCharacters = writable([])

// Sidebar collapsed state
export const sidebarCollapsed = writable(false)

// Notification settings
export const notifications = writable({
    desktop: true,
    sound: false,
    dailyReset: true,
    weeklyReset: true,
    events: true
})

// Loading states
export const loading = writable({
    characters: false,
    tasks: false,
    events: false
}) 