import { format, addDays, setHours, setMinutes, setSeconds, setMilliseconds, isAfter, isBefore, addWeeks, startOfDay, getDay } from 'date-fns'

class TimeZoneService {
    static serverTimeZones = {
        'Camelot': 'America/Los_Angeles',
        'Valhalla': 'America/New_York',
        'Hellheim': 'Europe/London',
        'Asgard': 'Europe/Berlin',
        'Midgard': 'America/Chicago',
        'Jotunheim': 'Australia/Sydney',
        'Alfheim': 'America/Los_Angeles',
        'Niflheim': 'America/New_York',
        'Muspelheim': 'Europe/London',
        'Utgard': 'Europe/Paris',
        'Bifrost': 'America/Denver',
        'Yggdrasil': 'America/Los_Angeles'
    }

    static getServerTime(serverName, localTime = new Date()) {
        const timezone = this.serverTimeZones[serverName]
        if (!timezone) {
            console.warn(`Unknown server: ${serverName}, using local time`)
            return localTime
        }
        
        try {
            // Create a date in the server's timezone
            const serverTime = new Date(localTime.toLocaleString('en-US', { timeZone: timezone }))
            return serverTime
        } catch (error) {
            console.error(`Error converting time for server ${serverName}:`, error)
            return localTime
        }
    }

    static getServerTimeString(serverName, localTime = new Date()) {
        const timezone = this.serverTimeZones[serverName]
        if (!timezone) {
            return localTime.toLocaleString()
        }
        
        try {
            return new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).format(localTime)
        } catch (error) {
            console.error(`Error formatting time for server ${serverName}:`, error)
            return localTime.toLocaleString()
        }
    }

    static getNextResetTime(serverName, resetType) {
        const timezone = this.serverTimeZones[serverName]
        if (!timezone) {
            console.warn(`Unknown server: ${serverName}, using local timezone`)
            return this.getNextResetTimeLocal(resetType)
        }
        
        try {
            const now = new Date()
            const serverTime = this.getServerTime(serverName, now)
            
            if (resetType === 'daily') {
                // Next 5 AM server time
                let nextReset = setHours(setMinutes(setSeconds(setMilliseconds(serverTime, 0), 0), 0), 5)
                
                // If it's already past 5 AM today, move to tomorrow
                if (isAfter(serverTime, nextReset)) {
                    nextReset = addDays(nextReset, 1)
                }
                
                return nextReset
            } else if (resetType === 'weekly') {
                // Next Tuesday at 5 AM server time
                let nextReset = setHours(setMinutes(setSeconds(setMilliseconds(serverTime, 0), 0), 0), 5)
                
                // Calculate days until Tuesday (2 = Tuesday, 0 = Sunday)
                const currentDay = getDay(serverTime)
                const daysUntilTuesday = currentDay === 2 ? 7 : (2 - currentDay + 7) % 7
                
                // If it's Tuesday but past 5 AM, move to next Tuesday
                if (currentDay === 2 && isAfter(serverTime, nextReset)) {
                    nextReset = addDays(nextReset, 7)
                } else if (currentDay !== 2) {
                    nextReset = addDays(nextReset, daysUntilTuesday)
                }
                
                return nextReset
            }
        } catch (error) {
            console.error(`Error calculating reset time for server ${serverName}:`, error)
            return this.getNextResetTimeLocal(resetType)
        }
        
        return new Date()
    }

    static getNextResetTimeLocal(resetType) {
        const now = new Date()
        
        if (resetType === 'daily') {
            let nextReset = setHours(setMinutes(setSeconds(setMilliseconds(now, 0), 0), 0), 5)
            if (isAfter(now, nextReset)) {
                nextReset = addDays(nextReset, 1)
            }
            return nextReset
        } else if (resetType === 'weekly') {
            let nextReset = setHours(setMinutes(setSeconds(setMilliseconds(now, 0), 0), 0), 5)
            const currentDay = getDay(now)
            const daysUntilTuesday = currentDay === 2 ? 7 : (2 - currentDay + 7) % 7
            
            if (currentDay === 2 && isAfter(now, nextReset)) {
                nextReset = addDays(nextReset, 7)
            } else if (currentDay !== 2) {
                nextReset = addDays(nextReset, daysUntilTuesday)
            }
            
            return nextReset
        }
        
        return now
    }

    static getTimeUntilReset(serverName, resetType) {
        const nextReset = this.getNextResetTime(serverName, resetType)
        const now = new Date()
        const timeDiff = nextReset.getTime() - now.getTime()
        
        if (timeDiff <= 0) {
            return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 }
        }
        
        const hours = Math.floor(timeDiff / (1000 * 60 * 60))
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
        
        return { hours, minutes, seconds, totalMs: timeDiff }
    }

    static getCurrentResetPeriod(serverName, resetType) {
        const serverTime = this.getServerTime(serverName)
        
        if (resetType === 'daily') {
            // Format: YYYY-MM-DD
            return format(serverTime, 'yyyy-MM-dd')
        } else if (resetType === 'weekly') {
            // Format: YYYY-Www (ISO week format)
            const year = serverTime.getFullYear()
            const weekNumber = this.getWeekNumber(serverTime)
            return `${year}-W${weekNumber.toString().padStart(2, '0')}`
        }
        
        return format(serverTime, 'yyyy-MM-dd')
    }

    static getWeekNumber(date) {
        const tempDate = new Date(date.getTime())
        tempDate.setHours(0, 0, 0, 0)
        // Thursday in current week decides the year
        tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7)
        // January 4 is always in week 1
        const week1 = new Date(tempDate.getFullYear(), 0, 4)
        // Adjust to Thursday in week 1 and count weeks from there
        return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
    }

    static convertToServerTime(serverName, localTime) {
        return this.getServerTime(serverName, localTime)
    }

    static convertToLocalTime(serverName, serverTime) {
        // This is a simplified conversion - for more accurate conversion,
        // you would need to account for timezone differences
        const timezone = this.serverTimeZones[serverName]
        if (!timezone) {
            return serverTime
        }
        
        try {
            // Create a date string in the server timezone and parse it as local time
            const serverTimeString = serverTime.toLocaleString('sv-SE') // ISO-like format
            return new Date(serverTimeString)
        } catch (error) {
            console.error(`Error converting server time to local time:`, error)
            return serverTime
        }
    }

    static getAvailableServers() {
        return Object.keys(this.serverTimeZones)
    }

    static getServerTimezone(serverName) {
        return this.serverTimeZones[serverName] || 'UTC'
    }

    static formatTimeForDisplay(date, serverName = null) {
        const formatOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }

        if (serverName) {
            const timezone = this.serverTimeZones[serverName]
            if (timezone) {
                formatOptions.timeZone = timezone
            }
        }

        return new Intl.DateTimeFormat('en-US', formatOptions).format(date)
    }

    static isResetTime(serverName, resetType) {
        const serverTime = this.getServerTime(serverName)
        const resetHour = 5 // 5 AM
        
        if (resetType === 'daily') {
            return serverTime.getHours() === resetHour && serverTime.getMinutes() < 1
        } else if (resetType === 'weekly') {
            const dayOfWeek = getDay(serverTime)
            return dayOfWeek === 2 && serverTime.getHours() === resetHour && serverTime.getMinutes() < 1
        }
        
        return false
    }
}

export default TimeZoneService 