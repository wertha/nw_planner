import database from './database.js'

class EventTemplateService {
  constructor() {
    this.db = database
    this.initialized = false
    this.statements = {}
  }

  async ensureInitialized() {
    if (this.initialized) return
    await this.db.ensureInitialized()

    // Prepare statements
    this.statements = {
      getAll: this.db.prepare('SELECT * FROM event_templates ORDER BY name ASC'),
      getById: this.db.prepare('SELECT * FROM event_templates WHERE id = ?'),
      getByName: this.db.prepare('SELECT * FROM event_templates WHERE name = ?'),
      insert: this.db.prepare(`
        INSERT INTO event_templates (
          name, event_type, description, location, participation_status,
          notification_enabled, notification_minutes, preferred_time_mode,
          timezone_source, template_server_name, template_server_timezone,
          time_strategy, time_params
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      update: this.db.prepare(`
        UPDATE event_templates SET
          name = ?, event_type = ?, description = ?, location = ?, participation_status = ?,
          notification_enabled = ?, notification_minutes = ?, preferred_time_mode = ?,
          timezone_source = ?, template_server_name = ?, template_server_timezone = ?,
          time_strategy = ?, time_params = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `),
      delete: this.db.prepare('DELETE FROM event_templates WHERE id = ?')
    }

    // Seed defaults
    this.db.insertDefaultEventTemplates()

    this.initialized = true
  }

  async getAll() {
    await this.ensureInitialized()
    return this.statements.getAll.all()
  }

  async getById(id) {
    await this.ensureInitialized()
    return this.statements.getById.get(id) || null
  }

  async create(template) {
    await this.ensureInitialized()

    const t = {
      name: template.name,
      event_type: template.event_type || null,
      description: template.description || null,
      location: template.location || null,
      participation_status: template.participation_status || 'Signed Up',
      notification_enabled: template.notification_enabled ? 1 : 0,
      notification_minutes: typeof template.notification_minutes === 'number' ? template.notification_minutes : 30,
      preferred_time_mode: template.preferred_time_mode || 'local',
      timezone_source: template.timezone_source || null,
      template_server_name: template.template_server_name || null,
      template_server_timezone: template.template_server_timezone || null,
      time_strategy: template.time_strategy || null,
      time_params: template.time_params ? (typeof template.time_params === 'string' ? template.time_params : JSON.stringify(template.time_params)) : null
    }

    const res = this.statements.insert.run(
      t.name, t.event_type, t.description, t.location, t.participation_status,
      t.notification_enabled, t.notification_minutes, t.preferred_time_mode,
      t.timezone_source, t.template_server_name, t.template_server_timezone,
      t.time_strategy, t.time_params
    )
    if (res.changes > 0) return this.getById(res.lastInsertRowid)
    return null
  }

  async update(id, partial) {
    await this.ensureInitialized()
    const existing = await this.getById(id)
    if (!existing) return null
    const merged = {
      ...existing,
      ...partial,
      notification_enabled: partial.notification_enabled !== undefined ? (partial.notification_enabled ? 1 : 0) : existing.notification_enabled,
      notification_minutes: partial.notification_minutes !== undefined ? partial.notification_minutes : existing.notification_minutes,
      time_params: partial.time_params !== undefined ? (typeof partial.time_params === 'string' ? partial.time_params : JSON.stringify(partial.time_params)) : existing.time_params
    }
    const res = this.statements.update.run(
      merged.name, merged.event_type, merged.description, merged.location, merged.participation_status,
      merged.notification_enabled, merged.notification_minutes, merged.preferred_time_mode,
      merged.timezone_source, merged.template_server_name, merged.template_server_timezone,
      merged.time_strategy, merged.time_params, id
    )
    if (res.changes > 0) return this.getById(id)
    return null
  }

  async delete(id) {
    await this.ensureInitialized()
    const res = this.statements.delete.run(id)
    return res.changes > 0
  }
}

export default new EventTemplateService()


