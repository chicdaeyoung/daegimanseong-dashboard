'use server'

import { getItemReceiptHistory } from '@/lib/inventory/queries'

export async function fetchItemReceiptHistory(itemId: string) {
  return getItemReceiptHistory(itemId)
}
