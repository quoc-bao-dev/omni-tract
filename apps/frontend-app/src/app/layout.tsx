import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'OmniTract — Social All-in-one',
  description: 'Theo dõi tăng trưởng nội dung mạng xã hội theo thời gian.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} h-full`}
    >
      <body className="flex h-full flex-col overflow-hidden">{children}</body>
    </html>
  );
}
