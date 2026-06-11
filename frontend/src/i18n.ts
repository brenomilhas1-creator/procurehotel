import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['pt-PT', 'en'] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = 'pt-PT';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = (requested || defaultLocale) as AppLocale;
  if (!locales.includes(locale)) notFound();
  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default,
  };
});
