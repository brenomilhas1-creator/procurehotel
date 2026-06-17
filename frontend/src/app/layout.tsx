import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Compra Facil Hoteis — Compras inteligentes para hotelaria',
  description: 'Plataforma de procurement inteligente para hotelaria e restauração',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
