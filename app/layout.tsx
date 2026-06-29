import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import QueryProvider from '@/components/QueryProvider';
import ConditionalChatbot from '@/components/ConditionalChatbot';
import { ToastProvider } from '@/components/ui/ToastProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Renacer - Centro Médico | Tecnología y Excelencia en Salud',
  description:
    'Centro médico de vanguardia que combina excelencia profesional con tecnología avanzada para brindarte la mejor atención médica.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} w-full overflow-x-hidden`}>
      <body
        className={`${inter.className} font-sans w-full overflow-x-hidden ensigna-page-bg text-ensigna-text antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
              <ConditionalChatbot />
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}