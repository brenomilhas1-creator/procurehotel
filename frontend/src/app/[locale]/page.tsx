import { redirect } from 'next/navigation';
import { unstable_setRequestLocale } from 'next-intl/server';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  unstable_setRequestLocale(locale);
  redirect(`/${locale}/dashboard`);
}
