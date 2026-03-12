import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Ticket Concierge',
  description: 'Local-first Cloud Run–ready scaffold'
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <Providers>
          <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8">
            <header className="mb-8 border-b border-slate-800 pb-4">
              <h1 className="text-xl font-semibold tracking-tight">Ticket Concierge</h1>
              <p className="text-sm text-slate-400">
                Phase 1 foundation — scaffold only, no business features yet.
              </p>
            </header>
            <main className="flex-1">{props.children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

