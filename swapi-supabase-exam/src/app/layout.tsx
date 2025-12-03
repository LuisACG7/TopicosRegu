// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SWAPI + Supabase Exam',
  description: 'Examen: API interna con Supabase y SWAPI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <header className="border-b bg-slate-900 text-slate-50">
          <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 text-sm">
            <span className="font-semibold tracking-wide">
              SWAPI Supabase Exam
            </span>
            <div className="space-x-4">
              <Link href="/">Inicio</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/login">Login</Link>
              <Link href="/register">Registro</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
