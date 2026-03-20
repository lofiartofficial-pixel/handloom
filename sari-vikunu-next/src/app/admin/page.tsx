import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import {
  ShoppingBag, TrendingUp, Users,
  Package, AlertTriangle, ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard | Admin' }

// Revalidate every 5 minutes
export const revalidate = 300

export default async function AdminDashboard() {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // Auth check (middleware handles redirect but double-check)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  // Fetch all dashboard data in parallel
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [
    { count: totalOrders },
    { data: revenueData },
    { count: pendingOrders },
    { count: todayOrders },
    { count: totalCustomers },
    { data: recentOrders },
    { data: lowStockProducts },
    { data: monthlyRevenue },
  ] = await Promise.all([
    adminSupabase.from('orders').select('*', { count: 'exact', head: true }),
    adminSupabase.from('orders').select('total').eq('payment_status', 'paid'),
    adminSupabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    adminSupabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today),
    adminSupabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    adminSupabase.from('orders')
      .select('id, order_number, customer_name, total, status, payment_method, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    adminSupabase.from('products')
      .select('id, name, stock_quantity, images')
      .eq('is_active', true)
      .lte('stock_quantity', 3)
      .order('stock_quantity', { ascending: true })
      .limit(5),
    adminSupabase.from('orders')
      .select('total, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', monthStart),
  ])

  const totalRevenue = (revenueData || []).reduce((sum, o) => sum + parseFloat(o.total), 0)
  const monthRevenue = (monthlyRevenue || []).reduce((sum, o) => sum + parseFloat(o.total), 0)
  const todayRevenue = (revenueData || [])
    .filter(o => o.created_at?.startsWith(today))
    .reduce((sum, o) => sum + parseFloat(o.total), 0)

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-indigo-100 text-indigo-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Orders',
            value: totalOrders?.toLocaleString() || '0',
            sub: `${todayOrders} today`,
            icon: ShoppingBag,
            color: 'border-purple-500',
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
          },
          {
            label: 'Total Revenue',
            value: `Rs. ${(totalRevenue / 1000).toFixed(0)}k`,
            sub: `Rs. ${monthRevenue.toLocaleString()} this month`,
            icon: TrendingUp,
            color: 'border-green-500',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
          },
          {
            label: 'Pending Orders',
            value: pendingOrders?.toString() || '0',
            sub: 'Need attention',
            icon: AlertTriangle,
            color: 'border-yellow-500',
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-600',
          },
          {
            label: 'Customers',
            value: totalCustomers?.toLocaleString() || '0',
            sub: 'Registered users',
            icon: Users,
            color: 'border-blue-500',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${stat.color}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                <p className="text-gray-400 text-xs mt-1">{stat.sub}</p>
              </div>
              <div className={`w-11 h-11 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={stat.iconColor} size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-purple-600 text-sm hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs uppercase border-b">
                  <th className="text-left pb-3 font-semibold">Order</th>
                  <th className="text-left pb-3 font-semibold">Customer</th>
                  <th className="text-left pb-3 font-semibold">Amount</th>
                  <th className="text-left pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(recentOrders || []).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 group">
                    <td className="py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs text-purple-600 group-hover:text-purple-800"
                      >
                        #{order.order_number}
                      </Link>
                    </td>
                    <td className="py-3 text-gray-800 font-medium truncate max-w-[120px]">
                      {order.customer_name}
                    </td>
                    <td className="py-3 font-semibold text-gray-800">
                      Rs. {parseFloat(order.total).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              Low Stock
            </h2>
            <Link href="/admin/inventory" className="text-orange-600 text-sm hover:underline">
              Manage
            </Link>
          </div>

          {lowStockProducts && lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}/edit`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-orange-50 transition group"
                >
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-lg">🥻</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-orange-700">
                      {product.name}
                    </p>
                    <p className={`text-xs font-bold ${product.stock_quantity === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                      {product.stock_quantity === 0 ? '❌ Out of stock' : `⚠️ Only ${product.stock_quantity} left`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <Package size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">All products well stocked! ✅</p>
            </div>
          )}
        </div>
      </div>

      {/* Today Revenue Banner */}
      {todayRevenue > 0 && (
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Today's Revenue 🌸</p>
              <p className="text-3xl font-bold mt-1">Rs. {todayRevenue.toLocaleString()}</p>
            </div>
            <div className="text-5xl opacity-20">💰</div>
          </div>
        </div>
      )}
    </div>
  )
}
