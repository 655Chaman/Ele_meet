import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Ele Meet — Tactical Matchmaking Copilot',
  description: 'Real-time AI-powered tactical matchmaking copilot for high-stakes B2B sales and partnerships.',
};

export const viewport: Viewport = {
  themeColor: '#090909',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ colorScheme: 'dark' }}>
      <head>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
