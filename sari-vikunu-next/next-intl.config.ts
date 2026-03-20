import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

const locales = ['si', 'en'] as const
export type Locale = (typeof locales)[number]

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale

  if (!locales.includes(locale as Locale)) notFound()

  return {
    locale: locale as string,
    messages: (await import(`./src/messages/${locale}.json`)).default,
  }
})
