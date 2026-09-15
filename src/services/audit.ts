import { db, uid } from '../lib/db'
import type { AuditLog } from '../types'

/**
 * Central audit trail (section 7 / 33). Every module that mutates state
 * important to governance calls `auditService.log()` so the Admin ▸ Audit Log
 * page renders one chronological feed of who-did-what.
 */
export const auditService = {
  list: (limit = 200) =>
    db.select<AuditLog>('audit_logs', { order: { column: 'created_at', ascending: false }, limit }),

  log: (input: { actor_name: string; action: string; entity: string; entity_id?: string | null; detail: string }) =>
    db.insert<AuditLog>('audit_logs', {
      id: uid('adt'),
      actor_name: input.actor_name,
      action: input.action,
      entity: input.entity,
      entity_id: input.entity_id ?? null,
      detail: input.detail,
    }),
}
