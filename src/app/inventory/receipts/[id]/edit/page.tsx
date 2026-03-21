import { getSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ReceiptEditForm from './receipt-edit-form'

export default async function ReceiptEditPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await getSupabaseServerClient()
  if (!supabase) notFound()

  const { data: receipt } = await supabase
    .from('inventory_receipts')
    .select('*, inventory_receipt_items(*, items(*))')
    .eq('id', params.id)
    .single()

  if (!receipt || receipt.status === 'cancelled') notFound()

  const { data: items } = await supabase
    .from('items')
    .select('id, name, base_unit')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">입고 수정</h1>
      <ReceiptEditForm receipt={receipt} items={items ?? []} />
    </div>
  )
}
