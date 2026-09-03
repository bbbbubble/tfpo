import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://bbbbubble.github.io/tfpo/'),
  title: 'TFPO — Token-Level Objective Fusion for Stable Preference Alignment',
  description:
    'TFPO routes each response token between preference optimization and likelihood anchoring for stronger, more stable alignment.',
  alternates: { canonical: 'https://bbbbubble.github.io/tfpo/' },
  openGraph: {
    type: 'website',
    url: 'https://bbbbubble.github.io/tfpo/',
    title: 'TFPO — Token-Level Objective Fusion for Stable Preference Alignment',
    description:
      'A learned token-wise route between preference optimization and likelihood anchoring.',
    images: [{ url: 'https://bbbbubble.github.io/tfpo/og.png', width: 1536, height: 864, alt: 'TFPO research project page' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TFPO — Token-Level Objective Fusion for Stable Preference Alignment',
    description:
      'A learned token-wise route between preference optimization and likelihood anchoring.',
    images: ['https://bbbbubble.github.io/tfpo/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
