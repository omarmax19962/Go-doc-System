import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import { Toaster } from 'sonner'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir}>
      <body className="bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster
            position={dir === 'rtl' ? 'bottom-left' : 'bottom-right'}
            richColors
          />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
