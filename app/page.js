import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// This page is fully interactive (card-opening sequence, countdown, cursor,
// audio, etc.), so it is rendered client-side only.
const Invitation = dynamic(() => import('../components/Invitation'), { ssr: false });

export default function Home() {
  return (
    <Suspense fallback={null}>
      <Invitation />
    </Suspense>
  );
}
