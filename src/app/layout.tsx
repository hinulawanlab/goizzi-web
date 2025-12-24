import '../../styles/globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Goizzi CMS',
  description: 'Customer management system for Goizzi',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f0f2f5] font-sans text-slate-900">
        {children}
      </body>
    </html>
  );
}
