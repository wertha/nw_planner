import { format, addDays, setHours, setMinutes, setSeconds, setMilliseconds, isAfter, isBefore, addWeeks, startOfDay, getDay } from 'date-fns'

class TimeZoneService {
    static serverTimeZones = {
        'Camelot': 'America/Los_Angeles',
        'El Dorado': 'America/Los_Angeles',
        'Valhalla': 'America/New_York',
        'Hudsonland': 'America/New_York',
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
        // Normalize to UTC instant subtraction for reliable countdowns
        const nextReset = this.getNextResetUTC(serverName, resetType)
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
            // Weekly period anchored to Tuesday 05:00 in server timezone
            const tz = this.serverTimeZones[serverName] || 'UTC'
            const weekdayStr = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(new Date())
            const map = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 }
            const dayNum = map[weekdayStr]
            const dateOnlyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
            const dateParts = dateOnlyFmt.formatToParts(new Date())
            const y = parseInt(dateParts.find(p => p.type === 'year').value, 10)
            const m = parseInt(dateParts.find(p => p.type === 'month').value, 10)
            const d = parseInt(dateParts.find(p => p.type === 'day').value, 10)
            const timeParts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date())
            const H = parseInt(timeParts.find(p => p.type === 'hour').value, 10)
            const deltaToTuesday = (dayNum - 2 + 7) % 7
            const tuesdayUTC = new Date(Date.UTC(y, m - 1, d))
            tuesdayUTC.setUTCDate(tuesdayUTC.getUTCDate() - deltaToTuesday)
            const beforeFiveOnTuesday = (dayNum === 2 && H < 5)
            if (beforeFiveOnTuesday) {
                tuesdayUTC.setUTCDate(tuesdayUTC.getUTCDate() - 7)
            }
            const year = tuesdayUTC.getUTCFullYear()
            const weekNumber = this.getWeekNumber(tuesdayUTC)
            return `${year}-W${weekNumber.toString().padStart(2, '0')}`
        }
        
        return format(serverTime, 'yyyy-MM-dd')
    }

    // ===== New consolidated helpers =====
    static getServerNowParts(serverName, referenceDate = new Date()) {
        const timezone = this.serverTimeZones[serverName]
        const dtf = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone || 'UTC',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        })
        const parts = dtf.formatToParts(referenceDate)
        const pick = (t) => parts.find(p => p.type === t).value
        return {
            y: parseInt(pick('year'), 10),
            m: parseInt(pick('month'), 10),
            d: parseInt(pick('day'), 10),
            H: parseInt(pick('hour'), 10),
            M: parseInt(pick('minute'), 10),
            S: parseInt(pick('second'), 10)
        }
    }

    // ----- Robust conversion helpers (timezone-first) -----
    static getZonedNowPartsByTimezone(timezone, referenceDate = new Date()) {
        const dtf = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone || 'UTC',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        })
        const parts = dtf.formatToParts(referenceDate)
        const pick = (t) => parts.find(p => p.type === t).value
        return {
            y: parseInt(pick('year'), 10),
            m: parseInt(pick('month'), 10),
            d: parseInt(pick('day'), 10),
            H: parseInt(pick('hour'), 10),
            M: parseInt(pick('minute'), 10),
            S: parseInt(pick('second'), 10)
        }
    }

    static tzOffsetAt(timezone, date) {
        // Compute timezone offset at a given instant using Intl
        const dtf = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone || 'UTC',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        })
        const parts = dtf.formatToParts(date)
        const pick = (t) => parseInt(parts.find(p => p.type === t).value, 10)
        const y = pick('year'); const m = pick('month'); const d = pick('day')
        const H = pick('hour'); const M = pick('minute'); const S = pick('second')
        const asUTC = Date.UTC(y, m - 1, d, H, M, S)
        return asUTC - date.getTime()
    }

    static toUTCFromZonedTimezone(timezone, y, m, d, H = 0, M = 0, S = 0) {
        // Create a UTC guess for the wall time, then adjust by the zone offset
        const guess = new Date(Date.UTC(y, m - 1, d, H, M, S))
        const offsetMs = this.tzOffsetAt(timezone, guess)
        const utc = new Date(guess.getTime() - offsetMs)
        // Validation step: if formatting back doesn't match, return nearest match
        try {
            const check = new Intl.DateTimeFormat('en-CA', {
                timeZone: timezone || 'UTC',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            }).formatToParts(utc)
            const pick = (t) => parseInt(check.find(p => p.type === t).value, 10)
            if (pick('year') !== y || pick('month') !== m || pick('day') !== d || pick('hour') !== H) {
                // For non-existent local times (DST forward), nudge by 1 hour
                return new Date(utc.getTime() + 3600000)
            }
        } catch (_) {}
        return utc
    }

    static toUTCFromZoned(serverName, y, m, d, H = 0, M = 0, S = 0) {
        const timezone = this.serverTimeZones[serverName]
        if (!timezone) return new Date(Date.UTC(y, m - 1, d, H, M, S))
        return this.toUTCFromZonedTimezone(timezone, y, m, d, H, M, S)
    }

    static getNextResetUTC(serverName, resetType) {
        const now = new Date()
        const tz = this.serverTimeZones[serverName] || 'UTC'
        const { y, m, d, H } = this.getZonedNowPartsByTimezone(tz, now)
        if (resetType === 'weekly') {
            const weekdayStr = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(now)
            const map = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 }
            const dayNum = map[weekdayStr]
            const daysUntilTue = dayNum === 2 ? 0 : (2 - dayNum + 7) % 7
            let candidateUTC = this.toUTCFromZonedTimezone(tz, y, m, d + daysUntilTue, 5, 0, 0)
            if (candidateUTC.getTime() <= now.getTime()) {
                candidateUTC = this.toUTCFromZonedTimezone(tz, y, m, d + daysUntilTue + 7, 5, 0, 0)
            }
            return candidateUTC
        }
        // Daily
        let candidateUTC = this.toUTCFromZonedTimezone(tz, y, m, d, 5, 0, 0)
        if (candidateUTC.getTime() <= now.getTime()) {
            candidateUTC = this.toUTCFromZonedTimezone(tz, y, m, d + 1, 5, 0, 0)
        }
        return candidateUTC
    }

    // New: timezone-centric APIs
    static getNextResetUTCByTimezone(timezone, resetType) {
        const now = new Date()
        const { y, m, d } = this.getZonedNowPartsByTimezone(timezone, now)
        if (resetType === 'weekly') {
            const weekdayStr = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' }).format(now)
            const map = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 }
            const dayNum = map[weekdayStr]
            const daysUntilTue = dayNum === 2 ? 0 : (2 - dayNum + 7) % 7
            let candidateUTC = this.toUTCFromZonedTimezone(timezone, y, m, d + daysUntilTue, 5, 0, 0)
            if (candidateUTC.getTime() <= now.getTime()) {
                candidateUTC = this.toUTCFromZonedTimezone(timezone, y, m, d + daysUntilTue + 7, 5, 0, 0)
            }
            return candidateUTC
        }
        let candidateUTC = this.toUTCFromZonedTimezone(timezone, y, m, d, 5, 0, 0)
        if (candidateUTC.getTime() <= now.getTime()) {
            candidateUTC = this.toUTCFromZonedTimezone(timezone, y, m, d + 1, 5, 0, 0)
        }
        return candidateUTC
    }

    static getTimeUntilResetByTimezone(timezone, resetType) {
        const nextReset = this.getNextResetUTCByTimezone(timezone, resetType)
        const now = new Date()
        const diff = nextReset.getTime() - now.getTime()
        if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, totalMs: 0, formatted: '00:00:00' }
        const totalSeconds = Math.floor(diff / 1000)
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60
        const formatted = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`
        return { hours, minutes, seconds, totalMs: diff, formatted }
    }

    static getServerTimeDisplayByTimezone(timezone) {
        const now = new Date()
        const dtfTime = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        const dtfDate = new Intl.DateTimeFormat('en-US', { timeZone: timezone, month: 'short', day: 'numeric' })
        return { time: dtfTime.format(now), date: dtfDate.format(now), timezone }
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
