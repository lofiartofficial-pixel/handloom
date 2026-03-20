'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, formatDate } from '@/lib/utils'
import { TrendingUp, ShoppingBag, Users, Package } from 'lucide-react'
import dynamic from 'next/dynamic'

const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })

export default function AdminReportsPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, products: 0 })
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const [{ data: orders }, { count: customers }, { count: products }] = await Promise.all([
        supabase.from('orders').select('total, payment_status, created_at').eq('payment_status', 'paid'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ])

      const revenue = (orders || []).reduce((s, o) => s + parseFloat(o.total), 0)

      setStats({ revenue, orders: orders?.length || 0, customers: customers || 0, products: products || 0 })

      // Monthly data
      const monthly: Record<string, number> = {}
      ;(orders || []).forEach(o => {
        const month = o.created_at?.slice(0, 7) || ''
        monthly[month] = (monthly[month] || 0) + parseFloat(o.total)
      })
      setMonthlyData(Object.entries(monthly).sort().slice(-6).map(([month, revenue]) => ({
        month: month.replace(/^\d{4}-/, ''),
        revenue,
      })))

      // Top products
      const { data: items } = await supabase
        .from('order_items')
        .select('product_name, quantity')
        .limit(100)

      const productTotals: Record<string, number> = {}
      ;(items || []).forEach(i => { productTotals[i.product_name] = (productTotals[i.product_name] || 0) + i.quantity })
      setTopProducts(
        Object.entries(productTotals)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, qty]) => ({ name: name.slice(0, 25), qty }))
      )
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatPrice(stats.revenue), icon: TrendingUp, color: 'text-green-600 bg-green-100' },
          { label: 'Total Orders', value: stats.orders.toString(), icon: ShoppingBag, color: 'text-purple-600 bg-purple-100' },
          { label: 'Customers', value: stats.customers.toString(), icon: Users, color: 'text-blue-600 bg-blue-100' },
          { label: 'Products', value: stats.products.toString(), icon: Package, color: 'text-amber-600 bg-amber-100' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-800">{s.value}</div>
            <div className="text-gray-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4">Monthly Revenue (Last 6 months)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `Rs.${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatPrice(v), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#7F77DD" strokeWidth={2.5} dot={{ fill: '#7F77DD', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4">Top Selling Products</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                <Tooltip formatter={(v: number) => [`${v} sold`, 'Quantity']} />
                <Bar dataKey="qty" fill="#534AB7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
