import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BillUploadForm from '@/components/bills/bill-upload-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'

export default async function BillUploadPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accessRows } = await supabase
    .from('accountant_access')
    .select('owner_id')
    .eq('accountant_id', user.id)
  const ownerIds = [user.id, ...(accessRows?.map(r => r.owner_id) ?? [])]

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .in('owner_id', ownerIds)
    .order('name', { ascending: true })

  return (
    <div className="max-w-2xl">
      <Link href="/bills" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Bills
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload New Bill</h1>
      <Suspense>
        <BillUploadForm suppliers={suppliers ?? []} />
      </Suspense>
    </div>
  )
}
