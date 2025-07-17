import database from './database.js'

class TaskService {
    constructor() {
        this.db = database
        this.statementsInitialized = false
        this.statements = {}
    }

    async initStatements() {
        if (this.statementsInitialized) return
        
        // Ensure database is initialized
        await this.db.ensureInitialized()
        
        // Prepare all SQL statements for better performance
        this.statements = {
            insertTask: await this.db.prepare(`
                INSERT INTO tasks (name, description, type, priority, rewards)
                VALUES (?, ?, ?, ?, ?)
            `),
            updateTask: await this.db.prepare(`
                UPDATE tasks 
                SET name = ?, description = ?, type = ?, priority = ?, rewards = ?
                WHERE id = ?
            `),
            deleteTask: await this.db.prepare('DELETE FROM tasks WHERE id = ?'),
            getTaskById: await this.db.prepare('SELECT * FROM tasks WHERE id = ?'),
            getAllTasks: await this.db.prepare('SELECT * FROM tasks ORDER BY priority DESC, name ASC'),
            getTasksByType: await this.db.prepare('SELECT * FROM tasks WHERE type = ? ORDER BY priority DESC, name ASC'),
            
            // Task assignments
            assignTaskToCharacter: await this.db.prepare(`
                INSERT OR IGNORE INTO task_assignments (task_id, character_id)
                VALUES (?, ?)
            `),
            removeTaskAssignment: await this.db.prepare('DELETE FROM task_assignments WHERE task_id = ? AND character_id = ?'),
            getTaskAssignments: await this.db.prepare(`
                SELECT ta.*, t.name as task_name, t.type, t.priority, c.name as character_name
                FROM task_assignments ta
                JOIN tasks t ON ta.task_id = t.id
                JOIN characters c ON ta.character_id = c.id
                ORDER BY t.priority DESC, t.name ASC
            `),
            getCharacterTasks: await this.db.prepare(`
                SELECT t.*, ta.assigned_at
                FROM tasks t
                JOIN task_assignments ta ON t.id = ta.task_id
                WHERE ta.character_id = ?
                ORDER BY t.priority DESC, t.name ASC
            `),
            
            // Task completions
            markTaskComplete: await this.db.prepare(`
                INSERT OR REPLACE INTO task_completions (task_id, character_id, reset_period, streak_count)
                VALUES (?, ?, ?, COALESCE(
                    (SELECT streak_count + 1 FROM task_completions 
                     WHERE task_id = ? AND character_id = ? AND reset_period = ?),
                    1
                ))
            `),
            markTaskIncomplete: await this.db.prepare(`
                DELETE FROM task_completions 
                WHERE task_id = ? AND character_id = ? AND reset_period = ?
            `),
            getTaskCompletions: await this.db.prepare(`
                SELECT tc.*, t.name as task_name, t.type, t.priority, c.name as character_name
                FROM task_completions tc
                JOIN tasks t ON tc.task_id = t.id
                JOIN characters c ON tc.character_id = c.id
                WHERE tc.reset_period = ?
                ORDER BY tc.completed_at DESC
            `),
            getCharacterCompletions: await this.db.prepare(`
                SELECT tc.*, t.name as task_name, t.type, t.priority
                FROM task_completions tc
                JOIN tasks t ON tc.task_id = t.id
                WHERE tc.character_id = ? AND tc.reset_period = ?
                ORDER BY tc.completed_at DESC
            `),
            isTaskComplete: await this.db.prepare(`
                SELECT COUNT(*) as completed
                FROM task_completions
                WHERE task_id = ? AND character_id = ? AND reset_period = ?
            `),
            
            // Statistics
            getTaskStats: await this.db.prepare(`
                SELECT 
                    COUNT(*) as total_tasks,
                    COUNT(CASE WHEN type = 'daily' THEN 1 END) as daily_tasks,
                    COUNT(CASE WHEN type = 'weekly' THEN 1 END) as weekly_tasks,
                    COUNT(CASE WHEN priority = 'Critical' THEN 1 END) as critical_tasks,
                    COUNT(CASE WHEN priority = 'High' THEN 1 END) as high_tasks
                FROM tasks
            `),
            getCompletionStats: await this.db.prepare(`
                SELECT 
                    tc.character_id,
                    c.name as character_name,
                    COUNT(*) as total_completions,
                    COUNT(CASE WHEN t.type = 'daily' THEN 1 END) as daily_completions,
                    COUNT(CASE WHEN t.type = 'weekly' THEN 1 END) as weekly_completions,
                    AVG(tc.streak_count) as avg_streak
                FROM task_completions tc
                JOIN tasks t ON tc.task_id = t.id
                JOIN characters c ON tc.character_id = c.id
                WHERE tc.reset_period = ?
                GROUP BY tc.character_id, c.name
            `)
        }
        
        this.statementsInitialized = true
    }

    async ensureInitialized() {
        await this.db.ensureInitialized()
        await this.initStatements()
    }

    // Task CRUD operations
    async createTask(taskData) {
        await this.ensureInitialized()
        
        const { name, description, type, priority, rewards } = taskData
        
        const result = this.statements.insertTask.run(
            name,
            description || null,
            type,
            priority || 'Medium',
            rewards || null
        )
        
        if (result.changes > 0) {
            return await this.getTaskById(result.lastInsertRowid)
        }
        
        return null
    }

    async updateTask(id, taskData) {
        await this.ensureInitialized()
        
        const { name, description, type, priority, rewards } = taskData
        
        const result = this.statements.updateTask.run(
            name,
            description || null,
            type,
            priority || 'Medium',
            rewards || null,
            id
        )
        
        if (result.changes > 0) {
            return await this.getTaskById(id)
        }
        
        return null
    }

    async deleteTask(id) {
        await this.ensureInitialized()
        
        const result = this.statements.deleteTask.run(id)
        return result.changes > 0
    }

    async getTaskById(id) {
        await this.ensureInitialized()
        
        return this.statements.getTaskById.get(id) || null
    }

    async getAllTasks() {
        await this.ensureInitialized()
        
        return this.statements.getAllTasks.all()
    }

    async getTasksByType(type) {
        await this.ensureInitialized()
        
        return this.statements.getTasksByType.all(type)
    }

    // Task assignment operations
    async assignTaskToCharacter(taskId, characterId) {
        await this.ensureInitialized()
        
        const result = this.statements.assignTaskToCharacter.run(taskId, characterId)
        return result.changes > 0
    }

    async removeTaskAssignment(taskId, characterId) {
        await this.ensureInitialized()
        
        const result = this.statements.removeTaskAssignment.run(taskId, characterId)
        return result.changes > 0
    }

    async getTaskAssignments() {
        await this.ensureInitialized()
        
        return this.statements.getTaskAssignments.all()
    }

    async getCharacterTasks(characterId) {
        await this.ensureInitialized()
        
        return this.statements.getCharacterTasks.all(characterId)
    }

    // Task completion operations
    async markTaskComplete(taskId, characterId, resetPeriod = null) {
        await this.ensureInitialized()
        
        if (!resetPeriod) {
            resetPeriod = this.getCurrentResetPeriod('daily') // Default to daily
        }
        
        const result = this.statements.markTaskComplete.run(
            taskId, characterId, resetPeriod, taskId, characterId, resetPeriod
        )
        return result.changes > 0
    }

    async markTaskIncomplete(taskId, characterId, resetPeriod = null) {
        await this.ensureInitialized()
        
        if (!resetPeriod) {
            resetPeriod = this.getCurrentResetPeriod('daily') // Default to daily
        }
        
        const result = this.statements.markTaskIncomplete.run(taskId, characterId, resetPeriod)
        return result.changes > 0
    }

    async isTaskComplete(taskId, characterId, resetPeriod = null) {
        await this.ensureInitialized()
        
        if (!resetPeriod) {
            resetPeriod = this.getCurrentResetPeriod('daily') // Default to daily
        }
        
        const result = this.statements.isTaskComplete.get(taskId, characterId, resetPeriod)
        return result.completed > 0
    }

    async getTaskCompletions(resetPeriod = null) {
        await this.ensureInitialized()
        
        if (!resetPeriod) {
            resetPeriod = this.getCurrentResetPeriod('daily') // Default to daily
        }
        
        return this.statements.getTaskCompletions.all(resetPeriod)
    }

    async getCharacterCompletions(characterId, resetPeriod = null) {
        await this.ensureInitialized()
        
        if (!resetPeriod) {
            resetPeriod = this.getCurrentResetPeriod('daily') // Default to daily
        }
        
        return this.statements.getCharacterCompletions.all(characterId, resetPeriod)
    }

    // Statistics
    async getTaskStats() {
        await this.ensureInitialized()
        
        return this.statements.getTaskStats.get()
    }

    async getCompletionStats(resetPeriod = null) {
        await this.ensureInitialized()
        
        if (!resetPeriod) {
            resetPeriod = this.getCurrentResetPeriod('daily') // Default to daily
        }
        
        return this.statements.getCompletionStats.all(resetPeriod)
    }

    // Helper methods
    getCurrentResetPeriod(type) {
        const now = new Date()
        
        if (type === 'daily') {
            return now.toISOString().split('T')[0] // YYYY-MM-DD format
        } else if (type === 'weekly') {
            const year = now.getFullYear()
            const weekNumber = this.getWeekNumber(now)
            return `${year}-W${weekNumber.toString().padStart(2, '0')}`
        }
        
        return now.toISOString().split('T')[0]
    }

    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
    }

    // Get tasks with completion status for a character
    async getCharacterTasksWithStatus(characterId) {
        await this.ensureInitialized()
        
        const tasks = await this.getCharacterTasks(characterId)
        const dailyResetPeriod = this.getCurrentResetPeriod('daily')
        const weeklyResetPeriod = this.getCurrentResetPeriod('weekly')
        
        return tasks.map(task => {
            const resetPeriod = task.type === 'weekly' ? weeklyResetPeriod : dailyResetPeriod
            const isComplete = this.statements.isTaskComplete.get(task.id, characterId, resetPeriod)
            
            return {
                ...task,
                completed: isComplete.completed > 0,
                resetPeriod
            }
        })
    }
}

// Export a singleton instance
export default new TaskService() 