import { useCallback, useEffect, useRef, useState } from 'react'
import { db, type TableName } from '../lib/db'

/**
 * Runs an async query and re-runs it whenever any of `tables` changes — Supabase
 * Realtime when configured, cross-tab local events otherwise. This is what makes an
 * order placed in one tab appear in the admin dashboard in another.
 */
export function useLiveQuery<T>(
  query: () => Promise<T>,
  tables: TableName[],
  deps: unknown[] = [],
): { data: T | null; loading: boolean; error: string | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const queryRef = useRef(query)
  queryRef.current = query

  const run = useCallback(async () => {
    try {
      setError(null)
      const result = await queryRef.current()
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong loading this data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const tableKey = tables.join(',')
  useEffect(() => {
    const off = db.subscribe(tables, () => run())
    return () => off()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableKey, run])

  return { data, loading, error, reload: run }
}

/** Convenience wrapper for async actions with a busy flag and friendly errors. */
export function useAction() {
  const [busy, setBusy] = useState(false)
  const run = useCallback(
    async <R,>(fn: () => Promise<R>, handlers?: { onSuccess?: (r: R) => void; onError?: (m: string) => void }) => {
      if (busy) return
      setBusy(true)
      try {
        const result = await fn()
        handlers?.onSuccess?.(result)
        return result
      } catch (e) {
        handlers?.onError?.(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      } finally {
        setBusy(false)
      }
    },
    [busy],
  )
  return { busy, run }
}
