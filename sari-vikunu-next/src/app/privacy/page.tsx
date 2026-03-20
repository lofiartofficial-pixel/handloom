import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy | Sari Vikunu' }

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="text-purple-600 text-sm hover:underline mb-6 inline-block">← Back</Link>
      <h1 className="font-display text-3xl font-bold text-gray-800 mb-8">Privacy Policy</h1>
      <div className="prose text-gray-600 space-y-6">
        <section>
          <h2 className="font-display text-xl font-bold text-gray-800 mb-3">Information We Collect</h2>
          <p>We collect information you provide when placing orders: name, phone number, email address, and delivery address. This information is used solely to process and deliver your orders.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-gray-800 mb-3">How We Use Your Information</h2>
          <p>Your information is used to process orders, send order confirmations via WhatsApp/email, and improve our service. We do not sell or share your personal information with third parties.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-gray-800 mb-3">Payment Security</h2>
          <p>Payments are processed securely through PayHere. We do not store credit card information. All transactions are encrypted using SSL technology.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-gray-800 mb-3">Contact Us</h2>
          <p>For privacy concerns, contact us at <a href="mailto:info@sarivikunu.lk" className="text-purple-600 hover:underline">info@sarivikunu.lk</a></p>
        </section>
      </div>
    </main>
  )
}
