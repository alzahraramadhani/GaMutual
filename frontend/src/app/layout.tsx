import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GaMutual - Instagram Mutual & Unfollower Tracker',
  description: 'Kelola mutual & relasi Instagram Anda dengan aman, cepat, dan transparan',
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${jakarta.variable} font-sans`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="referrer" content="no-referrer" />
      </head>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
