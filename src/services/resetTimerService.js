import TimeZoneService from './timezone.js'

class ResetTimerService {
    constructor() {
        this.intervals = new Map()
        this.callbacks = new Map()
    }

    // Calculate time until next daily reset (5 AM server time)
    getTimeUntilDailyReset(serverName) {
        const nextResetUTC = TimeZoneService.getNextResetUTC(serverName, 'daily')
        const now = new Date()
        const timeDiff = nextResetUTC.getTime() - now.getTime()
        return this.formatTimeRemaining(timeDiff)
    }

    // Calculate time until next weekly reset (Tuesday 5 AM server time)
    getTimeUntilWeeklyReset(serverName) {
        const nextResetUTC = TimeZoneService.getNextResetUTC(serverName, 'weekly')
        const now = new Date()
        const timeDiff = nextResetUTC.getTime() - now.getTime()
        return this.formatTimeRemaining(timeDiff)
    }

    // Get current server time
    getServerTime(serverName, localTime = new Date()) {
        const serverTimezone = TimeZoneService.serverTimeZones[serverName]
        if (!serverTimezone) {
            throw new Error(`Unknown server: ${serverName}`)
        }

        // Create a new date in the server's timezone
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: serverTimezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        })

        const parts = formatter.formatToParts(localTime)
        const serverTimeStr = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}T${parts.find(p => p.type === 'hour').value}:${parts.find(p => p.type === 'minute').value}:${parts.find(p => p.type === 'second').value}`
        
        return new Date(serverTimeStr)
    }

    // Convert server time back to local time
    convertFromServerTime(serverName, serverTime) {
        const serverTimezone = TimeZoneService.serverTimeZones[serverName]
        if (!serverTimezone) {
            throw new Error(`Unknown server: ${serverName}`)
        }

        // This is a simplified conversion - for production use a proper timezone library
        const utcTime = new Date(serverTime.toISOString())
        return utcTime
    }

    // Format time remaining into human readable format
    formatTimeRemaining(milliseconds) {
        if (milliseconds <= 0) {
            return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 }
        }

        const totalSeconds = Math.floor(milliseconds / 1000)
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        return {
            hours,
            minutes,
            seconds,
            totalMs: milliseconds,
            formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }
    }

    // Get formatted server time display
    getServerTimeDisplay(serverName) {
        const serverTime = this.getServerTime(serverName)
        return {
            time: serverTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: false 
            }),
            date: serverTime.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            }),
            timezone: TimeZoneService.serverTimeZones[serverName]
        }
    }

    // Start real-time updates for reset timers
    startResetTimer(serverName, callback) {
        const timerId = `${serverName}_reset_timer`
        
        // Clear existing timer if any
        if (this.intervals.has(timerId)) {
            clearInterval(this.intervals.get(timerId))
        }

        // Set up new timer that updates every second
        const interval = setInterval(() => {
            try {
                const dailyReset = this.getTimeUntilDailyReset(serverName)
                const weeklyReset = this.getTimeUntilWeeklyReset(serverName)
                const serverTime = this.getServerTimeDisplay(serverName)

                callback({
                    server: serverName,
                    daily: dailyReset,
                    weekly: weeklyReset,
                    serverTime: serverTime,
                    timestamp: Date.now()
                })
            } catch (error) {
                console.error(`Error updating reset timer for ${serverName}:`, error)
            }
        }, 1000)

        this.intervals.set(timerId, interval)
        this.callbacks.set(timerId, callback)

        // Trigger immediate update
        try {
            const dailyReset = this.getTimeUntilDailyReset(serverName)
            const weeklyReset = this.getTimeUntilWeeklyReset(serverName)
            const serverTime = this.getServerTimeDisplay(serverName)

            callback({
                server: serverName,
                daily: dailyReset,
                weekly: weeklyReset,
                serverTime: serverTime,
                timestamp: Date.now()
            })
        } catch (error) {
            console.error(`Error in initial reset timer update for ${serverName}:`, error)
        }

        return timerId
    }

    // Stop reset timer
    stopResetTimer(timerId) {
        if (this.intervals.has(timerId)) {
            clearInterval(this.intervals.get(timerId))
            this.intervals.delete(timerId)
            this.callbacks.delete(timerId)
        }
    }

    // Stop all timers
    stopAllTimers() {
        for (const [timerId, interval] of this.intervals) {
            clearInterval(interval)
        }
        this.intervals.clear()
        this.callbacks.clear()
    }

    // Get reset information for multiple servers
    getMultiServerResetInfo(serverNames) {
        return serverNames.map(serverName => {
            try {
                return {
                    server: serverName,
                    daily: this.getTimeUntilDailyReset(serverName),
                    weekly: this.getTimeUntilWeeklyReset(serverName),
                    serverTime: this.getServerTimeDisplay(serverName),
                    error: null
                }
            } catch (error) {
                return {
                    server: serverName,
                    daily: null,
                    weekly: null,
                    serverTime: null,
                    error: error.message
                }
            }
        })
    }

    // Check if it's currently reset time (within 5 minutes of reset)
    isResetTime(serverName, type = 'daily') {
        try {
            const resetInfo = type === 'daily' 
                ? this.getTimeUntilDailyReset(serverName)
                : this.getTimeUntilWeeklyReset(serverName)
            
            // Consider it "reset time" if less than 5 minutes remaining
            return resetInfo.totalMs <= (5 * 60 * 1000)
        } catch (error) {
            return false
        }
    }

    // Get next reset periods for database queries
    getResetPeriods(serverName) {
        const serverTime = this.getServerTime(serverName)
        
        // Daily reset period (YYYY-MM-DD format)
        let dailyPeriod = serverTime.toISOString().split('T')[0]
        
        // If it's before 5 AM server time, use previous day
        if (serverTime.getHours() < 5) {
            const prevDay = new Date(serverTime)
            prevDay.setDate(prevDay.getDate() - 1)
            dailyPeriod = prevDay.toISOString().split('T')[0]
        }
        
        // Weekly reset period (YYYY-WNN format)
        const year = serverTime.getFullYear()
        const weekNumber = this.getWeekNumber(serverTime)
        const weeklyPeriod = `${year}-W${weekNumber.toString().padStart(2, '0')}`
        
        return {
            daily: dailyPeriod,
            weekly: weeklyPeriod
        }
    }

    // Get ISO week number
    getWeekNumber(date) {
        const target = new Date(date.valueOf())
        const dayNr = (date.getDay() + 6) % 7
        target.setDate(target.getDate() - dayNr + 3)
        const firstThursday = target.valueOf()
        target.setMonth(0, 1)
        if (target.getDay() !== 4) {
            target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
        }
        return 1 + Math.ceil((firstThursday - target) / 604800000)
    }
}

// Export a singleton instance
export default new ResetTimerService() 