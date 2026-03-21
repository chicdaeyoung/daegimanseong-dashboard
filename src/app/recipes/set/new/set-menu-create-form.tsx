'use client'

import { useState } from 'react'
import { createSetMenu } from './actions'

type Menu = { id: string; name: string; category: string | null }

export default function SetMenuCreateForm({ menus }: { menus: Menu[] }) {
  const [components, setComponents] = useState<{ id: string; qty: number }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function addComponent(menuId: string) {
    if (components.find(c => c.id === menuId)) return
    setComponents(prev => [...prev, { id: menuId, qty: 1 }])
  }

  function removeComponent(menuId: string) {
    setComponents(prev => prev.filter(c => c.id !== menuId))
  }

  function updateQty(menuId: string, qty: number) {
    setComponents(prev =>
      prev.map(c => c.id === menuId ? { ...c, qty } : c)
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    components.forEach(c => {
      fd.append('component_ids', c.id)
      fd.append('component_qtys', String(c.qty))
    })

    const result = await createSetMenu(fd)
    if (result?.error) {
      setError(result.error)
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">세트명</label>
          <input name="name" required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">코드</label>
          <input name="code" required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
          <input name="category"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">판매가 (원)</label>
          <input name="sale_price" type="number" min="0" required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">구성 단품 선택</label>
        <div className="border border-gray-200 rounded-lg divide-y max-h-60 overflow-y-auto">
          {menus.map(menu => (
            <div key={menu.id}
              className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer"
              onClick={() => addComponent(menu.id)}>
              <span className="text-sm text-gray-900">{menu.name}</span>
              <span className="text-xs text-gray-400">{menu.category}</span>
            </div>
          ))}
        </div>
      </div>

      {components.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">선택된 구성</label>
          <div className="space-y-2">
            {components.map(comp => {
              const menu = menus.find(m => m.id === comp.id)
              return (
                <div key={comp.id} className="flex items-center gap-3 bg-blue-50 px-3 py-2 rounded-lg">
                  <span className="flex-1 text-sm text-gray-900">{menu?.name}</span>
                  <input
                    type="number" min="0.5" step="0.5"
                    value={comp.qty}
                    onChange={e => updateQty(comp.id, parseFloat(e.target.value))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center text-gray-900"
                  />
                  <span className="text-xs text-gray-500">인분</span>
                  <button type="button" onClick={() => removeComponent(comp.id)}
                    className="text-red-400 hover:text-red-600 text-sm">✕</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending}
          className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {pending ? '등록 중...' : '세트메뉴 등록'}
        </button>
        <a href="/recipes"
          className="flex-1 py-2.5 text-center bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
          취소
        </a>
      </div>
    </form>
  )
}
