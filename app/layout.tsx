import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { StarknetProvider } from '@/providers/StarknetProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SatSafe — Private Bitcoin Savings on Starknet',
  description: 'Save privately. Earn silently. Own completely.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StarknetProvider>
          {children}
        </StarknetProvider>
      </body>
    </html>
  );
}