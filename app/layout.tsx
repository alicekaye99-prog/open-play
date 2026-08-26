import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Pikol Legends — Ranked Pickleball',
  description: 'Esports Pickleball Competitive Engine & Elo MMR Manager',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pikol Legends',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#07080c',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark select-none">
      <body className="bg-[#07080c] text-slate-100 antialiased min-h-screen overscroll-none">
        {children}
      </body>
    </html>
  );
}
