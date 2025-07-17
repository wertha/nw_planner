import { writable } from 'svelte/store'

// Current view state
export const currentView = writable('dashboard')

// Dark mode state
export const darkMode = writable(false)

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