import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'FindIt Campus | The Digital Curator for Lost & Found',
    template: '%s | FindIt Campus',
  },
  description:
    'FindIt is a smart campus lost-and-found platform. Report lost items, browse found items, and get AI-powered matches — all in one place.',
  keywords: ['lost and found', 'campus', 'college', 'FindIt', 'student'],
  openGraph: {
    type: 'website',
    title: 'FindIt Campus',
    description: 'The smarter way to recover lost items on campus.',
    siteName: 'FindIt Campus',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
