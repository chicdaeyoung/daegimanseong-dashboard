'use client'

import { useState } from 'react'
import { updateReceiptLine } from './actions'

type Item = { id: string; name: string; base_unit: string }
type Line = {
  id: string
  item_id: string
  quantity: number
  unit_price: number
  supply_amount: number
  items?: Item | null
}
type Receipt = {
  id: string
  receipt_date: string
  inventory_receipt_items: Line[]
}

export default function ReceiptEditForm({
  receipt,
  items,
}: {
  receipt: Receipt
  items: Item[]
}) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState<string | null>(null)

  async function handleSubmit(lineId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(lineId)
    setErrors(prev => ({ ...prev, [lineId]: '' }))

    const result = await updateReceiptLine(new FormData(e.currentTarget))
    if (result?.error) {
      setErrors(prev => ({ ...prev, [lineId]: result.error }))
    }
    setPending(null)
  }

  return (
    <div className="space-y-4">
      {receipt.inventory_receipt_items.map(line => (
        <form
          key={line.id}
          onSubmit={e => handleSubmit(line.id, e)}
          className="bg-white border border-gray-200 rounded-xl p-4 space-y-3"
        >
          <input type="hidden" name="receipt_id" value={receipt.id} />
          <input type="hidden" name="line_id"    value={line.id} />

          <div className="font-medium text-gray-900">
            {line.items?.name ?? '알 수 없는 품목'}
            <span className="ml-2 text-xs text-gray-400">
              ({line.items?.base_unit})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">수량</label>
              <input
                name="quantity"
                type="number"
                step="0.001"
                min="0.001"
                defaultValue={line.quantity}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg
                           text-sm text-gray-900 focus:outline-none focus:ring-2
                           focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">단가 (원)</label>
              <input
                name="unit_price"
                type="number"
                min="0"
                defaultValue={line.unit_price}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg
                           text-sm text-gray-900 focus:outline-none focus:ring-2
                           focus:ring-blue-500"
              />
            </div>
          </div>

          {errors[line.id] && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {errors[line.id]}
            </p>
          )}

          <button
            type="submit"
            disabled={pending === line.id}
            className="w-full py-2 bg-blue-600 text-white text-sm font-medium
                       rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {pending === line.id ? '저장 중...' : '이 라인 저장'}
          </button>
        </form>
      ))}

      <a
        href={`/inventory/receipts/${receipt.id}`}
        className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-2"
      >
        ← 취소하고 돌아가기
      </a>
    </div>
  )
}
