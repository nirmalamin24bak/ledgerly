import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const patchSchema = z.object({
  account_type: z.enum(['individual', 'company']).optional(),
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  gstin: z.string().regex(/^[0-9A-Z]{15}$/, 'GSTIN must be 15 alphanumeric characters').optional().nullable(),
  pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN must be 10 chars (e.g. ABCDE1234F)').optional().nullable(),
  address: z.string().optional(),
})

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { account_type, name, phone, company_name, gstin, pan_number, address } = parsed.data
  const service = createServiceClient()

  // Update auth metadata if account_type or name changed
  const metaUpdates: Record<string, string> = {}
  if (account_type !== undefined) metaUpdates.account_type = account_type
  if (name !== undefined) metaUpdates.name = name

  if (Object.keys(metaUpdates).length > 0) {
    const { error } = await service.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, ...metaUpdates },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update user_profiles for profile/business fields
  const profileUpdates: Record<string, string | null | undefined> = {}
  if (name !== undefined) profileUpdates.name = name
  if (phone !== undefined) profileUpdates.phone = phone
  if (company_name !== undefined) profileUpdates.company_name = company_name
  if (gstin !== undefined) profileUpdates.gstin = gstin
  if (pan_number !== undefined) profileUpdates.pan_number = pan_number
  if (address !== undefined) profileUpdates.address = address

  if (Object.keys(profileUpdates).length > 0) {
    const { error } = await supabase
      .from('user_profiles')
      .update(profileUpdates)
      .eq('id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
