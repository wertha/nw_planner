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
      getAll: await this.db.prepare('SELECT * FROM event_templates ORDER BY name ASC'),
      getById: await this.db.prepare('SELECT * FROM event_templates WHERE id = ?'),
      getByName: await this.db.prepare('SELECT * FROM event_templates WHERE name = ?'),
      insert: await this.db.prepare(`
        INSERT INTO event_templates (
          name, event_type, description, location, participation_status,
          notification_enabled, notification_minutes,
          time_strategy, time_params, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      update: await this.db.prepare(`
        UPDATE event_templates SET
          name = ?, event_type = ?, description = ?, location = ?, participation_status = ?,
          notification_enabled = ?, notification_minutes = ?,
          time_strategy = ?, time_params = ?, payload_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `),
      delete: await this.db.prepare('DELETE FROM event_templates WHERE id = ?')
    }

    // Seed defaults only if table is empty
    try {
      const countStmt = await this.db.prepare('SELECT COUNT(*) as c FROM event_templates')
      const row = countStmt.get()
      if ((row?.c || 0) === 0) {
        this.db.insertDefaultEventTemplates()
      }
    } catch (e) {
      // ignore seed errors; not critical
    }

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
      time_strategy: template.time_strategy || null,
      time_params: template.time_params ? (typeof template.time_params === 'string' ? template.time_params : JSON.stringify(template.time_params)) : null,
      payload_json: template.payload_json ? (typeof template.payload_json === 'string' ? template.payload_json : JSON.stringify(template.payload_json)) : null
    }

    const res = this.statements.insert.run(
      t.name, t.event_type, t.description, t.location, t.participation_status,
      t.notification_enabled, t.notification_minutes,
      t.time_strategy, t.time_params, t.payload_json
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
      time_params: partial.time_params !== undefined ? (typeof partial.time_params === 'string' ? partial.time_params : JSON.stringify(partial.time_params)) : existing.time_params,
      payload_json: partial.payload_json !== undefined ? (typeof partial.payload_json === 'string' ? partial.payload_json : JSON.stringify(partial.payload_json)) : existing.payload_json
    }
    const res = this.statements.update.run(
      merged.name, merged.event_type, merged.description, merged.location, merged.participation_status,
      merged.notification_enabled, merged.notification_minutes,
      merged.time_strategy, merged.time_params, merged.payload_json, id
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


