'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { AlertTriangle, Package, Edit3, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getStockStatus, formatPrice } from '@/lib/utils'

export default function AdminInventoryPage() {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [products, setProducts] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStock, setEditStock] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')

  useEffect(() => {
    supabase.from('products')
      .select('id, name, name_si, sku, price, stock_quantity, images, categories(name)')
      .eq('is_active', true)
      .order('stock_quantity', { ascending: true })
      .then(({ data }) => setProducts(data || []))
  }, [])

  const filtered = products.filter(p => {
    if (filter === 'low') return p.stock_quantity > 0 && p.stock_quantity <= 5
    if (filter === 'out') return p.stock_quantity === 0
    return true
  })

  const updateStock = (id: string, current: number) => {
    setEditingId(id)
    setEditStock(current.toString())
  }

  const saveStock = (id: string) => {
    const newStock = parseInt(editStock)
    if (isNaN(newStock) || newStock < 0) { toast.error('Invalid stock value'); return }

    startTransition(async () => {
      await supabase.from('products').update({ stock_quantity: newStock, updated_at: new Date().toISOString() }).eq('id', id)
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock_quantity: newStock } : p))
      setEditingId(null)
      toast.success('Stock updated!')
    })
  }

  const outCount = products.filter(p => p.stock_quantity === 0).length
  const lowCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Products', value: products.length, color: 'border-purple-500' },
          { label: 'Low Stock', value: lowCount, color: 'border-orange-500', urgent: lowCount > 0 },
          { label: 'Out of Stock', value: outCount, color: 'border-red-500', urgent: outCount > 0 },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${s.color}`}>
            <div className={`text-2xl font-bold ${s.urgent ? 'text-red-600' : 'text-gray-800'}`}>{s.value}</div>
            <div className="text-gray-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'low', 'out'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === f ? 'bg-purple-600 text-white' : 'bg-white border text-gray-600 hover:border-purple-300'}`}>
            {f === 'all' ? 'All' : f === 'low' ? `Low Stock (${lowCount})` : `Out of Stock (${outCount})`}
          </button>
        ))}
      </div>

      {/* Products table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Stock</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(product => {
              const stock = getStockStatus(product.stock_quantity)
              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-purple-50 rounded-lg overflow-hidden relative flex-shrink-0">
                        {product.images?.[0]
                          ? <Image src={product.images[0]} alt="" fill className="object-cover" sizes="40px" />
                          : <div className="w-full h-full flex items-center justify-center text-lg">🥻</div>}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 line-clamp-1">{product.name}</p>
                        <p className="text-gray-400 text-xs">{product.categories?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{product.sku || '—'}</td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3">
                    {editingId === product.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editStock}
                          onChange={e => setEditStock(e.target.value)}
                          className="w-20 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') saveStock(product.id); if (e.key === 'Escape') setEditingId(null) }}
                        />
                        <button onClick={() => saveStock(product.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-red-500 hover:bg-red-50 rounded"><X size={14} /></button>
                      </div>
                    ) : (
                      <span className={`font-bold text-lg ${stock.color}`}>{product.stock_quantity}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${stock.color}`}>
                      {stock.urgent && <AlertTriangle size={12} />}
                      {stock.label}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => updateStock(product.id, product.stock_quantity)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <Edit3 size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
