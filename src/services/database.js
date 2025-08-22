import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import os from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class DatabaseService {
    constructor() {
        this.db = null
        this.initialized = false
    }

    async init(userDataPath = null) {
        if (this.initialized) return
        
        // Use provided path or default to user data directory
        let dbPath
        if (userDataPath) {
            dbPath = path.join(userDataPath, 'nw_planner.db')
        } else {
            // Fallback for development/web mode
            const homeDir = os.homedir()
            const appDataDir = path.join(homeDir, '.nw-planner')
            
            // Create directory if it doesn't exist
            try {
                const fs = await import('fs')
                await fs.promises.mkdir(appDataDir, { recursive: true })
            } catch (error) {
                console.error('Error creating app data directory:', error)
            }
            
            dbPath = path.join(appDataDir, 'nw_planner.db')
        }
        
        console.log('Initializing database at:', dbPath)
        this.db = new Database(dbPath)
        
        // Enable foreign keys
        this.db.pragma('foreign_keys = ON')
        
        // Create tables
        this.createTables()
        
        this.initialized = true
    }

    createTables() {
        // Servers table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS servers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                region TEXT NOT NULL CHECK(region IN ('AP Southeast', 'SA East', 'US West', 'US East', 'EU Central')),
                timezone TEXT NOT NULL,
                active_status BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)

        // Characters table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS characters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                server_name TEXT NOT NULL,
                server_timezone TEXT NOT NULL,
                faction TEXT CHECK(faction IN ('Factionless', 'Marauders', 'Covenant', 'Syndicate')) DEFAULT 'Factionless',
                company TEXT,
                active_status BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                avatar_path TEXT
            )
        `)

        // Task definitions
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                type TEXT CHECK(type IN ('daily', 'weekly', 'one-time')) NOT NULL,
                priority TEXT CHECK(priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
                rewards TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)

        // Task assignments to characters
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS task_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
                character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(task_id, character_id)
            )
        `)

        // Task completion tracking
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS task_completions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
                character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reset_period TEXT NOT NULL,
                streak_count INTEGER DEFAULT 1,
                UNIQUE(task_id, character_id, reset_period)
            )
        `)

        // Events table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                event_type TEXT NOT NULL,
                server_name TEXT,
                event_time TIMESTAMP NOT NULL,
                timezone TEXT NOT NULL,
                character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
                participation_status TEXT CHECK(participation_status IN ('Signed Up', 'Confirmed', 'Absent', 'Tentative')) DEFAULT 'Signed Up',
                location TEXT,
                recurring_pattern TEXT,
                notification_enabled BOOLEAN DEFAULT 1,
                notification_minutes INTEGER DEFAULT 30,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)

        // Event templates table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS event_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                event_type TEXT,
                description TEXT,
                location TEXT,
                participation_status TEXT CHECK(participation_status IN ('Signed Up','Confirmed','Absent','Tentative')) DEFAULT 'Signed Up',
                notification_enabled BOOLEAN DEFAULT 1,
                notification_minutes INTEGER DEFAULT 30,
                preferred_time_mode TEXT CHECK(preferred_time_mode IN ('local','server')) DEFAULT 'local',
                timezone_source TEXT CHECK(timezone_source IN ('templateServer','selectedCharacter','local')) DEFAULT NULL,
                template_server_name TEXT,
                template_server_timezone TEXT,
                time_strategy TEXT CHECK(time_strategy IN ('relativeOffset','nextDayAtTime','nextWeekdayAtTime','fixedDateTime')) DEFAULT NULL,
                time_params TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)

        // Create indexes for performance
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_servers_region ON servers(region);
            CREATE INDEX IF NOT EXISTS idx_servers_name ON servers(name);
            CREATE INDEX IF NOT EXISTS idx_characters_server ON characters(server_name);
            CREATE INDEX IF NOT EXISTS idx_task_completions_character ON task_completions(character_id);
            CREATE INDEX IF NOT EXISTS idx_task_completions_reset_period ON task_completions(reset_period);
            CREATE INDEX IF NOT EXISTS idx_events_character ON events(character_id);
            CREATE INDEX IF NOT EXISTS idx_events_time ON events(event_time);
            CREATE INDEX IF NOT EXISTS idx_event_templates_name ON event_templates(name);
        `)

        // Create triggers for timestamp updates
        this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_character_timestamp 
                BEFORE UPDATE ON characters 
                FOR EACH ROW 
                BEGIN
                    UPDATE characters SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                END;
        `)

        // Apply lightweight migrations
        this.migrateTasksTableForOneTime()

        // Note: Default tasks are no longer automatically inserted to keep the app clean
        // Users can manually add tasks or import data if needed
    }

    insertDefaultEventTemplates() {
        const defaults = [
            {
                name: 'War',
                event_type: 'War',
                participation_status: 'Signed Up',
                notification_enabled: 1,
                notification_minutes: 60,
                preferred_time_mode: 'server',
                timezone_source: 'selectedCharacter',
                template_server_name: null,
                template_server_timezone: null,
                time_strategy: 'relativeOffset',
                time_params: JSON.stringify({ offsetMinutes: 60 })
            }
        ]

        const checkStmt = this.db.prepare('SELECT id FROM event_templates WHERE name = ?')
        const insertStmt = this.db.prepare(`
            INSERT INTO event_templates (
                name, event_type, description, location,
                participation_status, notification_enabled, notification_minutes,
                preferred_time_mode, timezone_source, template_server_name, template_server_timezone,
                time_strategy, time_params
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

        defaults.forEach(t => {
            const existing = checkStmt.get(t.name)
            if (!existing) {
                insertStmt.run(
                    t.name, t.event_type || null, t.description || null, t.location || null,
                    t.participation_status || 'Signed Up', t.notification_enabled ? 1 : 0, typeof t.notification_minutes === 'number' ? t.notification_minutes : 30,
                    t.preferred_time_mode || 'local', t.timezone_source || null, t.template_server_name || null, t.template_server_timezone || null,
                    t.time_strategy || null, t.time_params || null
                )
            }
        })
    }

    migrateTasksTableForOneTime() {
        try {
            const row = this.db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'").get()
            const createSql = row?.sql || ''
            if (!createSql.includes("'one-time'")) {
                console.log('Migrating tasks table to include one-time type...')
                // Temporarily disable foreign key checks for table rebuild
                this.db.exec('PRAGMA foreign_keys=OFF;')
                this.db.exec(`
                    BEGIN TRANSACTION;
                    CREATE TABLE tasks_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        description TEXT,
                        type TEXT CHECK(type IN ('daily', 'weekly', 'one-time')) NOT NULL,
                        priority TEXT CHECK(priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
                        rewards TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    INSERT INTO tasks_new (id, name, description, type, priority, rewards, created_at)
                        SELECT id, name, description, type, priority, rewards, created_at FROM tasks;
                    DROP TABLE tasks;
                    ALTER TABLE tasks_new RENAME TO tasks;
                    COMMIT;
                `)
                this.db.exec('PRAGMA foreign_keys=ON;')
                console.log('Tasks table migration complete.')
            }
        } catch (error) {
            console.error('Tasks table migration failed:', error)
            try { this.db.exec('PRAGMA foreign_keys=ON;') } catch (_) {}
        }
    }

    insertDefaultTasks() {
        const defaultTasks = [
            // Weekly
            { name: 'Mutated Dungeons', description: '', type: 'weekly', priority: 'Medium', rewards: null },
            { name: 'Hive of Gorgons', description: '', type: 'weekly', priority: 'Medium', rewards: null },
            { name: 'Trial of the Devourer (Sandworm)', description: '', type: 'weekly', priority: 'Medium', rewards: null },
            { name: 'FFA Goldcursed Coconut', description: '', type: 'weekly', priority: 'Medium', rewards: null },
            // Daily
            { name: 'Faction Bonus Missions', description: '', type: 'daily', priority: 'Medium', rewards: null },
            { name: 'Gypsum From Faction Vendor', description: '', type: 'daily', priority: 'Medium', rewards: null }
        ]

        const checkTask = this.db.prepare('SELECT id FROM tasks WHERE name = ?')
        const insertTask = this.db.prepare('INSERT INTO tasks (name, description, type, priority, rewards) VALUES (?, ?, ?, ?, ?)')

        defaultTasks.forEach(task => {
            const existing = checkTask.get(task.name)
            if (!existing) {
                insertTask.run(task.name, task.description, task.type, task.priority, task.rewards)
            }
        })
    }

    // Ensure database is initialized
    async ensureInitialized() {
        if (!this.initialized) {
            await this.init()
        }
    }

    // Generic query methods
    async prepare(sql) {
        await this.ensureInitialized()
        return this.db.prepare(sql)
    }

    async exec(sql) {
        await this.ensureInitialized()
        return this.db.exec(sql)
    }

    async transaction(fn) {
        await this.ensureInitialized()
        return this.db.transaction(fn)
    }

    close() {
        if (this.db) {
            this.db.close()
        }
    }

    // Delete all data from the database
    async deleteAllData() {
        await this.ensureInitialized()
        
        const deleteTaskCompletions = this.db.prepare('DELETE FROM task_completions')
        const deleteTaskAssignments = this.db.prepare('DELETE FROM task_assignments')
        const deleteEvents = this.db.prepare('DELETE FROM events')
        const deleteTasks = this.db.prepare('DELETE FROM tasks')
        const deleteCharacters = this.db.prepare('DELETE FROM characters')
        const deleteServers = this.db.prepare('DELETE FROM servers')
        
        const tx = this.db.transaction(() => {
            deleteTaskCompletions.run()
            deleteTaskAssignments.run()
            deleteEvents.run()
            deleteTasks.run()
            deleteCharacters.run()
            deleteServers.run()
        })
        
        tx()
        
        console.log('All data deleted from database')
        return true
    }

    // Export all data from the database
    async exportData() {
        await this.ensureInitialized()
        
        const data = {
            characters: this.db.prepare('SELECT * FROM characters').all(),
            tasks: this.db.prepare('SELECT * FROM tasks').all(),
            events: this.db.prepare('SELECT * FROM events').all(),
            task_assignments: this.db.prepare('SELECT * FROM task_assignments').all(),
            task_completions: this.db.prepare('SELECT * FROM task_completions').all(),
            servers: this.db.prepare('SELECT * FROM servers').all(),
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        }
        
        return data
    }
}

// Export singleton instance
const database = new DatabaseService()
export default database 