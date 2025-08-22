import database from './database.js'
import fs from 'fs'

class ServerService {
    constructor() {
        this.db = database
        this.statements = {}
        this.statementsInitialized = false
    }

    async initStatements() {
        if (this.statementsInitialized) return
        
        // Ensure database is initialized
        await this.db.ensureInitialized()
        
        // Prepare all SQL statements for better performance
        this.statements = {
            insert: await this.db.prepare(`
                INSERT INTO servers (name, region, timezone, active_status)
                VALUES (?, ?, ?, ?)
            `),
            update: await this.db.prepare(`
                UPDATE servers 
                SET name = ?, region = ?, timezone = ?, active_status = ?
                WHERE id = ?
            `),
            delete: await this.db.prepare('DELETE FROM servers WHERE id = ?'),
            getById: await this.db.prepare('SELECT * FROM servers WHERE id = ?'),
            getAll: await this.db.prepare('SELECT * FROM servers ORDER BY region ASC, name ASC'),
            getActive: await this.db.prepare('SELECT * FROM servers WHERE active_status = 1 ORDER BY region ASC, name ASC'),
            getByRegion: await this.db.prepare('SELECT * FROM servers WHERE region = ? ORDER BY name ASC'),
            getByName: await this.db.prepare('SELECT * FROM servers WHERE name = ? LIMIT 1'),
            updateActiveStatus: await this.db.prepare('UPDATE servers SET active_status = ? WHERE id = ?'),
            getServerCount: await this.db.prepare('SELECT COUNT(*) as count FROM servers'),
            getActiveServerCount: await this.db.prepare('SELECT COUNT(*) as count FROM servers WHERE active_status = 1'),
            getRegionList: await this.db.prepare('SELECT DISTINCT region FROM servers ORDER BY region ASC'),
            getServersByTimezone: await this.db.prepare('SELECT * FROM servers WHERE timezone = ? ORDER BY name ASC'),
            checkServerExists: await this.db.prepare('SELECT COUNT(*) as count FROM servers WHERE name = ? AND id != ?'),
            getServerNameList: await this.db.prepare('SELECT name FROM servers WHERE active_status = 1 ORDER BY name ASC')
        }
        
        this.statementsInitialized = true
    }

    // Create a new server
    async create(serverData) {
        await this.initStatements()
        
        try {
            // Validate required fields
            if (!serverData.name || !serverData.region || !serverData.timezone) {
                throw new Error('Server name, region, and timezone are required')
            }
            
            // Check if server name already exists
            const existingServer = this.statements.getByName.get(serverData.name)
            if (existingServer) {
                throw new Error(`Server with name '${serverData.name}' already exists`)
            }
            
            // Validate region
            const validRegions = ['AP Southeast', 'SA East', 'US West', 'US East', 'EU Central']
            if (!validRegions.includes(serverData.region)) {
                throw new Error(`Invalid region. Must be one of: ${validRegions.join(', ')}`)
            }
            
            const result = this.statements.insert.run(
                serverData.name.trim(),
                serverData.region,
                serverData.timezone,
                serverData.active_status !== undefined ? (serverData.active_status ? 1 : 0) : 1
            )
            
            const createdServer = this.statements.getById.get(result.lastInsertRowid)
            console.log('Server created:', createdServer)
            return createdServer
        } catch (error) {
            console.error('Error creating server:', error)
            throw error
        }
    }

    // Update an existing server
    async update(id, serverData) {
        await this.initStatements()
        
        try {
            // Validate required fields
            if (!serverData.name || !serverData.region || !serverData.timezone) {
                throw new Error('Server name, region, and timezone are required')
            }
            
            // Check if server exists
            const existingServer = this.statements.getById.get(id)
            if (!existingServer) {
                throw new Error(`Server with id ${id} not found`)
            }
            
            // Check if server name already exists (excluding current server)
            const nameExists = this.statements.checkServerExists.get(serverData.name, id)
            if (nameExists.count > 0) {
                throw new Error(`Server with name '${serverData.name}' already exists`)
            }
            
            // Validate region
            const validRegions = ['AP Southeast', 'SA East', 'US West', 'US East', 'EU Central']
            if (!validRegions.includes(serverData.region)) {
                throw new Error(`Invalid region. Must be one of: ${validRegions.join(', ')}`)
            }
            
            this.statements.update.run(
                serverData.name.trim(),
                serverData.region,
                serverData.timezone,
                serverData.active_status !== undefined ? (serverData.active_status ? 1 : 0) : 1,
                id
            )
            
            const updatedServer = this.statements.getById.get(id)
            console.log('Server updated:', updatedServer)
            return updatedServer
        } catch (error) {
            console.error('Error updating server:', error)
            throw error
        }
    }

    // Delete a server
    async delete(id) {
        await this.initStatements()
        
        try {
            const existingServer = this.statements.getById.get(id)
            if (!existingServer) {
                throw new Error(`Server with id ${id} not found`)
            }
            
            // Check if server is being used by any characters
            const charactersUsingServer = (await this.db.prepare('SELECT COUNT(*) as count FROM characters WHERE server_name = ?')).get(existingServer.name)
            if (charactersUsingServer.count > 0) {
                throw new Error(`Cannot delete server '${existingServer.name}' because it is being used by ${charactersUsingServer.count} character(s)`)
            }
            
            // Check if server is being used by any events
            const eventsUsingServer = (await this.db.prepare('SELECT COUNT(*) as count FROM events WHERE server_name = ?')).get(existingServer.name)
            if (eventsUsingServer.count > 0) {
                throw new Error(`Cannot delete server '${existingServer.name}' because it is being used by ${eventsUsingServer.count} event(s)`)
            }
            
            this.statements.delete.run(id)
            console.log('Server deleted:', existingServer)
            return true
        } catch (error) {
            console.error('Error deleting server:', error)
            throw error
        }
    }

    // Get server by ID
    async getById(id) {
        await this.initStatements()
        
        try {
            const server = this.statements.getById.get(id)
            return server || null
        } catch (error) {
            console.error('Error getting server by ID:', error)
            throw error
        }
    }

    // Get all servers
    async getAll() {
        await this.initStatements()
        
        try {
            return this.statements.getAll.all()
        } catch (error) {
            console.error('Error getting all servers:', error)
            throw error
        }
    }

    // Get active servers only
    async getActive() {
        await this.initStatements()
        
        try {
            return this.statements.getActive.all()
        } catch (error) {
            console.error('Error getting active servers:', error)
            throw error
        }
    }

    // Get servers by region
    async getByRegion(region) {
        await this.initStatements()
        
        try {
            return this.statements.getByRegion.all(region)
        } catch (error) {
            console.error('Error getting servers by region:', error)
            throw error
        }
    }

    // Get server by name
    async getByName(name) {
        await this.initStatements()
        
        try {
            return this.statements.getByName.get(name)
        } catch (error) {
            console.error('Error getting server by name:', error)
            throw error
        }
    }

    // Update server active status
    async updateActiveStatus(id, activeStatus) {
        await this.initStatements()
        
        try {
            const existingServer = this.statements.getById.get(id)
            if (!existingServer) {
                throw new Error(`Server with id ${id} not found`)
            }
            
            this.statements.updateActiveStatus.run(activeStatus ? 1 : 0, id)
            console.log(`Server ${existingServer.name} active status updated to:`, activeStatus)
            return this.statements.getById.get(id)
        } catch (error) {
            console.error('Error updating server active status:', error)
            throw error
        }
    }

    // Get server statistics
    async getStatistics() {
        await this.initStatements()
        
        try {
            const totalServers = this.statements.getServerCount.get()
            const activeServers = this.statements.getActiveServerCount.get()
            
            return {
                total: totalServers.count,
                active: activeServers.count,
                inactive: totalServers.count - activeServers.count
            }
        } catch (error) {
            console.error('Error getting server statistics:', error)
            throw error
        }
    }

    // Get list of regions
    async getRegionList() {
        await this.initStatements()
        
        try {
            return this.statements.getRegionList.all().map(row => row.region)
        } catch (error) {
            console.error('Error getting region list:', error)
            throw error
        }
    }

    // Get servers by timezone
    async getByTimezone(timezone) {
        await this.initStatements()
        
        try {
            return this.statements.getServersByTimezone.all(timezone)
        } catch (error) {
            console.error('Error getting servers by timezone:', error)
            throw error
        }
    }

    // Get server name list for dropdowns
    async getServerNameList() {
        await this.initStatements()
        
        try {
            return this.statements.getServerNameList.all().map(row => row.name)
        } catch (error) {
            console.error('Error getting server name list:', error)
            throw error
        }
    }

    // Append servers from a NWDB snapshot object (data.servers)
    async appendFromSnapshotObject(snapshot) {
        await this.initStatements()
        try {
            const REGION_TO_DB = {
                'us-east-1': { region: 'US East', timezone: 'America/New_York' },
                'us-west-2': { region: 'US West', timezone: 'America/Los_Angeles' },
                'eu-central-1': { region: 'EU Central', timezone: 'Europe/Berlin' },
                'sa-east-1': { region: 'SA East', timezone: 'America/Sao_Paulo' },
                'ap-southeast-2': { region: 'AP Southeast', timezone: 'Australia/Sydney' }
            }

            const rows = snapshot?.data?.servers || []
            const seen = new Set()
            let inserted = 0
            let duplicates = 0
            let skippedInactive = 0
            let skippedUnknownRegion = 0

            for (const row of rows) {
                if (!Array.isArray(row) || row.length < 9) continue
                const name = String(row[4] ?? '').trim()
                const awsRegion = String(row[6] ?? '')
                const state = String(row[8] ?? '')
                if (!name) continue
                if (state !== 'ACTIVE') { skippedInactive++; continue }
                const map = REGION_TO_DB[awsRegion]
                if (!map) { skippedUnknownRegion++; continue }
                const key = name.toLowerCase()
                if (seen.has(key)) { duplicates++; continue }
                seen.add(key)

                // Skip if already exists in DB
                const existing = this.statements.getByName.get(name)
                if (existing) { duplicates++; continue }

                try {
                    await this.create({ name, region: map.region, timezone: map.timezone, active_status: true })
                    inserted++
                } catch (err) {
                    // Treat creation conflicts as duplicates
                    duplicates++
                }
            }

            return { inserted, duplicates, skippedInactive, skippedUnknownRegion, totalProcessed: rows.length }
        } catch (error) {
            console.error('Error appending servers from snapshot:', error)
            throw error
        }
    }

    // Import from a JSON file path (blocking read, main process only)
    async importFromFile(filePath) {
        await this.initStatements()
        try {
            const text = fs.readFileSync(filePath, 'utf-8')
            const json = JSON.parse(text)
            return await this.appendFromSnapshotObject(json)
        } catch (error) {
            console.error('Error importing servers from file:', error)
            throw error
        }
    }

    // Clear servers that are unused by characters or events
    async clearUnusedServers() {
        await this.initStatements()
        try {
            const all = this.statements.getAll.all()
            let deleted = 0
            let inUse = 0
            for (const s of all) {
                const charactersUsing = (await this.db.prepare('SELECT COUNT(*) as count FROM characters WHERE server_name = ?')).get(s.name)
                const eventsUsing = (await this.db.prepare('SELECT COUNT(*) as count FROM events WHERE server_name = ?')).get(s.name)
                if ((charactersUsing.count || 0) === 0 && (eventsUsing.count || 0) === 0) {
                    this.statements.delete.run(s.id)
                    deleted++
                } else {
                    inUse++
                }
            }
            return { deleted, skippedInUse: inUse }
        } catch (error) {
            console.error('Error clearing unused servers:', error)
            throw error
        }
    }

    // Utility method to get timezone for a server
    async getServerTimezone(serverName) {
        await this.initStatements()
        
        try {
            const server = this.statements.getByName.get(serverName)
            return server ? server.timezone : null
        } catch (error) {
            console.error('Error getting server timezone:', error)
            throw error
        }
    }

    // Initialize default servers
    async initializeDefaultServers() {
        await this.initStatements()
        
        try {
            // Check if servers already exist
            const existingServers = this.statements.getAll.all()
            if (existingServers.length > 0) {
                console.log('Servers already exist, skipping initialization')
                return
            }
            
            // Default New World servers with regions and timezones (current active servers)
            const defaultServers = [
                // US East
                { name: 'Hudsonland', region: 'US East', timezone: 'America/New_York' },
                { name: 'Pangea', region: 'US East', timezone: 'America/New_York' },
                { name: 'Valhalla', region: 'US East', timezone: 'America/New_York' },
                
                // US West
                { name: 'Aquarius', region: 'US West', timezone: 'America/Los_Angeles' },
                { name: 'El Dorado', region: 'US West', timezone: 'America/Los_Angeles' },
                
                // EU Central
                { name: 'Aries', region: 'EU Central', timezone: 'Europe/Berlin' },
                { name: 'Nysa', region: 'EU Central', timezone: 'Europe/Berlin' },
                
                // AP Southeast
                { name: 'Cerberus', region: 'AP Southeast', timezone: 'Australia/Sydney' },
                { name: 'Delos', region: 'AP Southeast', timezone: 'Australia/Sydney' },
                
                // SA East
                { name: 'Alkaid', region: 'SA East', timezone: 'America/Sao_Paulo' },
                { name: 'Devaloka', region: 'SA East', timezone: 'America/Sao_Paulo' }
            ]
            
            // Insert default servers
            for (const server of defaultServers) {
                await this.create({
                    name: server.name,
                    region: server.region,
                    timezone: server.timezone,
                    active_status: true
                })
            }
            
            console.log('Default servers initialized successfully')
        } catch (error) {
            console.error('Error initializing default servers:', error)
            throw error
        }
    }
}

// Export singleton instance
const serverService = new ServerService()
export default serverService 