'use client'

import { useState, useTransition, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Plus, Upload, Search, Edit2, Trash2,
  Eye, EyeOff, Download, Loader2, FileSpreadsheet,
  ChevronLeft, ChevronRight, X, Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadProductImage } from '@/lib/image'
import { parseCSV, formatPrice, getStockStatus, slugify } from '@/lib/utils'
import { productSchema } from '@/lib/validations'
import type { Product } from '@/types/product'

const PAGE_SIZE = 20

export default function AdminProductsPage() {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  // Modals
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[] | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '', name_si: '', price: '', sale_price: '',
    stock_quantity: '0', description: '', fabric: '',
    color: '', occasion: '', is_featured: false,
  })
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Load products
  async function loadProducts(pageNum = 1, q = search) {
    setIsLoaded(false)
    let query = supabase
      .from('products')
      .select('*, categories(name, slug)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE - 1)

    if (q.trim()) {
      query = query.or(`name.ilike.%${q}%,name_si.ilike.%${q}%`)
    }

    const { data, count } = await query
    setProducts(data || [])
    setTotal(count || 0)
    setIsLoaded(true)
  }

  // Initialize on first render
  useState(() => { loadProducts() })

  // ============================================
  // IMAGE UPLOAD (Client-side WebP + EXIF strip)
  // ============================================
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setIsUploadingImage(true)
    const tempId = editProduct?.id || 'new-' + Date.now()

    for (const file of files.slice(0, 5)) {
      const url = await uploadProductImage(file, tempId, supabase)
      if (url) setUploadedImages(prev => [...prev, url])
    }
    setIsUploadingImage(false)
    toast.success(`${files.length} image(s) uploaded!`)
  }

  // ============================================
  // SAVE PRODUCT (Create or Update)
  // Fix: useTransition — UI stays responsive
  // ============================================
  async function handleSave() {
    const validation = productSchema.safeParse({
      ...formData,
      price: parseFloat(formData.price) || 0,
      sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
    })

    if (!validation.success) {
      toast.error(validation.error.errors[0].message)
      return
    }

    startTransition(async () => {
      const data = {
        ...validation.data,
        slug: slugify(formData.name),
        images: uploadedImages,
      }

      if (editProduct) {
        const { error } = await supabase
          .from('products')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editProduct.id)

        if (error) { toast.error('Update failed'); return }
        toast.success('Product updated! ✅')
      } else {
        const { error } = await supabase.from('products').insert(data)
        if (error) { toast.error(error.message); return }
        toast.success('Product created! 🎉')
      }

      setShowForm(false)
      setEditProduct(null)
      resetForm()
      loadProducts()
    })
  }

  function resetForm() {
    setFormData({ name: '', name_si: '', price: '', sale_price: '', stock_quantity: '0', description: '', fabric: '', color: '', occasion: '', is_featured: false })
    setUploadedImages([])
  }

  function openEditForm(product: Product) {
    setEditProduct(product)
    setFormData({
      name: product.name, name_si: product.name_si || '',
      price: product.price.toString(),
      sale_price: product.sale_price?.toString() || '',
      stock_quantity: product.stock_quantity.toString(),
      description: product.description || '',
      fabric: product.fabric || '', color: product.color || '',
      occasion: product.occasion || '', is_featured: product.is_featured,
    })
    setUploadedImages(product.images || [])
    setShowForm(true)
  }

  // ============================================
  // TOGGLE ACTIVE
  // Fix: useTransition keeps UI responsive
  // ============================================
  async function toggleActive(product: Product) {
    startTransition(async () => {
      await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id)
      loadProducts(page)
      toast.success(product.is_active ? 'Product hidden' : 'Product visible')
    })
  }

  // ============================================
  // DELETE with confirmation
  // ============================================
  async function handleDelete(productId: string) {
    startTransition(async () => {
      await supabase.from('products').update({ is_active: false }).eq('id', productId)
      setDeleteConfirm(null)
      loadProducts(page)
      toast.success('Product deleted')
    })
  }

  // ============================================
  // BULK CSV UPLOAD
  // Fix: Preview before insert, validate all rows
  // ============================================
  function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rows = parseCSV(text)
      setCsvPreview(rows)
    }
    reader.readAsText(file)
  }

  async function confirmBulkUpload() {
    if (!csvPreview) return

    startTransition(async () => {
      let success = 0
      let failed = 0

      for (const row of csvPreview) {
        const productData = {
          name: row.name || row.Name || '',
          name_si: row.name_si || row['Name (Sinhala)'] || null,
          price: parseFloat(row.price || row.Price || '0'),
          sale_price: row.sale_price ? parseFloat(row.sale_price) : null,
          stock_quantity: parseInt(row.stock_quantity || row.Stock || '0'),
          description: row.description || null,
          fabric: row.fabric || null,
          color: row.color || null,
          occasion: row.occasion || null,
          slug: slugify(row.name || row.Name || `product-${Date.now()}`),
          images: [],
          is_active: true,
          is_featured: false,
        }

        if (!productData.name || !productData.price) { failed++; continue }

        const { error } = await supabase.from('products').insert(productData)
        error ? failed++ : success++
      }

      toast.success(`Bulk upload: ${success} added, ${failed} failed`)
      setCsvPreview(null)
      setShowBulkUpload(false)
      loadProducts()
    })
  }

  // ============================================
  // CSV TEMPLATE DOWNLOAD
  // ============================================
  function downloadTemplate() {
    const csv = 'name,name_si,price,sale_price,stock_quantity,fabric,color,occasion,description\n' +
      'Kanchipuram Silk Saree,කංචිපුරම් සිල්ක් සාරි,15000,12000,5,Silk,Red,Wedding,Beautiful wedding saree\n' +
      'Cotton Daily Wear,කොටන් සාරිය,3500,,10,Cotton,Blue,Casual,Comfortable daily wear'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'products-template.csv'; a.click()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{total} products total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowBulkUpload(true)}
            className="flex items-center gap-2 border border-gray-200 hover:border-purple-300 text-gray-700 hover:text-purple-700 px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            <FileSpreadsheet size={15} /> Bulk Upload
          </button>
          <button
            onClick={() => { resetForm(); setEditProduct(null); setShowForm(true) }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            <Plus size={15} /> Add Product
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadProducts(1, search)}
          placeholder="Search products..."
          className="w-full pl-11 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => {
                const stock = getStockStatus(product.stock_quantity)
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-14 bg-purple-50 rounded-lg overflow-hidden relative flex-shrink-0">
                          {product.images?.[0] ? (
                            <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="44px" />
                          ) : <div className="w-full h-full flex items-center justify-center text-xl">🥻</div>}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 line-clamp-1">{product.name}</p>
                          {product.name_si && <p className="font-sinhala text-gray-400 text-xs line-clamp-1">{product.name_si}</p>}
                          {product.is_featured && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Featured</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{(product.categories as any)?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{formatPrice(product.sale_price || product.price)}</div>
                      {product.sale_price && <div className="text-gray-400 line-through text-xs">{formatPrice(product.price)}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold text-sm ${stock.color}`}>{product.stock_quantity}</span>
                      {stock.urgent && <div className={`text-xs ${stock.color}`}>{stock.label}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {product.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditForm(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => toggleActive(product)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition" title={product.is_active ? 'Hide' : 'Show'}>
                          {product.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={() => setDeleteConfirm(product.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button onClick={() => { setPage(p => p - 1); loadProducts(page - 1) }} disabled={page === 1}
                className="p-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => { setPage(p => p + 1); loadProducts(page + 1) }} disabled={page >= totalPages}
                className="p-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============ PRODUCT FORM MODAL ============ */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">

              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-800 text-lg">
                  {editProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={() => { setShowForm(false); setEditProduct(null); resetForm() }} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Images (WebP auto-convert)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {uploadedImages.map((img, i) => (
                      <div key={i} className="relative w-16 h-20 rounded-lg overflow-hidden">
                        <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                        <button onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
                      </div>
                    ))}
                    <label className="w-16 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition text-gray-400 text-xs">
                      {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <><Upload size={16} /><span>Add</span></>}
                      <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="sr-only" disabled={isUploadingImage} />
                    </label>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Product Name *</label>
                    <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      placeholder="Kanchipuram Silk Saree"
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">සිංහල නම</label>
                    <input value={formData.name_si} onChange={e => setFormData(p => ({ ...p, name_si: e.target.value }))}
                      placeholder="කංචිපුරම් සිල්ක් සාරිය"
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-sinhala" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Price (Rs.) *</label>
                    <input value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
                      type="number" placeholder="15000"
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Sale Price (optional)</label>
                    <input value={formData.sale_price} onChange={e => setFormData(p => ({ ...p, sale_price: e.target.value }))}
                      type="number" placeholder="12000"
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Stock Quantity</label>
                    <input value={formData.stock_quantity} onChange={e => setFormData(p => ({ ...p, stock_quantity: e.target.value }))}
                      type="number" min="0"
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Fabric</label>
                    <input value={formData.fabric} onChange={e => setFormData(p => ({ ...p, fabric: e.target.value }))}
                      placeholder="Silk, Cotton, Chiffon..."
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Color</label>
                    <input value={formData.color} onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
                      placeholder="Red, Blue, Gold..."
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Occasion</label>
                    <input value={formData.occasion} onChange={e => setFormData(p => ({ ...p, occasion: e.target.value }))}
                      placeholder="Wedding, Casual, Party..."
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    rows={3} placeholder="Describe this saree..."
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.is_featured}
                    onChange={e => setFormData(p => ({ ...p, is_featured: e.target.checked }))}
                    className="rounded accent-purple-600 w-4 h-4" />
                  <span className="text-sm font-semibold text-gray-700">Featured product (show on homepage)</span>
                </label>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setShowForm(false); resetForm() }}
                    className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={isPending}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60">
                    {isPending ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> {editProduct ? 'Update' : 'Create'}</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ BULK UPLOAD MODAL ============ */}
      <AnimatePresence>
        {showBulkUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">

              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-800 text-lg">Bulk Upload Products</h2>
                <button onClick={() => { setShowBulkUpload(false); setCsvPreview(null) }} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {!csvPreview ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                    <p className="font-semibold mb-1">CSV Format Required:</p>
                    <code className="text-xs">name, name_si, price, sale_price, stock_quantity, fabric, color, occasion, description</code>
                  </div>
                  <button onClick={downloadTemplate}
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-800 text-sm font-medium">
                    <Download size={15} /> Download Template CSV
                  </button>
                  <label className="block border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-purple-400 transition">
                    <FileSpreadsheet size={32} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 font-medium">Upload CSV file</p>
                    <p className="text-xs text-gray-400 mt-1">Click to browse</p>
                    <input type="file" accept=".csv" onChange={handleCSVUpload} className="sr-only" />
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-800">{csvPreview.length} products ready to import</p>
                    <button onClick={() => setCsvPreview(null)} className="text-gray-400 hover:text-gray-600 text-sm">
                      ← Re-upload
                    </button>
                  </div>
                  <div className="overflow-x-auto max-h-64 border rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {Object.keys(csvPreview[0]).map(h => (
                            <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {csvPreview.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="px-3 py-2 text-gray-700 max-w-[120px] truncate">{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setShowBulkUpload(false); setCsvPreview(null) }}
                      className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-50 transition">
                      Cancel
                    </button>
                    <button onClick={confirmBulkUpload} disabled={isPending}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60">
                      {isPending ? <><Loader2 size={15} className="animate-spin" /> Importing...</> : <><Upload size={15} /> Import {csvPreview.length} Products</>}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ DELETE CONFIRM ============ */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="font-bold text-gray-800 mb-2">Delete Product?</h3>
              <p className="text-gray-500 text-sm mb-5">
                This will hide the product from the shop. Are you sure?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} disabled={isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60">
                  {isPending ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
