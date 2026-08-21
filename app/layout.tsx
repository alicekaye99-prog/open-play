import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Open Play — Ranked Pickleball Session',
  description: 'Night Match Pickleball Open-Play Session & Elo MMR Manager',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b1220] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
