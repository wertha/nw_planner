import { app } from 'electron'

// Only consider it dev mode if explicitly set to development AND not packaged
const isDev = process.env.NODE_ENV === 'development' && !app.isPackaged

console.log('isDev check:', {
    NODE_ENV: process.env.NODE_ENV,
    isPackaged: app.isPackaged,
    isDev
})

export { isDev } 