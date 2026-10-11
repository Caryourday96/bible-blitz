import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://adeticket.com'),
  alternates: { canonical: '/bibleblitz' },
  title: 'Bible Blitz — Know the Word. Beat the Clock.',
  description:
    'A fast, joyful Bible word scramble game. Gather your teams, buzz in, and make game night a little more legendary.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
