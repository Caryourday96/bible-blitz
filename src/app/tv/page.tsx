import type { Metadata } from 'next';
import { CastDisplay } from '@/components/CastDisplay';
export const metadata: Metadata = {
  title: 'Bible Blitz — TV',
  robots: { index: false, follow: false },
};
export default function TVPage() {
  return <CastDisplay />;
}
