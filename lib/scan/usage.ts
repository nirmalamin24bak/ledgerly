import { createServiceClient } from '@/lib/supabase/server'

export type Plan = 'free' | 'pro' | 'enterprise'

export const PLAN_LIMITS: Record<Plan, number> = {
  free: 20,
  pro: 200,
  enterprise: Infinity,
}

export function getCurrentYearMonth(): string {
  return new Date().toISOString().slice(0, 7) // e.g. '2026-04'
}

export async function getScanCount(userId: string, yearMonth: string): Promise<number> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('scan_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('year_month', yearMonth)
    .single()
  return data?.count ?? 0
}

export async function incrementScanCount(userId: string, yearMonth: string): Promise<void> {
  const supabase = createServiceClient()
  await supabase.rpc('increment_scan_count', { p_user_id: userId, p_year_month: yearMonth })
}
