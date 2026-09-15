import { db, uid } from '../lib/db'
import type { Branch } from '../types'

export const branchService = {
  list: () => db.select<Branch>('branches', { order: { column: 'name', ascending: true } }),

  create: (values: Partial<Branch>) =>
    db.insert<Branch>('branches', { id: uid('brc'), active: true, is_main: false, ...values }),

  update: (id: string, patch: Partial<Branch>) => db.update<Branch>('branches', id, patch),

  remove: (id: string) => db.remove('branches', id),
}
