/**
 * Root Layout - Next.js 14 App Router
 */
import type { Metadata } from 'next';
import '../styles/globals.css';
import { DataClientProvider } from '../components/providers/DataClientProvider';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Next.js 14 Admin Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DataClientProvider>
          {children}
        </DataClientProvider>
      </body>
    </html>
  );
}