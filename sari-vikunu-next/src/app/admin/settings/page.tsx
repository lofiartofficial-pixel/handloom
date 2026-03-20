'use client'

import { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminSettingsPage() {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    supabase.from('settings').select('key, value').then(({ data }) => {
      const map: Record<string, string> = {}
      data?.forEach(s => map[s.key] = s.value || '')
      setSettings(map)
    })
  }, [])

  const handleSave = () => {
    startTransition(async () => {
      for (const [key, value] of Object.entries(settings)) {
        await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() })
      }
      toast.success('Settings saved! ✅')
    })
  }

  const Field = ({ label, settingKey, type = 'text', placeholder = '' }: { label: string; settingKey: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={settings[settingKey] || ''}
        onChange={e => setSettings(p => ({ ...p, [settingKey]: e.target.value }))}
        placeholder={placeholder}
        className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
      />
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">

      {/* Shop Info */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-800 border-b pb-3">Shop Information</h2>
        <Field label="Shop Name" settingKey="shop_name" placeholder="Sari Vikunu" />
        <Field label="Shop Name (Sinhala)" settingKey="shop_name_si" placeholder="සාරි විකුණු" />
        <Field label="Shop Email" settingKey="shop_email" type="email" placeholder="info@sarivikunu.lk" />
        <Field label="Shop Phone" settingKey="shop_phone" placeholder="+94 70 123 4567" />
        <Field label="Address" settingKey="shop_address" placeholder="Colombo, Sri Lanka" />
      </div>

      {/* WhatsApp */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-800 border-b pb-3">WhatsApp Settings</h2>
        <div>
          <Field label="WhatsApp Number (without + sign)" settingKey="whatsapp_number" placeholder="94701234567" />
          <p className="text-xs text-gray-400 mt-1">Example: 94701234567 (country code + number, no spaces)</p>
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-800 border-b pb-3">Shipping</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Shipping Cost (Rs.)" settingKey="shipping_cost" type="number" placeholder="350" />
          <Field label="Free Shipping Above (Rs.)" settingKey="free_shipping_above" type="number" placeholder="5000" />
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-800 border-b pb-3">Social Media</h2>
        <Field label="Facebook URL" settingKey="facebook_url" placeholder="https://facebook.com/sarivikunu" />
        <Field label="Instagram URL" settingKey="instagram_url" placeholder="https://instagram.com/sarivikunu" />
      </div>

      <button onClick={handleSave} disabled={isPending}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60">
        {isPending ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Settings</>}
      </button>
    </div>
  )
}
