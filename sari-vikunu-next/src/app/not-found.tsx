import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function NotFound() {
  const t = await getTranslations('common')

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🥻</div>
        <h1 className="font-display text-4xl font-bold text-deep mb-3">
          404
        </h1>
        <h2 className="font-display text-xl font-semibold text-gray-700 mb-2">
          Page Not Found
        </h2>
        <p className="font-sinhala text-gray-500 mb-8">
          ඔබ සොයන පිටුව හමු නොවිණි. ගෙදරට යමු!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-deep text-white px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition"
          >
            🏠 Go Home
          </Link>
          <Link
            href="/shop"
            className="btn-gold px-6 py-3 rounded-full font-semibold"
          >
            🥻 Browse Sarees
          </Link>
        </div>
      </div>
    </main>
  )
}
