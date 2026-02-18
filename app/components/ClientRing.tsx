'use client';

import dynamic from 'next/dynamic';

const RingConfigurator = dynamic(
  () => import('./RingConfigurator'),
  { ssr: false }
);

export default function ClientRing() {
  return <RingConfigurator />;
}
